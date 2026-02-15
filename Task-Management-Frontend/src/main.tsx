import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { AppRouter } from './routes'
import { NotificationProvider } from './context'
import NotificationToast from './components/NotificationToast'
import { ChatbotProvider } from './components/chatbot/ChatbotProvider'
import ChatbotTrigger from './components/chatbot/ChatbotTrigger'
import ChatWindow from './components/chatbot/ChatWindow'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <NotificationProvider>
        <ChatbotProvider>
          <AppRouter />
          <NotificationToast />
          <ChatWindow />
          <ChatbotTrigger />
        </ChatbotProvider>
      </NotificationProvider>
    </BrowserRouter>
  </StrictMode>,
)
