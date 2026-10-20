'use client'

import { clsx } from 'clsx/lite'
import { useId, useRef, useState } from 'react'
import { DAYS, defaultHours, resolve } from '@/lib/onboarding/schema'
import { OTHER_TRADE, TRADE_GROUPS } from '@/lib/onboarding/trades'
import type { Guide } from '@/lib/onboarding/guides'
import type { Answers, Ctx, Field, FileRec, RowCol } from '@/lib/onboarding/types'
import { hostnameOf } from './util'

export const inputClass =
  'w-full rounded-lg border border-olive-950/15 bg-white px-4 py-3 text-sm text-olive-950 placeholder:text-olive-400 focus:outline-none focus:ring-2 focus:ring-olive-950/20 dark:border-white/10 dark:bg-olive-900 dark:text-white dark:placeholder:text-olive-500 dark:focus:ring-white/20 transition-colors'
const smallInput = inputClass.replace('px-4 py-3', 'px-3 py-2')

export type FieldProps = {
  field: Field
  answers: Answers
  ctx: Ctx
  value: unknown
  error?: string
  onChange: (v: unknown) => void
  ein: string
  onEin: (v: string) => void
  uploading: Record<string, number>
  onUpload: (fieldId: string, files: FileList) => void
  onRemoveFile: (f: FileRec) => void
  demoUrl: string | null
}

export function FieldRenderer(p: FieldProps) {
  const { field: f } = p
  const id = useId()
  const help = resolve(f.help, p.answers, p.ctx)
  const required = !!resolve(f.required ?? false, p.answers, p.ctx)
  const guide = resolve(f.guide, p.answers, p.ctx)
  const bare = f.type === 'checkbox' || f.type === 'consent' || f.type === 'demo' || f.type === 'note'

  if (f.type === 'note') {
    return (
      <div id={`field-${f.id}`} className="rounded-xl bg-olive-950/5 p-4 sm:col-span-2 dark:bg-white/5">
        <p className="text-sm font-semibold text-olive-950 dark:text-white">{f.label}</p>
        {f.body && <p className="mt-1 text-sm text-olive-700 dark:text-olive-300">{f.body}</p>}
        {guide && <GuideBox guide={guide} open />}
      </div>
    )
  }

  return (
    <div id={`field-${f.id}`} className={clsx('scroll-mt-28', f.half ? 'sm:col-span-1' : 'sm:col-span-2')}>
      {!bare && (
        <label htmlFor={id} className="mb-2 block text-sm font-semibold text-olive-950 dark:text-white">
          {f.label}
          {required && <span className="text-olive-500"> *</span>}
        </label>
      )}
      <Control {...p} id={id} />
      {help && !p.error && <p className="mt-1.5 text-xs text-olive-500">{help}</p>}
      {guide && <GuideBox guide={guide} />}
      {p.error && (
        <p role="alert" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
          {p.error}
        </p>
      )}
    </div>
  )
}

/** Expandable step-by-step instructions with direct links. */
export function GuideBox({ guide, open = false }: { guide: Guide; open?: boolean }) {
  return (
    <details open={open} className="group mt-3 rounded-lg border border-olive-950/10 bg-white text-sm dark:border-white/10 dark:bg-olive-900/50">
      <summary className="flex cursor-pointer list-none items-center [&::-webkit-details-marker]:hidden justify-between gap-3 px-4 py-3 font-medium text-olive-950 dark:text-white">
        <span>{guide.title}</span>
        <span className="shrink-0 text-xs text-olive-500"><span className="group-open:hidden">Show steps</span><span className="hidden group-open:inline">Hide</span></span>
      </summary>
      <div className="border-t border-olive-950/10 px-4 py-3 dark:border-white/10">
        <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-olive-700 dark:text-olive-300">
          {guide.steps.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
        {guide.links && guide.links.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {guide.links.map((l) => (
              <a
                key={l.href} href={l.href} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center rounded-full bg-olive-950 px-3 py-1.5 text-xs font-medium text-white hover:bg-olive-800 dark:bg-white dark:text-olive-950"
              >
                {l.label} &#8599;
              </a>
            ))}
          </div>
        )}
        {guide.note && <p className="mt-3 text-xs text-olive-500">{guide.note}</p>}
      </div>
    </details>
  )
}

