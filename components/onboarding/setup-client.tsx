'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { ApiError, completeSetup, createLogin, findSubmission, loadSubmission, saveSetup } from '@/lib/onboarding/api'
import { useIsMobileDevice } from '@/lib/onboarding/device'

type Login = { ready: boolean; created: boolean; email: string | null }

type Ctx = {
  token: string | null
  login: Login
  setLogin: (l: Login) => void
  checked: string[]
  toggle: (id: string) => void
  complete: () => Promise<void>
  busy: boolean
  error: string | null
}

const SetupContext = createContext<Ctx | null>(null)
const useSetup = () => {
  const c = useContext(SetupContext)
  if (!c) throw new Error('SetupProvider missing')
  return c
}

type Props = {
  token: string | null
  location: string | null
  email: string | null
  services: string[]
  children: React.ReactNode
}

/** Saves which setup steps are checked off, and sends the "setup completed" event. */
export function SetupProvider({ token: tokenProp, location, email, services, children }: Props) {
  const [token, setToken] = useState(tokenProp)
  const [checked, setChecked] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [login, setLogin] = useState<Login>({ ready: false, created: false, email })
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Restore saved checkmarks.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        let t = tokenProp
        // Portal: the server finds the signed-in client's record (client_id) even without location or email.
        if (!t) t = await findSubmission(location ?? '', email ?? '').then((r) => r.token, () => null)
        if (!t) { setLogin((l) => ({ ...l, ready: true })); return }
        const saved = await loadSubmission(t)
        if (cancelled) return
        setToken(saved.token)
        setChecked(saved.setup_steps ?? [])
        setLogin({ ready: true, created: !!saved.login_created, email: saved.login_email ?? email })
      } catch {
        if (!cancelled) setLogin((l) => ({ ...l, ready: true }))
      }
    })()
    return () => { cancelled = true }
  }, [tokenProp, location, email])

  const body = useCallback(
    (steps: string[]) => ({ token, location, email, services, steps_checked: steps }),
    [token, location, email, services],
  )

  const toggle = useCallback((id: string) => {
    setChecked((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        saveSetup(body(next)).then((r) => setToken(r.token)).catch(() => {})
      }, 600)
      return next
    })
  }, [body])

  const complete = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      if (timer.current) clearTimeout(timer.current)
      await completeSetup(body(checked))
      const u = new URL(window.location.href)
      u.searchParams.set('completed', '1')
      window.location.href = u.toString()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save. Please try again.')
      setBusy(false)
    }
  }, [body, checked])

  return <SetupContext.Provider value={{ token, login, setLogin, checked, toggle, complete, busy, error }}>{children}</SetupContext.Provider>
}

export function StepCheckbox({ id }: { id: string }) {
  const { checked, toggle } = useSetup()
  return (
    <label className="mt-6 flex cursor-pointer items-center gap-3 rounded-xl border border-olive-950/10 bg-white px-4 py-3 text-sm font-semibold text-olive-950 dark:border-white/10 dark:bg-white/5 dark:text-white">
      <input type="checkbox" checked={checked.includes(id)} onChange={() => toggle(id)} className="size-4 shrink-0 accent-olive-950" />
      I&rsquo;ve completed this step
    </label>
  )
}

export function CompleteSetupButton() {
  const { complete, busy, error } = useSetup()
  return (
    <div className="mx-auto mt-8 max-w-4xl">
      <button
        type="button"
        onClick={complete}
        disabled={busy}
        className="w-full rounded-full bg-olive-950 px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-olive-800 disabled:opacity-60 dark:bg-white dark:text-olive-950 dark:hover:bg-olive-100"
      >
        {busy ? 'Saving...' : 'I\u2019ve completed setup'}
      </button>
      {error && <p role="alert" className="mt-3 text-center text-sm text-red-600">{error}</p>}
    </div>
  )
}

/** Phones and tablets: explain that setup needs a computer before showing the steps. */
export function DesktopGate({ children }: { children: React.ReactNode }) {
  const mobile = useIsMobileDevice()
  const [dismissed, setDismissed] = useState(false)
  const [copied, setCopied] = useState(false)
  if (!mobile || dismissed) return <>{children}</>
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16 text-olive-950 dark:text-white">
      <div className="w-full max-w-md rounded-3xl border border-olive-950/10 bg-white p-8 text-center dark:border-white/10 dark:bg-white/5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-olive-600 dark:text-olive-300">Account setup</p>
        <h1 className="mt-3 font-display text-3xl font-medium tracking-tight">Please switch to a computer</h1>
        <p className="mt-4 text-base leading-7 text-olive-700 dark:text-olive-300">
          This part does not work on phones or tablets. Sign in to your Kickbord portal on a desktop or laptop and open Onboarding from your dashboard. You will pick up right where you left off.
        </p>
        <p className="mt-3 text-sm text-olive-500 dark:text-olive-400">Do not worry, all your answers are saved.</p>
        <button
          type="button"
          onClick={() => { navigator.clipboard?.writeText(window.location.href); setCopied(true) }}
          className="mt-6 w-full rounded-full bg-olive-950 px-6 py-3 text-sm font-semibold text-white dark:bg-white dark:text-olive-950"
        >
          {copied ? 'Link copied' : 'Copy this link'}
        </button>
        <button type="button" onClick={() => setDismissed(true)} className="mt-4 text-sm text-olive-500 underline">
          Continue anyway
        </button>
      </div>
    </main>
  )
}

