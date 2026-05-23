import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from '@/App'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1A1A2E',
            color: '#F8F7F4',
            border: '1px solid #2E5F8A',
            borderRadius: '10px',
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '14px',
            padding: '12px 16px',
          },
          success: { iconTheme: { primary: '#D4A853', secondary: '#1A1A2E' } },
          error: { iconTheme: { primary: '#B03A2E', secondary: '#F8F7F4' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
)
