import * as signalR from '@microsoft/signalr';
import { authService } from '../api';

const API_BASE_URL = 'https://localhost:7288';

/**
 * Enterprise-grade SignalR Service
 * 
 * Features:
 * - Singleton pattern with strict lifecycle management
 * - React StrictMode compatible
 * - No parallel start() calls
 * - Exponential backoff with jitter
 * - Clean event handling
 * - TypeScript strict typing
 */
class SignalRService {
    private connection: signalR.HubConnection | null = null;
    private listeners: Map<string, Set<(message: string) => void>> = new Map();

    // Lifecycle flags
    private connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' = 'disconnected';
    private startPromise: Promise<void> | null = null;
    private stopPromise: Promise<void> | null = null;

    // Retry configuration
    private readonly MAX_RETRY_ATTEMPTS = 5;
    private readonly BASE_DELAY_MS = 1000;
    private readonly MAX_DELAY_MS = 30000;
    private manualRetryAttempts = 0;
    private manualRetryTimeout: ReturnType<typeof setTimeout> | null = null;

    /**
     * Start SignalR connection
     * Safe to call multiple times - returns existing connection
     */
    async start(): Promise<void> {
        // If already connected, return immediately
        if (this.connectionState === 'connected' && this.connection?.state === signalR.HubConnectionState.Connected) {
            console.log('[SignalR] ✅ Already connected');
            return;
        }

        // If connecting, wait for existing start operation
        if (this.startPromise) {
            console.log('[SignalR] ⏳ Waiting for existing connection...');
            return this.startPromise;
        }

        // If stopping, wait for stop to complete first
        if (this.stopPromise) {
            console.log('[SignalR] ⏳ Waiting for stop operation...');
            await this.stopPromise;
        }

        // Check auth token
        const token = authService.getToken();
        if (!token) {
            console.log('[SignalR] ⚠️ No auth token, skipping connection');
            return;
        }

        // Create new start promise
        this.startPromise = this.internalStart(token);

        try {
            await this.startPromise;
        } finally {
            this.startPromise = null;
        }
    }

    /**
     * Internal start implementation
     */
    private async internalStart(token: string): Promise<void> {
        this.connectionState = 'connecting';

        try {
            // Create connection only if doesn't exist or is disposed
            if (!this.connection || this.connection.state === signalR.HubConnectionState.Disconnected) {
                this.connection = this.createConnection(token);
            }

            // Start connection
            await this.connection.start();

            this.connectionState = 'connected';
            this.manualRetryAttempts = 0;
            console.log('[SignalR] ✅ Connected successfully');

        } catch (error) {
            this.connectionState = 'disconnected';
            console.error('[SignalR] ❌ Connection failed:', error);

            // Handle manual retry with exponential backoff
            this.scheduleRetry();

            throw error;
        }
    }

    /**
     * Create and configure SignalR connection
     */
    private createConnection(token: string): signalR.HubConnection {
        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`${API_BASE_URL}/hubs/notification`, {
                accessTokenFactory: () => token,
                skipNegotiation: true,
                transport: signalR.HttpTransportType.WebSockets,
            })
            .withAutomaticReconnect({
                nextRetryDelayInMilliseconds: (retryContext) => {
                    if (retryContext.previousRetryCount >= this.MAX_RETRY_ATTEMPTS) {
                        console.log('[SignalR] ❌ Max automatic retry attempts reached');
                        return null;
                    }

                    const delay = this.calculateBackoffDelay(retryContext.previousRetryCount);
                    console.log(`[SignalR] 🔄 Auto-reconnect attempt ${retryContext.previousRetryCount + 1} in ${delay}ms`);
                    return delay;
                }
            })
            .configureLogging(signalR.LogLevel.Information)
            .build();

        // Setup event handlers
        this.setupEventHandlers(connection);