function Control(p: FieldProps & { id: string }) {
  const { field: f, value, onChange, id } = p
  const s = typeof value === 'string' ? value : ''
  switch (f.type) {
    case 'text': case 'email': case 'tel': case 'url':
      return (
        <input
          id={id} type={f.type === 'url' ? 'text' : f.type} inputMode={f.type === 'url' ? 'url' : undefined}
          value={s} onChange={(e) => onChange(e.target.value)} placeholder={f.placeholder} autoComplete={f.autoComplete}
          className={inputClass} aria-invalid={!!p.error}
        />
      )
    case 'textarea':
      return <textarea id={id} rows={4} value={s} onChange={(e) => onChange(e.target.value)} placeholder={f.placeholder} className={clsx(inputClass, 'resize-y')} />
    case 'select':
      return (
        <select id={id} value={s} onChange={(e) => onChange(e.target.value)} className={inputClass}>
          <option value="">Select one</option>
          {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )
    case 'radio':
      return (
        <div id={id} role="radiogroup" className={clsx('grid grid-cols-1 gap-2.5', !f.options?.some((o) => o.hint) && 'sm:grid-cols-2')}>
          {f.options?.map((o) => (
            <Choice key={o.value} selected={s === o.value} label={o.label} hint={o.hint} onClick={() => onChange(o.value)} />
          ))}
        </div>
      )
    case 'checkboxes': {
      const arr = Array.isArray(value) ? (value as string[]) : []
      return (
        <div id={id} className="flex flex-wrap gap-2">
          {f.options?.map((o) => {
            const on = arr.includes(o.value)
            return (
              <Chip key={o.value} on={on} onClick={() => onChange(on ? arr.filter((x) => x !== o.value) : [...arr, o.value])}>
                {o.label}
              </Chip>
            )
          })}
        </div>
      )
    }
    case 'checkbox': case 'consent':
      return (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-olive-950/10 bg-white p-4 text-sm text-olive-800 dark:border-white/10 dark:bg-olive-900/50 dark:text-olive-200">
          <input id={id} type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-olive-950" />
          <span>
            {f.label}
            {f.type === 'consent' && f.id === 'consent_terms' && (
              <>
                {' '}<a href="/privacy" target="_blank" rel="noreferrer" className="underline">Read the Privacy Policy</a>.
              </>
            )}
            {!!resolve(f.required ?? false, p.answers, p.ctx) && <span className="text-olive-500"> *</span>}
          </span>
        </label>
      )
    case 'ein':
      return <EinInput id={id} value={p.ein} onChange={p.onEin} onFile={p.ctx.einOnFile} last4={p.ctx.einLast4} />
    case 'tags':
      return <Tags id={id} value={Array.isArray(value) ? (value as string[]) : []} onChange={onChange} suggestions={f.suggestions?.(p.answers) ?? []} placeholder={f.placeholder} />
    case 'trade':
      return <TradePicker id={id} value={s} onChange={onChange} />
    case 'trades': {
      const arr = Array.isArray(value) ? (value as string[]) : []
      return <Tags id={id} value={arr} onChange={onChange} suggestions={[]} options={TRADE_GROUPS.flatMap((g) => g.trades)} placeholder="Start typing a trade" />
    }
    case 'hours':
      return <Hours value={value as Answers | undefined} onChange={onChange} />
    case 'rows':
      return <Rows field={f} value={Array.isArray(value) ? (value as Answers[]) : []} onChange={onChange} />
    case 'file':
      return <FileDrop {...p} />
    case 'demo':
      return <DemoPreview url={p.demoUrl} />
    default:
      return null
  }
}

function Choice({ selected, label, hint, onClick }: { selected: boolean; label: string; hint?: string; onClick: () => void }) {
  return (
    <button
      type="button" role="radio" aria-checked={selected} onClick={onClick}
      className={clsx(
        'flex w-full cursor-pointer items-start gap-3 rounded-xl border p-4 text-left transition-all',
        selected ? 'border-olive-950 bg-olive-950/5 dark:border-white dark:bg-white/5' : 'border-olive-950/10 bg-white hover:border-olive-950/30 dark:border-white/10 dark:bg-olive-900/50',
      )}
    >
      <span className={clsx('mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2', selected ? 'border-olive-950 dark:border-white' : 'border-olive-950/30 dark:border-white/30')}>
        {selected && <span className="size-2.5 rounded-full bg-olive-950 dark:bg-white" />}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-olive-950 dark:text-white">{label}</span>
        {hint && <span className="text-sm text-olive-600 dark:text-olive-400">{hint}</span>}
      </span>
    </button>
  )
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button" aria-pressed={on} onClick={onClick}
      className={clsx(
        'rounded-full border px-3.5 py-1.5 text-sm transition-colors',
        on ? 'border-olive-950 bg-olive-950 text-white dark:border-white dark:bg-white dark:text-olive-950' : 'border-olive-950/15 bg-white text-olive-800 hover:border-olive-950/40 dark:border-white/15 dark:bg-olive-900 dark:text-olive-200',
      )}
    >
      {children}
    </button>
  )
}

