import httpClient from './httpClient';

export interface AttachmentPreviewResponse {
    url: string;
}

export const attachmentService = {
    async downloadAttachment(attachmentId: number, userId: string): Promise<Blob> {
        const response = await httpClient.get(`/TaskAttachment/${attachmentId}/download`, {
            params: { userId },
            responseType: 'blob',
        });
        return response.data;
    },

    async getPreviewUrl(attachmentId: number, userId: string): Promise<string> {
        const response = await httpClient.get<AttachmentPreviewResponse | { Url: string }>(
            `/TaskAttachment/${attachmentId}/preview-url`,
            { params: { userId } }
        );

        // Handle both lowercase 'url' and uppercase 'Url' from backend
        const url = (response.data as any).url || (response.data as any).Url;

        if (!url) {
            console.error('[AttachmentService] No URL found in response!', response.data);
            throw new Error('No preview URL received from server');
        }

        return url;
    },
};

export default attachmentService;