const RULES: [string, (p: string) => boolean][] = [
  ['12 or more characters', (p) => p.length >= 12],
  ['An uppercase letter', (p) => /[A-Z]/.test(p)],
  ['A lowercase letter', (p) => /[a-z]/.test(p)],
  ['A number', (p) => /[0-9]/.test(p)],
  ['A symbol, like ! or #', (p) => /[^A-Za-z0-9]/.test(p)],
]

/** First setup step: the client picks the password for their Kickbord account. */
export function CreateLoginCard({ appUrl }: { appUrl: string }) {
  const { token, login, setLogin } = useSetup()
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [existing, setExisting] = useState(false)

  if (!login.ready || !token) return null

  const box = 'rounded-2xl border border-olive-950/10 bg-white p-6 shadow-sm shadow-olive-950/5 sm:p-8 dark:border-white/10 dark:bg-white/5'
  const input = 'w-full rounded-lg border border-olive-950/15 bg-white px-4 py-3 text-sm text-olive-950 focus:outline-none focus:ring-2 focus:ring-olive-950/20 dark:border-white/10 dark:bg-olive-900 dark:text-white'

  if (login.created || existing) {
    return (
      <div className={box}>
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-olive-950 text-sm font-semibold text-white dark:bg-white dark:text-olive-950">&#10003;</span>
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-olive-950 dark:text-white">{existing ? 'You already have a login' : 'Your login is ready'}</h3>
            <p className="mt-2 leading-7 text-olive-700 dark:text-olive-300">
              Sign in with <strong className="font-semibold text-olive-950 dark:text-white">{login.email}</strong>{existing ? ' and your existing password. Forgot it? Use "Forgot password" on the sign-in page.' : ' and the password you just picked.'}
            </p>
            <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-sm leading-6 text-olive-700 dark:text-olive-300">
              <li>Click &ldquo;Sign in to Kickbord&rdquo; below. It opens in a new tab, so keep this page open.</li>
              <li>The first time, we email you a 6-digit security code. Enter it to finish signing in.</li>
              {!existing && <li>You may also get an email called &ldquo;Activate Your Account&rdquo;. You can ignore it.</li>}
            </ol>
            <a href={appUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex rounded-full bg-olive-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-olive-800 dark:bg-white dark:text-olive-950">
              Sign in to Kickbord &#8599;
            </a>
          </div>
        </div>
      </div>
    )
  }

  const ok = RULES.every(([, test]) => test(pw))
  const match = pw.length > 0 && pw === pw2

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!ok) { setErr('Your password does not meet all the rules yet.'); return }
    if (!match) { setErr('The two passwords do not match.'); return }
    setBusy(true)
    setErr(null)
    try {
      const r = await createLogin(token!, pw)
      setPw(''); setPw2('')
      setLogin({ ready: true, created: true, email: r.email })
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setExisting(true)
        setLogin({ ready: true, created: false, email: (e.data?.email as string) ?? login.email })
      } else {
        setErr(e instanceof Error ? e.message : 'Could not create your login. Please try again.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className={box}>
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-olive-950 text-sm font-semibold text-white dark:bg-white dark:text-olive-950"><svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg></span>
        <div className="w-full">
          <p className="text-xs font-semibold uppercase tracking-wider text-olive-500">Before you start</p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight text-olive-950 dark:text-white">Create your Kickbord login</h3>
          <p className="mt-2 leading-7 text-olive-700 dark:text-olive-300">
            Pick the password you will use to sign in. Your email is <strong className="font-semibold text-olive-950 dark:text-white">{login.email}</strong>.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-olive-950 dark:text-white">Password</span>
              <input type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" className={input} />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-olive-950 dark:text-white">Type it again</span>
              <input type={show ? 'text' : 'password'} value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" className={input} />
            </label>
          </div>
          <label className="mt-3 inline-flex items-center gap-2 text-sm text-olive-700 dark:text-olive-300">
            <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="size-4 accent-olive-950" /> Show password
          </label>
          <ul className="mt-4 grid gap-1.5 text-sm sm:grid-cols-2">
            {RULES.map(([label, test]) => (
              <li key={label} className={test(pw) ? 'text-olive-950 dark:text-white' : 'text-olive-500'}>
                {test(pw) ? '\u2713' : '\u2022'} {label}
              </li>
            ))}
            <li className={match ? 'text-olive-950 dark:text-white' : 'text-olive-500'}>{match ? '\u2713' : '\u2022'} Both passwords match</li>
          </ul>
          <p className="mt-4 text-xs text-olive-500">Write it down somewhere safe. We never see or store your password.</p>
          {err && <p role="alert" className="mt-3 text-sm text-red-600">{err}</p>}
          <button type="submit" disabled={busy} className="mt-5 rounded-full bg-olive-950 px-6 py-3 text-sm font-semibold text-white hover:bg-olive-800 disabled:opacity-60 dark:bg-white dark:text-olive-950">
            {busy ? 'Creating your login...' : 'Create my login'}
          </button>
        </div>
      </div>
    </form>
  )
}
