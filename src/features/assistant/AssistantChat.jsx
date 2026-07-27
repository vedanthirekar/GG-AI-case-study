// ============================================================================
// "Ask Vantage" - the chat surface, living as the second tab of the help drawer.
//
// Composed like a printed transcript rather than a messaging app: the question
// set in the display serif, the answer in body text beneath it, turns separated
// by hairlines. Chat bubbles would be the one piece of glossy SaaS chrome in a
// product that spent its whole design argument avoiding them.
//
// Two things here are load-bearing rather than decorative:
//   · every link the model offers has already been checked against the real
//     route table for this role, so a button can't be a dead end;
//   · every answer that came from the curated help centre instead of the model
//     says so, in place, rather than passing itself off as an AI answer.
// ============================================================================
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAssistant } from '../../context/AssistantContext'
import { modelName } from '../../lib/gemini'
import { Icon, Btn, Kbd, cx } from '../../components/ui'

export default function AssistantChat({ prefill, onNavigate }) {
  const { messages, streaming, ask, stop, reset, suggestions, live } = useAssistant()
  const [draft, setDraft] = useState('')
  const scroller = useRef(null)
  const input = useRef(null)

  // A question handed over from elsewhere (the help centre's empty search)
  // arrives as a prefill and is put in the composer, not sent - the person
  // should see what's about to be asked on their behalf.
  useEffect(() => {
    if (!prefill) return
    setDraft(prefill)
    input.current?.focus()
  }, [prefill])

  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, streaming])

  const send = (text) => {
    const q = (text ?? draft).trim()
    if (!q || streaming) return
    setDraft('')
    ask(q)
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={scroller} className="pane min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0
          ? <Empty live={live} suggestions={suggestions} onPick={send} />
          : (
            <div className="space-y-4">
              {messages.map((m, i) => (
                <Turn key={m.id} m={m} onNavigate={onNavigate}
                  active={streaming && i === messages.length - 1} />
              ))}
            </div>
          )}
      </div>

      <div className="shrink-0 border-t border-line bg-surface px-3 py-2.5">
        <div className="flex items-end gap-2">
          <textarea
            ref={input} rows={1} value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask about this screen or your return…"
            className="max-h-28 min-h-[38px] flex-1 resize-none rounded-lg border border-line bg-bgtint/40 px-3 py-2 text-body leading-relaxed outline-none transition placeholder:text-faint focus:border-accent focus:bg-surface" />
          {streaming
            ? <Btn variant="default" onClick={stop} title="Stop generating" className="h-[38px] shrink-0 px-2.5"><Icon name="stop" size={14} /></Btn>
            : <Btn variant="primary" onClick={() => send()} disabled={!draft.trim()} title="Send" className="h-[38px] shrink-0 px-2.5"><Icon name="send" size={15} /></Btn>}
        </div>
        <div className="mt-1.5 flex items-center gap-2 px-0.5 text-[10.5px] text-faint">
          <span><Kbd>↵</Kbd> send · <Kbd>⇧↵</Kbd> new line</span>
          {messages.length > 0 && (
            <button onClick={reset} className="ml-auto inline-flex items-center gap-1 font-semibold transition hover:text-ink">
              <Icon name="refresh" size={11} /> Clear
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function Empty({ live, suggestions, onPick }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-sm border border-ai/40 text-ai"><Icon name="sparkle" size={14} /></span>
        <span className="font-display text-lead font-bold">Ask Vantage</span>
      </div>
      <p className="mt-2 text-body leading-relaxed text-muted">
        I know how this product works, what your role can and can’t do, and what’s on the
        screen in front of you. Ask me why something is locked, what’s holding up a return,
        or where to go next.
      </p>
      <p className="mt-2 text-meta leading-relaxed text-faint">
        I can’t give tax advice, and I can’t change anything - for either of those, your
        preparer is in Messages.
      </p>

      <div className="mt-4 text-micro font-bold uppercase tracking-wider text-faint">Try asking</div>
      <div className="mt-2 space-y-1.5">
        {suggestions.map((s) => (
          <button key={s} onClick={() => onPick(s)}
            className="flex w-full items-center gap-2 rounded-sm border border-line bg-surface px-3 py-2 text-left text-body text-muted transition hover:border-accent/50 hover:text-ink">
            <Icon name="chevron" size={12} className="shrink-0 text-faint" />
            <span className="flex-1">{s}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-1.5 border-t border-line2 pt-3 text-[10.5px] leading-snug text-faint">
        <Icon name={live ? 'bolt' : 'alert'} size={12} className="mt-px shrink-0" />
        {live
          ? <span>Answers come from a live <span className="font-mono">{modelName()}</span> call - the one thing in this prototype that isn’t simulated. It reads your session, never writes to it.</span>
          : <span>No API key is configured, so answers come from the help centre rather than a model. Add <span className="font-mono">VITE_GEMINI_API_KEY</span> to <span className="font-mono">.env.local</span> to enable it.</span>}
      </div>
    </div>
  )
}

function Turn({ m, onNavigate, active }) {
  const navigate = useNavigate()
  if (m.role === 'user') {
    return (
      <div className="border-l-2 border-accent pl-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-faint">You asked</div>
        <div className="mt-0.5 font-display text-lead font-semibold leading-snug">{m.text}</div>
      </div>
    )
  }

  return (
    <div className="border-b border-line2 pb-4 last:border-0 last:pb-0">
      {m.degraded && (
        <div className="mb-2 flex items-start gap-1.5 rounded-sm border border-warn/40 px-2.5 py-1.5 text-[11px] leading-snug text-warn">
          <Icon name="alert" size={12} className="mt-px shrink-0" /> {m.degraded}
        </div>
      )}

      {active && !m.text
        ? <div className="flex items-center gap-1.5 text-meta text-faint">
            <Icon name="sparkle" size={12} className="animate-pulse motion-reduce:animate-none" /> Thinking…
          </div>
        : (
          <div className={cx('whitespace-pre-wrap text-body leading-relaxed', m.error ? 'text-muted' : 'text-ink')}>
            <Rich text={m.text} />
            {active && <Caret />}
          </div>
        )}

      {m.links?.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {m.links.map((l) => (
            <Btn key={l.to} variant="default" size="sm"
              onClick={() => { onNavigate?.(); navigate(l.to) }}>
              {l.label} <Icon name="arrow-right" size={12} />
            </Btn>
          ))}
        </div>
      )}

      {m.sources?.length > 0 && (
        <div className="mt-2.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-faint">Based on</div>
          <div className="mt-1 space-y-1">
            {m.sources.map((s) => (
              <Link key={s.id} to={s.to} onClick={() => onNavigate?.()}
                className="flex items-start gap-1.5 text-[11px] leading-snug text-muted transition hover:text-accent">
                <Icon name="book" size={11} className="mt-0.5 shrink-0" />
                <span className="underline decoration-line underline-offset-2">{s.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// A block caret rather than three bouncing dots - it belongs to the same
// typographic world as the rest of this direction. `motion-reduce` kills the
// blink for anyone who has asked for less movement.
// The system instruction asks for plain prose, and mostly gets it - but a model
// will still reach for **emphasis** on a figure now and then, and raw asterisks
// on screen look like a bug. Rather than a markdown dependency for two cases,
// resolve the two: **bold** and `mono`. Everything else stays literal text, so
// there is no path from model output to rendered HTML.
const INLINE = /(\*\*[^*\n]+\*\*|`[^`\n]+`)/g

function Rich({ text }) {
  if (!text) return null
  return text.split(INLINE).map((part, i) => {
    if (/^\*\*[^*\n]+\*\*$/.test(part)) return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
    if (/^`[^`\n]+`$/.test(part)) return <span key={i} className="tnum font-mono text-[0.94em]">{part.slice(1, -1)}</span>
    return part
  })
}

function Caret() {
  return <span className="ml-0.5 inline-block h-[1em] w-[0.5ch] translate-y-[0.12em] animate-pulse bg-accent align-baseline motion-reduce:animate-none" />
}