function EinInput({ id, value, onChange, onFile, last4 }: { id: string; value: string; onChange: (v: string) => void; onFile: boolean; last4: string | null }) {
  const format = (raw: string) => {
    const d = raw.replace(/\D/g, '').slice(0, 9)
    return d.length > 2 ? `${d.slice(0, 2)}-${d.slice(2)}` : d
  }
  return (
    <div>
      <input
        id={id} inputMode="numeric" autoComplete="off" value={value} onChange={(e) => onChange(format(e.target.value))}
        placeholder={onFile ? `Saved, ending in ${last4 ?? '••••'}. Type to replace.` : 'XX-XXXXXXX'} className={inputClass}
      />
      {onFile && !value && <p className="mt-1.5 text-xs text-olive-500">Your EIN is saved securely. Leave this blank to keep it.</p>}
    </div>
  )
}

function Tags({ id, value, onChange, suggestions, placeholder, options }: { id: string; value: string[]; onChange: (v: unknown) => void; suggestions: string[]; placeholder?: string; options?: string[] }) {
  const [draft, setDraft] = useState('')
  const listId = `${id}-list`
  const add = (raw: string) => {
    const items = raw.split(',').map((x) => x.trim()).filter(Boolean)
    const next = [...value]
    for (const it of items) if (!next.some((x) => x.toLowerCase() === it.toLowerCase())) next.push(it)
    onChange(next)
    setDraft('')
  }
  return (
    <div>
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {value.map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5 rounded-full bg-olive-950 py-1 pr-1.5 pl-3 text-sm text-white dark:bg-white dark:text-olive-950">
              {t}
              <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(value.filter((x) => x !== t))} className="flex size-5 items-center justify-center rounded-full hover:bg-white/20 dark:hover:bg-olive-950/10">×</button>
            </span>
          ))}
        </div>
      )}
      <input
        id={id} value={draft} list={options ? listId : undefined} placeholder={placeholder ?? 'Type and press Enter'} className={inputClass}
        onChange={(e) => (e.target.value.endsWith(',') ? add(e.target.value) : setDraft(e.target.value))}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (draft.trim()) add(draft) } }}
        onBlur={() => draft.trim() && add(draft)}
      />
      {options && <datalist id={listId}>{options.map((o) => <option key={o} value={o} />)}</datalist>}
      {suggestions.filter((s) => !value.includes(s)).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {suggestions.filter((s) => !value.includes(s)).map((s) => (
            <button key={s} type="button" onClick={() => onChange([...value, s])} className="rounded-full border border-dashed border-olive-950/25 px-3 py-1 text-xs text-olive-700 hover:border-olive-950/60 dark:border-white/25 dark:text-olive-300">
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function TradePicker({ id, value, onChange }: { id: string; value: string; onChange: (v: unknown) => void }) {
  const [q, setQ] = useState('')
  const groups = TRADE_GROUPS.map((g) => ({ ...g, trades: g.trades.filter((t) => t.toLowerCase().includes(q.trim().toLowerCase())) })).filter((g) => g.trades.length)
  return (
    <div>
      <input
        value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search trades" className={clsx(inputClass, 'mb-2')}
        aria-label="Filter trades"
      />
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        <option value="">Select your trade</option>
        {value && !groups.some((g) => g.trades.includes(value)) && value !== OTHER_TRADE && <option value={value}>{value}</option>}
        {groups.map((g) => (
          <optgroup key={g.group} label={g.group}>
            {g.trades.map((t) => <option key={t} value={t}>{t}</option>)}
          </optgroup>
        ))}
        <option value={OTHER_TRADE}>{OTHER_TRADE}</option>
      </select>
    </div>
  )
}

function Hours({ value, onChange }: { value?: Answers; onChange: (v: unknown) => void }) {
  const hours = value && Object.keys(value).length ? value : defaultHours()
  const set = (k: string, patch: Partial<{ open: string; close: string; closed: boolean }>) => onChange({ ...hours, [k]: { ...hours[k], ...patch } })
  return (
    <div className="flex flex-col gap-2">
      {DAYS.map(([k, label]) => {
        const d = hours[k] ?? { open: '08:00', close: '17:00', closed: true }
        return (
          <div key={k} className="flex flex-wrap items-center gap-3 rounded-lg border border-olive-950/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-olive-900/50">
            <span className="w-24 text-sm font-medium text-olive-950 dark:text-white">{label}</span>
            <label className="flex items-center gap-1.5 text-sm text-olive-700 dark:text-olive-300">
              <input type="checkbox" checked={!d.closed} onChange={(e) => set(k, { closed: !e.target.checked })} className="size-4 accent-olive-950" /> Open
            </label>
            {!d.closed ? (
              <div className="flex items-center gap-2">
                <input type="time" aria-label={`${label} opens`} value={d.open} onChange={(e) => set(k, { open: e.target.value })} className={clsx(smallInput, 'w-32')} />
                <span className="text-sm text-olive-500">to</span>
                <input type="time" aria-label={`${label} closes`} value={d.close} onChange={(e) => set(k, { close: e.target.value })} className={clsx(smallInput, 'w-32')} />
              </div>
            ) : (
              <span className="text-sm text-olive-500">Closed</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function Rows({ field, value, onChange }: { field: Field; value: Answers[]; onChange: (v: unknown) => void }) {
  const cols = field.columns ?? []
  const rows = value.length ? value : [{}]
  const update = (i: number, c: RowCol, v: unknown) => onChange(rows.map((r, j) => (j === i ? { ...r, [c.id]: v } : r)))
  return (
    <div className="flex flex-col gap-3">
      {rows.map((r, i) => (
        <div key={i} className="rounded-lg border border-olive-950/10 bg-white p-3 dark:border-white/10 dark:bg-olive-900/50">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
            {cols.map((c) => (
              <div key={c.id} className={clsx(c.type === 'checkbox' ? 'sm:col-span-1' : cols.length > 3 ? 'sm:col-span-2' : 'sm:col-span-2')}>
                <label className="mb-1 block text-xs font-medium text-olive-600 dark:text-olive-400">{c.label}{c.required && ' *'}</label>
                {c.type === 'checkbox' ? (
                  <input type="checkbox" aria-label={c.label} checked={r[c.id] === true} onChange={(e) => update(i, c, e.target.checked)} className="mt-2 size-4 accent-olive-950" />
                ) : c.type === 'select' ? (
                  <select value={(r[c.id] as string) ?? ''} onChange={(e) => update(i, c, e.target.value)} className={smallInput}>
                    <option value="">Select</option>
                    {c.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (
                  <input type={c.type === 'number' ? 'number' : c.type} inputMode={c.type === 'number' ? 'decimal' : undefined} value={(r[c.id] as string) ?? ''} placeholder={c.placeholder} onChange={(e) => update(i, c, e.target.value)} className={smallInput} />
                )}
              </div>
            ))}
          </div>
          {rows.length > 1 && (
            <button type="button" onClick={() => onChange(rows.filter((_, j) => j !== i))} className="mt-2 text-xs text-olive-500 underline hover:text-olive-800">Remove row</button>
          )}
        </div>
      ))}
      <button type="button" onClick={() => onChange([...rows, {}])} className="self-start rounded-full border border-olive-950/20 px-4 py-1.5 text-sm font-medium text-olive-950 hover:bg-olive-950/5 dark:border-white/20 dark:text-white">
        Add another
      </button>
    </div>
  )
}

const fmtSize = (n: number | null) => (n ? (n > 1_000_000 ? `${(n / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1000))} KB`) : '')

function FileDrop(p: FieldProps & { id: string }) {
  const f = p.field
  const input = useRef<HTMLInputElement>(null)
  const mine = p.ctx.files.filter((x) => x.field_id === f.id)
  const max = f.maxFiles ?? 1
  const busy = p.uploading[f.id] ?? 0
  const full = mine.length + busy >= max
  return (
    <div>
      {mine.length > 0 && (
        <ul className="mb-2 flex flex-col gap-2">
          {mine.map((x) => (
            <li key={x.id} className="flex items-center justify-between gap-3 rounded-lg border border-olive-950/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-olive-900/50">
              <span className="min-w-0 truncate text-olive-950 dark:text-white">{x.name} <span className="text-olive-500">{fmtSize(x.size)}</span></span>
              <button type="button" onClick={() => p.onRemoveFile(x)} className="shrink-0 text-xs text-olive-500 underline hover:text-olive-800">Remove</button>
            </li>
          ))}
        </ul>
      )}
      {busy > 0 && <p className="mb-2 text-sm text-olive-600">Uploading {busy} file{busy > 1 ? 's' : ''}...</p>}
      {!full && (
        <>
          <input
            id={p.id} ref={input} type="file" accept={f.accept} multiple={max > 1} className="sr-only"
            onChange={(e) => { if (e.target.files?.length) p.onUpload(f.id, e.target.files); e.target.value = '' }}
          />
          <button type="button" onClick={() => input.current?.click()} className="w-full rounded-lg border-2 border-dashed border-olive-950/20 px-4 py-6 text-center text-sm text-olive-700 hover:border-olive-950/50 dark:border-white/20 dark:text-olive-300">
            {max > 1 ? 'Choose files' : 'Choose a file'} <span className="text-olive-500">(up to 15 MB each)</span>
          </button>
        </>
      )}
    </div>
  )
}

export function DemoPreview({ url }: { url: string | null }) {
  const [loaded, setLoaded] = useState(false)
  if (!url) return null
  return (
    <div className="overflow-hidden rounded-xl border border-olive-950/10 bg-white dark:border-white/10 dark:bg-olive-900/50">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-olive-950/10 px-4 py-3 dark:border-white/10">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-olive-950 dark:text-white">Your demo site</p>
          <p className="truncate text-xs text-olive-500">{hostnameOf(url)}</p>
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center rounded-full bg-olive-950 px-4 py-1.5 text-sm font-medium text-white hover:bg-olive-800 dark:bg-olive-300 dark:text-olive-950">
          Open in a new tab
        </a>
      </div>
      <div className="relative h-72 bg-olive-100 sm:h-96 dark:bg-olive-950">
        <iframe
          src={url} title="Your demo website" loading="lazy" referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          onLoad={() => setLoaded(true)} className={clsx('size-full', !loaded && 'opacity-0')}
        />
        {!loaded && <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-olive-500">Loading preview...</p>}
      </div>
      <p className="border-t border-olive-950/10 px-4 py-2.5 text-xs text-olive-500 dark:border-white/10">
        Preview not showing? Some sites cannot be displayed inside another page. Use Open in a new tab.
      </p>
    </div>
  )
}
