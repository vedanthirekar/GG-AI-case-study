import { useRef } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import AppShell from './components/shell/AppShell'
import LoginPage from './features/auth/LoginPage'
import { useSession } from './context/SessionContext'
import { returnsForClient } from './data/db'

import CpaDashboard from './features/dashboard/CpaDashboard'
import ReturnsList from './features/dashboard/ReturnsList'
import ReturnWorkspace from './features/return/ReturnWorkspace'
import DocumentExplorer from './features/documents/DocumentExplorer'
import MessagesInbox from './features/collaboration/MessagesInbox'
import ClientHome from './features/onboarding/ClientHome'
import HelpCenter from './features/help/HelpCenter'
import AccessManager from './features/admin/AccessManager'

// Send each role to the right landing page.
function RoleHome() {
  const { isFirm } = useSession()
  return <Navigate to={isFirm ? '/dashboard' : '/home'} replace />
}

// A client's "My return" jumps straight into their own return workspace.
function MyReturn() {
  const { userId } = useSession()
  const mine = returnsForClient(userId)[0]
  return mine ? <Navigate to={`/returns/${mine.id}`} replace /> : <Navigate to="/home" replace />
}

// Only firm administrators manage access; anyone else who lands here is sent home
// (the nav item itself stays visible-but-locked, so the rule is still communicated).
function AdminOnly({ children }) {
  const { caps } = useSession()
  return caps.manageFirm ? children : <RoleHome />
}

export default function App() {
  return (
    <RequireAuth>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<RoleHome />} />
          <Route path="/dashboard" element={<CpaDashboard />} />
          <Route path="/returns" element={<ReturnsList />} />
          <Route path="/returns/:rid" element={<ReturnWorkspace />} />
          <Route path="/documents" element={<DocumentExplorer />} />
          <Route path="/messages" element={<MessagesInbox />} />
          <Route path="/home" element={<ClientHome />} />
          <Route path="/my-return" element={<MyReturn />} />
          <Route path="/my-documents" element={<DocumentExplorer scope="client" />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/help/:section" element={<HelpCenter />} />
          <Route path="/styleguide" element={<Navigate to="/help/interaction-system" replace />} />
          <Route path="/people" element={<AdminOnly><AccessManager /></AdminOnly>} />
          <Route path="/login" element={<RoleHome />} />
          <Route path="*" element={<RoleHome />} />
        </Route>
      </Routes>
    </RequireAuth>
  )
}

// Signed-out users see the login screen — but the URL they arrived on is kept,
// so a deep link into a specific return field survives authentication instead of
// dumping them on a dashboard (Challenge 04: never lose someone's context).
function RequireAuth({ children }) {
  const { signedIn } = useSession()
  const loc = useLocation()
  const intended = useRef(null)

  if (!signedIn) {
    const here = loc.pathname + loc.search
    if (here !== '/' && here !== '/login') intended.current = here
    return <LoginPage intended={intended.current} />
  }
  if (intended.current) {
    const to = intended.current
    intended.current = null
    return <Navigate to={to} replace />
  }
  return children
}
