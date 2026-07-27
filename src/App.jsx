import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useParams, useSearchParams } from 'react-router-dom'
import AppShell from './components/shell/AppShell'
import LoginPage from './features/auth/LoginPage'
import { useSession } from './context/SessionContext'
import { returnsForClient } from './data/db'

import CpaDashboard from './features/dashboard/CpaDashboard'
import ReturnsList from './features/dashboard/ReturnsList'
import ReturnWorkspace from './features/return/ReturnWorkspace'
import DocumentExplorer from './features/documents/DocumentExplorer'
import ClientDocuments from './features/documents/ClientDocuments'
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

// The firm's document library, organised by client. A taxpayer who lands here
// belongs on their own documents instead.
function DocumentsHome() {
  const { caps } = useSession()
  return caps.isClient ? <Navigate to="/my-documents" replace /> : <ClientDocuments />
}

// One client's file, reached from the client list. Clients never come through
// here - /my-documents is their door - so a client landing on it goes home.
function ClientFile() {
  const { rid } = useParams()
  const [params] = useSearchParams()
  const { caps } = useSession()
  if (caps.isClient) return <RoleHome />
  return <DocumentExplorer returnId={rid} selectedDocId={params.get('doc') || undefined} />
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
          <Route path="/documents" element={<DocumentsHome />} />
          <Route path="/documents/:rid" element={<ClientFile />} />
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

// The path this tab was opened on, read once when the module loads.
//
// This is the *only* URL that states what someone wanted. Every later value in
// the address bar is just where the previous session happened to stop, and
// reading that back is what made sign-in resume on some other role's return
// instead of the dashboard. A deep link into a specific field still survives
// authentication (Challenge 04: never lose someone's context) - but only the
// genuine kind, opened before anyone had signed in.
const OPENED_ON = (() => {
  const here = window.location.pathname + window.location.search
  return here === '/' || here === '/login' ? null : here
})()

// Signed-out users see the login screen; everyone else gets a session that
// begins at a known place.
function RequireAuth({ children }) {
  const { signedIn, sessionKey } = useSession()

  if (!signedIn) return <LoginPage intended={sessionKey === 0 ? OPENED_ON : null} />

  // Keyed on the sign-in count: each session mounts fresh, so it cannot inherit
  // screen state - or a landing path - from whoever was here before.
  return (
    <SessionStart key={sessionKey} deepLink={sessionKey === 1 ? OPENED_ON : null}>
      {children}
    </SessionStart>
  )
}

// One redirect per sign-in, before the first screen renders: to the deep link
// if this tab was opened on one, otherwise to "/", which RoleHome resolves to
// the dashboard for firm staff and Home for taxpayers.
function SessionStart({ deepLink, children }) {
  const [landed, setLanded] = useState(false)
  useEffect(() => { setLanded(true) }, [])
  if (!landed) return <Navigate to={deepLink || '/'} replace />
  return children
}
