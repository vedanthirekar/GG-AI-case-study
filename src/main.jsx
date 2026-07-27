import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AccessProvider } from './context/AccessContext'
import { SessionProvider } from './context/SessionContext'
import { ChromeProvider } from './context/ChromeContext'
import { StoreProvider } from './context/StoreContext'
import { AssistantProvider } from './context/AssistantContext'
import { TourProvider } from './features/tour/TourContext'
import './index.css'

// Provider order matters: Access holds the role grants that Session resolves a
// user's roles against. Assistant sits inside Session, Store and Chrome because
// it grounds every answer in all three - who you are, what your data says, and
// where you currently stand.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AccessProvider>
        <SessionProvider>
          <StoreProvider>
            <ChromeProvider>
              <AssistantProvider>
                <TourProvider>
                  <App />
                </TourProvider>
              </AssistantProvider>
            </ChromeProvider>
          </StoreProvider>
        </SessionProvider>
      </AccessProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
