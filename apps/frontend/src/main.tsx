import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App'
import { setupSession } from './app/setupSession'
import './index.css'

setupSession()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
