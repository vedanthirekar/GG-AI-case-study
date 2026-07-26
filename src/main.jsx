import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ThemeProvider } from './context/ThemeContext'
import { AccessProvider } from './context/AccessContext'
import { SessionProvider } from './context/SessionContext'
import { ChromeProvider } from './context/ChromeContext'
import { StoreProvider } from './context/StoreContext'
import { TourProvider } from './features/tour/TourContext'
import './index.css'

// Provider order matters: Theme is outermost (every primitive reads it), Access
// holds the role grants that Session resolves a user's roles against.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AccessProvider>
          <SessionProvider>
            <StoreProvider>
              <ChromeProvider>
                <TourProvider>
                  <App />
                </TourProvider>
              </ChromeProvider>
            </StoreProvider>
          </SessionProvider>
        </AccessProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
