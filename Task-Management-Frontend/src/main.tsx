import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AppRouter } from './routes'
import { NotificationProvider } from './context'
import NotificationToast from './components/NotificationToast'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NotificationProvider>
      <AppRouter />
      <NotificationToast />
    </NotificationProvider>
  </StrictMode>,
)
