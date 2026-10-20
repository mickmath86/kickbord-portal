import type { Metadata } from 'next'
import { connection } from 'next/server'
import { AppShell } from '@/components/app-shell'
import { getViewedAccount } from '@/lib/account'
import { OnboardingFlow } from '@/components/onboarding/flow'
import { parseServices } from '@/lib/onboarding/services'
import { cleanDemoUrl, first } from '@/lib/onboarding/url'

export const metadata: Metadata = {
  title: 'Client onboarding | Kickbord',
  description: 'Set up your website, AI receptionist, and review funnel with Kickbord. About 10 minutes, and your progress saves as you go.',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

export const instant = false

type SP = Record<string, string | string[] | undefined>

const cleanLocation = (v: string | undefined) => (v && /^[a-zA-Z0-9_-]{8,80}$/.test(v.trim()) ? v.trim() : null)

const clip = (v: string | undefined, n = 120) => (v ? v.trim().slice(0, n) : '')
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Query parameters (all optional):
 *   demo        https link to the client's demo site, shown on the website step
 *   first_name, last_name (or name), email, phone, company   prefill the form
 *   services    comma-separated CRM services, e.g. "Kickbord Launch, Keeping Current Site".
 *               Picks which sections are shown. Empty or "Custom" shows everything. Saved and sent in the webhook.
 *   plan        launch | grow (echoed in the webhook)
 *   cid         CRM contact id (echoed in the webhook)
 *   location    CRM sub-account (location) id. With email, lets the same link resume on any device.
 *   t           resume token (added automatically after the first save)
 *
 * In the portal, the signed-in client's account (or the client an admin is viewing as) fills
 * name, email, phone, company and location. Link parameters, when present, take priority.
 */
export default async function OnboardingPage({ searchParams }: { searchParams: Promise<SP> }) {
  await connection()
  const sp = await searchParams
  const { account } = await getViewedAccount()
  const allow = (process.env.ONBOARDING_DEMO_HOST_ALLOWLIST ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
  const demoUrl = cleanDemoUrl(first(sp.demo), allow)

  let firstName = clip(first(sp.first_name))
  let lastName = clip(first(sp.last_name))
  const fullName = clip(first(sp.name))
  if (!firstName && fullName) {
    const parts = fullName.split(/\s+/)
    firstName = parts.shift() ?? ''
    lastName = lastName || parts.join(' ')
  }
  firstName = firstName || clip(account?.first_name ?? undefined)
  lastName = lastName || clip(account?.last_name ?? undefined)
  const prefill: Record<string, string> = {}
  if (firstName) prefill.first_name = firstName
  if (lastName) prefill.last_name = lastName
  const linkEmail = clip(first(sp.email), 200)
  const email = EMAIL_RE.test(linkEmail) ? linkEmail : clip(account?.email ?? undefined, 200)
  if (EMAIL_RE.test(email)) prefill.email = email
  const phone = clip(first(sp.phone), 40) || clip(account?.phone ?? undefined, 40)
  if (phone) prefill.mobile = phone
  const company = clip(first(sp.company), 200) || clip(account?.business_name ?? undefined, 200)
  if (company) prefill.company_name = company

  const token = clip(first(sp.t), 100)
  const services = parseServices(sp.services)
  return (
    <AppShell>
    <OnboardingFlow
      demoUrl={demoUrl}
      prefill={prefill}
      meta={{
        plan: clip(first(sp.plan), 60) || undefined,
        cid: clip(first(sp.cid), 120) || undefined,
        demo: demoUrl ?? undefined,
        location: cleanLocation(first(sp.location) ?? first(sp.location_id) ?? account?.location_id ?? undefined) ?? undefined,
        email: prefill.email || undefined,
      }}
      tokenParam={token.length >= 20 ? token : null}
      services={services}
    />
    </AppShell>
  )
}
