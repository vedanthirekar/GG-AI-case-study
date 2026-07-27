// Where to Start (Challenge 03).
// A brand-new client should know their next action within 10 seconds. The screen
// leads with ONE hero action, shows a short checklist with clear states, defers
// everything not yet relevant (locked steps), and communicates progress + urgency.
// Once onboarding is complete the same route flips to the "returning client" home.
import { useMemo, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { db, returnsForClient, threadsForReturn } from '../../data/db'
import { useSession } from '../../context/SessionContext'
import { useStore } from '../../context/StoreContext'
import { useChrome } from '../../context/ChromeContext'
import { Card, Btn, Tag, Icon, InfoTip, Money, cx } from '../../components/ui'
import { CLIENT_TIPS } from '../../data/help'
import IngestDocument from '../documents/IngestDocument'
import StatusTracker from '../status/StatusTracker'
import StageChip from '../status/StageChip'

export default function ClientHome() {
  const { user, userId } = useSession()
  const { publish } = useChrome()
  const navigate = useNavigate()
  useEffect(() => { publish({ crumbs: [{ label: 'Home' }] }) }, [publish])

  const ret = returnsForClient(userId)[0]
  const isNew = ret?.isNewClient

  return isNew ? <FirstRun user={user} ret={ret} /> : <ReturningHome user={user} ret={ret} />
}

// ---------- brand-new client: onboarding --------------------------------------
function FirstRun({ user, ret }) {
  const { isFulfilled } = useStore()
  const [steps, setSteps] = useState(db.onboarding)
  const [ingesting, setIngesting] = useState(false)
  const done = steps.filter((s) => s.status === 'done').length
  const total = steps.length
  const pct = Math.round((done / total) * 100)
  // the single most important next action
  const next = steps.find((s) => s.status === 'todo')
  const markDone = (id) => setSteps((s) => s.map((x) => x.id === id ? { ...x, status: 'done' } : x))
  // a step marked "upload" opens the real ingestion flow
  const doStep = (step) => { if (step.kind === 'upload') setIngesting(true); else markDone(step.id) }

  const openRequests = threadsForReturn(ret.id).filter((t) => t.request && !t.request.fulfilled && !isFulfilled(t.id))

  return (
    <div className="mx-auto max-w-3xl px-5 py-6">
      {ingesting && <IngestDocument rid={ret.id} onClose={() => { setIngesting(false); if (next) markDone(next.id) }} />}
      {/* hero: your next action, unmissable */}
      <div data-tour="onboarding-hero" className="rounded-xl3 border border-accent/25 bg-gradient-to-br from-accent-soft via-surface to-surface p-5 shadow-soft">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-accent">
          <Icon name="sparkle" size={14} /> Welcome to Vantage, {user.name.split(' ')[0]} 👋
        </div>
        <h1 className="mt-1.5 text-[20px] font-bold tracking-tight">Let’s get your 2025 taxes started</h1>
        {next ? (
          <>
            <p className="mt-1 text-[13.5px] text-muted">Your next step takes about {next.minutes} minutes:</p>
            <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl2 border border-line bg-surface p-4">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent"><Icon name={iconFor(next.kind)} size={18} /></span>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold">{next.title}</div>
                {next.note && <div className="text-[12px] text-muted">{next.note}</div>}
              </div>
              <Btn variant="primary" onClick={() => doStep(next)}>{next.kind === 'upload' ? 'Upload now' : 'Start now'} <Icon name="arrow-right" size={14} /></Btn>
            </div>
          </>
        ) : (
          <p className="mt-2 text-[14px] font-medium text-good">🎉 All set - we have everything we need to begin.</p>
        )}
        {/* progress */}
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-[12px] text-muted">
            <span>Setup progress</span><span className="font-semibold text-ink">{done} of {total} done</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-accent-fill transition-all" style={{ width: `${pct}%` }} /></div>
        </div>
      </div>

      {/* the checklist - hidden complexity revealed step by step */}
      <div className="mt-5">
        <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-faint">Your setup checklist</div>
        <Card className="divide-y divide-line2 overflow-hidden">
          {steps.map((s) => <StepRow key={s.id} step={s} onDo={() => doStep(s)} />)}
        </Card>
      </div>

      {/* outstanding requests surfaced, nothing else */}
      {openRequests.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-faint">Your preparer asked for</div>
          {openRequests.map((t) => (
            <Link key={t.id} to={`/returns/${ret.id}?tab=messages&thread=${t.id}`}>
              <Card className="flex items-center gap-3 p-3.5 hover:border-accent/40">
                <Icon name="chat" size={16} className="text-warn" />
                <div className="flex-1"><div className="text-[13px] font-semibold">{t.request.what}</div><div className="text-[12px] text-muted">Due {t.request.due}</div></div>
                <Tag tone="warn">Respond</Tag>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <p className="mt-6 text-center text-[11px] text-faint">Everything else - your full return, past documents, detailed status - stays tucked away until it’s relevant.</p>
    </div>
  )
}

function StepRow({ step, onDo }) {
  const locked = step.status === 'locked'
  const done = step.status === 'done'
  return (
    <div className={cx('flex items-center gap-3 px-4 py-3', locked && 'opacity-55')}>
      <span className={cx('grid h-6 w-6 place-items-center rounded-full border-2',
        done ? 'border-good bg-good-fill text-white' : locked ? 'border-line text-faint' : 'border-accent text-accent')}>
        {done ? <Icon name="check" size={13} /> : locked ? <Icon name="lock" size={12} /> : <Icon name={iconFor(step.kind)} size={13} />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cx('text-[13.5px] font-medium', done && 'text-muted line-through')}>{step.title}</span>
          {step.urgent && !done && <Tag tone="warn">Do next</Tag>}
        </div>
        {step.note && <div className="text-[11.5px] text-muted">{step.note}</div>}
      </div>
      <span className="text-[11px] text-faint">{step.minutes}m</span>
      {!done && !locked && <Btn onClick={onDo}>Do it</Btn>}
      {locked && <span className="text-[11px] text-faint">Locked</span>}
    </div>
  )
}

// ---------- returning client: the calmer, oriented home -----------------------
function ReturningHome({ user, ret }) {
  const navigate = useNavigate()
  if (!ret) return <div className="p-8 text-center text-muted">No return on file.</div>
  const openRequests = threadsForReturn(ret.id).filter((t) => t.request && !t.request.fulfilled)
  return (
    <div className="mx-auto max-w-3xl px-5 py-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[12px] font-semibold uppercase tracking-wide text-good">Welcome back</div>
          <h1 className="text-xl font-bold tracking-tight">Hi {user.name.split(' ')[0]} - here’s your {ret.year} return</h1>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="flex items-center gap-1.5">
            <StageChip stageKey={ret.stage} audience="client" />
            <InfoTip label={CLIENT_TIPS.stage} side="bottom-end" />
          </span>
          {ret.refund != null && (
            <span className="flex items-center gap-1.5 text-meta text-muted">
              Estimated refund <Money value={ret.refund} className="text-good" />
              <InfoTip label={CLIENT_TIPS.refund} side="bottom-end" />
            </span>
          )}
        </div>
      </div>

      {/* what needs the client, first */}
      <div data-tour="client-home">
      {openRequests.length > 0 ? (
        <Card className="mt-4 border-warn/30 bg-warn-soft/40 p-4">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-warn">
            <Icon name="clock" size={15} /> Your preparer is waiting on you
            <Tag tone="warn" dot className="ml-auto">Needs you</Tag>
          </div>
          {openRequests.map((t) => (
            <Link key={t.id} to={`/returns/${ret.id}?tab=messages&thread=${t.id}`} className="mt-2 flex items-center gap-2 rounded-lg bg-surface px-3 py-2 hover:bg-slateSoft">
              <div className="flex-1 text-[13px]">{t.request.what}</div>
              <Btn variant="primary">Respond <Icon name="arrow-right" size={13} /></Btn>
            </Link>
          ))}
        </Card>
      ) : (
        <Card className="mt-4 flex items-center gap-2 border-good/30 bg-good-soft/40 p-4 text-[13px] font-medium text-good">
          <Icon name="check" size={15} /> Nothing needed from you right now - we’ll reach out if that changes.
          <Tag tone="good" dot className="ml-auto">We’re on it</Tag>
        </Card>
      )}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div><div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-faint">Where your return is</div><StatusTracker ret={ret} audience="client" /></div>
        <div>
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-faint">Jump to</div>
          <div className="space-y-2">
            <QuickLink to={`/returns/${ret.id}`} icon="folder" label="View my return" sub="See your figures and where they came from" />
            <QuickLink to="/my-documents" icon="doc" label="My documents" sub="Everything you’ve uploaded" />
            <QuickLink to="/messages" icon="chat" label="Messages" sub="Talk to your preparer" />
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickLink({ to, icon, label, sub }) {
  return (
    <Link to={to}><Card className="flex items-center gap-3 p-3.5 hover:border-accent/40">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent-soft text-accent"><Icon name={icon} size={17} /></span>
      <div className="flex-1"><div className="text-[13px] font-semibold">{label}</div><div className="text-[12px] text-muted">{sub}</div></div>
      <Icon name="chevron" size={16} className="text-faint" />
    </Card></Link>
  )
}

function iconFor(kind) {
  return { profile: 'user', upload: 'doc', questionnaire: 'chat', sign: 'edit' }[kind] || 'check'
}
