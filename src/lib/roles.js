// ============================================================================
// Role architecture (Challenge 05).
// One shell, six roles. This maps each role to the navigation it sees and the
// permissions it has. The SAME components read this map, so the product stays
// one cohesive app instead of six forks. Permissions are communicated in the UI
// (locked affordances + tooltips), never just silently enforced.
// ============================================================================

// Navigation per role. `side: firm` roles get the practice-management surface;
// `client` roles get the taxpayer surface.
export const NAV = {
  firm: [
    { to: '/dashboard', label: 'Dashboard', icon: 'grid' },
    { to: '/returns', label: 'Returns', icon: 'folder' },
    { to: '/documents', label: 'Documents', icon: 'doc' },
    { to: '/messages', label: 'Messages', icon: 'chat' },
  ],
  client: [
    { to: '/home', label: 'Home', icon: 'home' },
    { to: '/my-return', label: 'My return', icon: 'folder' },
    { to: '/my-documents', label: 'My documents', icon: 'doc' },
    { to: '/messages', label: 'Messages', icon: 'chat' },
  ],
}

// Per-role capability flags. Used to decide what is editable / visible.
export const CAPS = {
  preparer: { editFields: true, verifyFields: true, seeInternalNotes: true, approveFile: false, manageFirm: false, seeAllReturns: true, label: 'Can prepare & verify — a reviewer signs off before filing.' },
  reviewer: { editFields: true, verifyFields: true, seeInternalNotes: true, approveFile: true, manageFirm: false, seeAllReturns: true, label: 'Can verify and approve returns for filing.' },
  admin: { editFields: false, verifyFields: false, seeInternalNotes: true, approveFile: false, manageFirm: true, seeAllReturns: true, label: 'Manages the firm; does not edit tax figures.' },
  seasonal: { editFields: true, verifyFields: false, seeInternalNotes: false, approveFile: false, manageFirm: false, seeAllReturns: false, label: 'Can prepare, but not verify or see internal notes. Sees only assigned returns.' },
  individual: { editFields: false, verifyFields: false, seeInternalNotes: false, approveFile: false, manageFirm: false, seeAllReturns: false, isClient: true, label: 'Sees only their own return; can answer questions and upload documents.' },
  business: { editFields: false, verifyFields: false, seeInternalNotes: false, approveFile: false, manageFirm: false, seeAllReturns: false, isClient: true, label: 'Sees only their business return; can answer questions and upload documents.' },
}

// Secondary nav — always present, below a divider. `needs` names the capability
// required; the item is still SHOWN without it, just locked with an explanation,
// which is the same "communicate, don't hide" rule the rest of the app follows.
export const SECONDARY_NAV = [
  { to: '/help', label: 'Help & guides', icon: 'life-buoy' },
  { to: '/people', label: 'People & access', icon: 'users', needs: 'manageFirm', firmOnly: true },
]

export function navFor(roleKey) {
  return CAPS[roleKey]?.isClient ? NAV.client : NAV.firm
}
export function capsFor(roleKey) {
  return CAPS[roleKey] || CAPS.individual
}
export function isFirmRole(roleKey) {
  return !CAPS[roleKey]?.isClient
}

// Human explanation of why something is locked for the current role — shown in
// tooltips so permission is communicated, not just enforced.
export function whyLocked(roleKey, capNeeded) {
  const map = {
    verifyFields: {
      seasonal: 'Seasonal staff can prepare but a full preparer or reviewer verifies figures.',
      individual: 'Only your firm verifies figures. You can ask a question instead.',
      business: 'Only your firm verifies figures. You can ask a question instead.',
      admin: 'Administrators manage the firm and don’t verify tax figures.',
    },
    approveFile: {
      preparer: 'A reviewer approves the return for filing, not the preparer.',
      seasonal: 'A reviewer approves the return for filing.',
    },
    seeInternalNotes: {
      seasonal: 'Internal firm notes are limited to preparers and reviewers.',
      individual: 'These are internal firm notes and aren’t shared with clients.',
      business: 'These are internal firm notes and aren’t shared with clients.',
    },
    manageFirm: {
      preparer: 'Only a firm administrator can change who has access.',
      reviewer: 'Only a firm administrator can change who has access.',
      seasonal: 'Only a firm administrator can change who has access.',
      individual: 'Access management is a firm-side tool.',
      business: 'Access management is a firm-side tool.',
    },
  }
  return map[capNeeded]?.[roleKey] || 'Your role doesn’t have permission for this action.'
}