        return connection;
    }

    /**
     * Setup connection event handlers
     */
    private setupEventHandlers(connection: signalR.HubConnection): void {
        // Receive notification event - backend sends object { message, taskId }
        connection.on('ReceiveNotification', (payload: unknown) => {
            try {
                console.log('[SignalR] 📬 Notification received:', payload);

                // Handle both string and object payloads
                let messageToSend: string;
                if (typeof payload === 'string') {
                    messageToSend = payload;
                } else if (typeof payload === 'object' && payload !== null) {
                    // Serialize object to JSON string for listeners
                    messageToSend = JSON.stringify(payload);
                } else {
                    messageToSend = String(payload);
                }

                this.notifyListeners('ReceiveNotification', messageToSend);
            } catch (error) {
                console.error('[SignalR] Error in notification handler:', error);
            }
        });

        // Reconnecting event
        connection.onreconnecting((error) => {
            this.connectionState = 'reconnecting';
            console.log('[SignalR] 🔄 Reconnecting...', error?.message);
        });

        // Reconnected event
        connection.onreconnected((connectionId) => {
            this.connectionState = 'connected';
            this.manualRetryAttempts = 0;
            console.log('[SignalR] ✅ Reconnected:', connectionId);
        });

        // Close event
        connection.onclose((error) => {
            this.connectionState = 'disconnected';

            if (error) {
                console.log('[SignalR] ❌ Connection closed with error:', error.message);
            } else {
                console.log('[SignalR] 🔌 Connection closed');
            }
        });
    }

    /**
     * Stop SignalR connection
     * Safe to call multiple times
     */
    async stop(): Promise<void> {
        // If already disconnected, return
        if (this.connectionState === 'disconnected' && !this.connection) {
            console.log('[SignalR] Already disconnected');
            return;
        }

        // If stopping, wait for existing stop operation
        if (this.stopPromise) {
            console.log('[SignalR] ⏳ Waiting for existing stop...');
            return this.stopPromise;
        }

        // If connecting, wait for start to complete first
        if (this.startPromise) {
            console.log('[SignalR] ⏳ Waiting for start to complete before stopping...');
            await this.startPromise;
        }

        // Create stop promise
        this.stopPromise = this.internalStop();

        try {
            await this.stopPromise;
        } finally {
            this.stopPromise = null;
        }
    }

    /**
     * Internal stop implementation
     */
    private async internalStop(): Promise<void> {
        // Clear any pending retry
        this.clearRetryTimeout();

        if (!this.connection) {
            this.connectionState = 'disconnected';
            return;
        }

        try {
            // Only stop if not already disconnected
            if (this.connection.state !== signalR.HubConnectionState.Disconnected) {
                await this.connection.stop();
                console.log('[SignalR] 🔌 Disconnected');
            }
        } catch (error) {
            console.error('[SignalR] Error during stop:', error);
        } finally {
            this.connection = null;
            this.connectionState = 'disconnected';
        }
    }

    /**
     * Subscribe to SignalR events
     * Returns unsubscribe function
     */
    subscribe(event: string, callback: (message: string) => void): () => void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }

        this.listeners.get(event)!.add(callback);
        console.log(`[SignalR] 📝 Subscribed to '${event}' (${this.listeners.get(event)!.size} subscribers)`);

        // Return unsubscribe function
        return () => {
            const removed = this.listeners.get(event)?.delete(callback);
            if (removed) {
                console.log(`[SignalR] 📝 Unsubscribed from '${event}' (${this.listeners.get(event)?.size || 0} subscribers remaining)`);
            }
        };
    }

    /**
     * Notify all listeners for an event
     */
    private notifyListeners(event: string, message: string): void {
        const callbacks = this.listeners.get(event);
        if (!callbacks || callbacks.size === 0) {
            console.log(`[SignalR] No listeners for '${event}'`);
            return;
        }

        callbacks.forEach(callback => {
            try {
                callback(message);
            } catch (error) {
                console.error('[SignalR] Error in listener callback:', error);
            }
        });
    }

    /**
     * Schedule retry with exponential backoff + jitter
     */
    private scheduleRetry(): void {
        if (this.manualRetryAttempts >= this.MAX_RETRY_ATTEMPTS) {
            console.log('[SignalR] ❌ Max manual retry attempts reached');
            return;
        }

        const delay = this.calculateBackoffDelay(this.manualRetryAttempts);

        console.log(`[SignalR] 🔄 Scheduling retry ${this.manualRetryAttempts + 1}/${this.MAX_RETRY_ATTEMPTS} in ${delay}ms`);

        this.clearRetryTimeout();

        this.manualRetryTimeout = setTimeout(() => {
            this.manualRetryAttempts++;
            this.start().catch(err => {
                console.error('[SignalR] Retry failed:', err);
            });
        }, delay);
    }

    /**
     * Calculate exponential backoff delay with jitter
     */
    private calculateBackoffDelay(attemptNumber: number): number {
        const exponentialDelay = this.BASE_DELAY_MS * Math.pow(2, attemptNumber);
        const jitter = Math.random() * 1000; // Random 0-1000ms jitter
        const delay = Math.min(exponentialDelay + jitter, this.MAX_DELAY_MS);
        return Math.floor(delay);
    }

    /**
     * Clear retry timeout
     */
    private clearRetryTimeout(): void {
        if (this.manualRetryTimeout) {
            clearTimeout(this.manualRetryTimeout);
            this.manualRetryTimeout = null;
        }
    }

    /**
     * Get current connection state
     */
    getConnectionState(): signalR.HubConnectionState | null {
        return this.connection?.state ?? null;
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return (
            this.connectionState === 'connected' &&
            this.connection?.state === signalR.HubConnectionState.Connected
        );
    }

    /**
     * Get readable state for debugging
     */
    getReadableState(): string {
        return `${this.connectionState} (SignalR: ${this.connection?.state ?? 'null'})`;
    }
}

// Singleton instance
export const signalRService = new SignalRService();
export default signalRService;
