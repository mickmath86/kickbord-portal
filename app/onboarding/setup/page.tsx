import type { Metadata } from 'next'
import { connection } from 'next/server'
import { AppShell } from '@/components/app-shell'
import { ButtonLink, SoftButtonLink } from '@/components/onboarding/kit/button'
import { ArrowNarrowRightIcon, CheckmarkIcon } from '@/components/onboarding/kit/icons'
import { getViewedAccount } from '@/lib/account'
import { CompleteSetupButton, CreateLoginCard, DesktopGate, SetupProvider, StepCheckbox } from '@/components/onboarding/setup-client'
import { parseServices, resolveMods } from '@/lib/onboarding/services'
import { type Instruction, stepsFor } from '@/lib/onboarding/setup-steps'

export const metadata: Metadata = {
  title: 'Account setup | Kickbord onboarding',
  description:
    'A step-by-step guide for configuring your Kickbord CRM, importing contacts, connecting your calendar, and preparing your lead pipeline.',
  robots: { index: false, follow: false },
}

export const instant = false

type SP = Record<string, string | string[] | undefined>

const APP_ORIGIN = 'https://app.kickbord.com'
const LOCATION_ID_RE = /^[a-zA-Z0-9_-]{8,80}$/

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)

function cleanLocationId(value: string | undefined) {
  const id = value?.trim()
  return id && LOCATION_ID_RE.test(id) ? id : null
}

function crmUrl(path: string, locationId: string | null) {
  if (!locationId) return APP_ORIGIN
  return `${APP_ORIGIN}/v2/location/${encodeURIComponent(locationId)}${path}`
}

const QUICK_LINKS = [
  { label: 'Return to onboarding', href: '/onboarding' },
  { label: 'Book implementation help', href: 'https://www.kickbord.com/lp/booking' },
]

function instructionPreview(instructions: Instruction[], limit = 180) {
  const text = instructions.map((item) => item.text).join(' ')
  if (text.length <= limit) return text
  const trimmed = text.slice(0, limit)
  return `${trimmed.slice(0, trimmed.lastIndexOf(' '))}…`
}

function StepVideo({ stepNumber, videoUrl }: { stepNumber: number; videoUrl?: string }) {
  if (videoUrl) {
    return (
      <iframe
        src={videoUrl}
        title={`Step ${stepNumber} video`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="aspect-video w-full rounded-xl border border-olive-950/10 dark:border-white/10"
      />
    )
  }

  return (
    <div className="flex aspect-video flex-col items-center justify-center rounded-xl border border-dashed border-olive-950/20 bg-olive-50 p-4 text-center dark:border-white/20 dark:bg-white/10">
      <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-olive-950 text-white dark:bg-white dark:text-olive-950">
        <span className="ml-0.5 border-y-5 border-l-8 border-y-transparent border-l-current" />
      </div>
      <p className="text-sm font-semibold text-olive-950 dark:text-white">Step {stepNumber} video</p>
      <p className="mt-1 text-xs leading-5 text-olive-500 dark:text-olive-300">Add a lesson embed here</p>
    </div>
  )
}

export default async function CrmSetupGuidePage({ searchParams }: { searchParams: Promise<SP> }) {
  await connection()
  const sp = await searchParams
  // Signed-in portal client: fall back to their account when the link has no location or email.
  const { account } = await getViewedAccount()
  const locationId = cleanLocationId(first(sp.location) ?? first(sp.location_id) ?? account?.location_id ?? undefined)
  const dashboardUrl = crmUrl('/dashboard', locationId)
  const services = parseServices(sp.services)
  const servicesParam = services.join(',')
  const mods = resolveMods(services)
  const steps = stepsFor(mods)
  const token = (first(sp.t) ?? '').trim()
  const resumeToken = /^[A-Za-z0-9_-]{20,100}$/.test(token) ? token : null
  const linkEmail = (first(sp.email) ?? account?.email ?? '').trim().toLowerCase()
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(linkEmail) ? linkEmail : null
  const totalMinutes = steps.reduce((n, step) => n + (parseInt(step.duration, 10) || 0), 0)
  const stepWord = ['zero', 'one', 'two', 'three', 'four', 'five', 'six'][steps.length] ?? String(steps.length)
  const backParams = new URLSearchParams()
  if (resumeToken) backParams.set('t', resumeToken)
  if (locationId) backParams.set('location', locationId)
  if (servicesParam) backParams.set('services', servicesParam)
  const onboardingHref = backParams.size ? `/onboarding?${backParams.toString()}` : '/onboarding'
  const quickLinks = [
    { label: 'Open CRM dashboard', href: dashboardUrl },
    { label: 'Return to onboarding', href: onboardingHref },
    ...QUICK_LINKS.slice(1),
  ]

  if (first(sp.completed) === '1') {
    return (
      <AppShell>
      <main className="flex flex-1 items-center justify-center px-6 py-16 text-olive-950 dark:text-white">
        <div className="w-full max-w-2xl rounded-3xl border border-olive-950/10 bg-white p-8 text-center shadow-2xl shadow-olive-950/10 dark:border-white/10 dark:bg-white/5 sm:p-12">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-olive-950 text-white dark:bg-white dark:text-olive-950">
            <CheckmarkIcon className="size-7" />
          </div>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-olive-600 dark:text-olive-300">
            Onboarding complete
          </p>
          <h1 className="mt-3 font-display text-4xl font-medium tracking-tight sm:text-5xl">
            We&rsquo;ll be in touch with next steps
          </h1>
          <p className="mx-auto mt-4 max-w-md text-lg leading-8 text-olive-700 dark:text-olive-300">
            You are all set. Our team will review everything and reach out to schedule your kickoff call.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href={dashboardUrl}>Return to your CRM <ArrowNarrowRightIcon /></ButtonLink>
            <SoftButtonLink href="/dashboard">Back to your dashboard</SoftButtonLink>
          </div>
        </div>
      </main>
      </AppShell>
    )
  }

  return (
    <AppShell>
    <DesktopGate>
    <SetupProvider token={resumeToken} location={locationId} email={email} services={services}>
    <main className="text-olive-950 dark:text-white">
      <section className="mx-auto max-w-6xl px-6 py-12 sm:py-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-olive-600 dark:text-olive-300">
              Kickbord onboarding &middot; Step 2 of 2
            </p>
            <h1 className="mt-4 font-display text-5xl font-medium tracking-tight sm:text-6xl">
              Set up your account in {stepWord} {steps.length === 1 ? 'step' : 'steps'}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-olive-700 dark:text-olive-300">
              Follow this guided checklist to set up your account and connect the tools in your plan, so every new
              lead lands in the right place.
            </p>
            <div className="mt-6 max-w-xl rounded-2xl border border-olive-950/10 bg-white/70 p-4 text-sm leading-6 text-olive-800 dark:border-white/10 dark:bg-white/10 dark:text-olive-200">
              <strong className="font-semibold text-olive-950 dark:text-white">Use a computer:</strong> these steps open
              your Kickbord account, which only works on a desktop or laptop. Your progress saves as you check off each step.
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={dashboardUrl}>Open the CRM <ArrowNarrowRightIcon /></ButtonLink>
              <a
                href="https://calendar.kickbord.com/widget/booking/6lH4D5VBHvMuRU7YGDky"
                className="inline-flex items-center rounded-full border border-olive-950/15 px-4 py-2 text-sm font-medium text-olive-950 transition-colors hover:bg-white dark:border-white/15 dark:text-white dark:hover:bg-white/10"
              >
                Book a Set up Session
              </a>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-olive-950/10 bg-white shadow-2xl shadow-olive-950/5 dark:border-white/10 dark:bg-white/5">
            <iframe
              className="aspect-video w-full bg-olive-950"
              src="https://www.youtube.com/embed/amIxd-rUbMw"
              title="CRM setup walkthrough video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <div className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="text-sm font-semibold">Full walkthrough</p>
                <p className="text-sm text-olive-500 dark:text-olive-300">About {totalMinutes} minutes total</p>
              </div>
              <span className="rounded-full bg-olive-100 px-3 py-1 text-xs font-medium text-olive-700 dark:bg-white/10 dark:text-olive-200">
                {steps.length} lessons
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-20 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-display text-3xl font-medium sm:text-4xl">Step-by-step setup</h2>
            <p className="mt-3 text-olive-700 dark:text-olive-300">
              Work through each section in order. Each card has a written checklist and a link to the related CRM screen.
            </p>
          </div>
          <div className="rounded-2xl border border-olive-950/10 bg-white px-4 py-3 text-sm text-olive-700 dark:border-white/10 dark:bg-white/5 dark:text-olive-300">
            Estimated time: <strong className="font-semibold text-olive-950 dark:text-white">{totalMinutes} minutes</strong>
          </div>
        </div>

        {/* In the portal the record is found from the signed-in account; the card hides itself if there is none. */}
          <div className="mb-5">
            <CreateLoginCard appUrl={dashboardUrl} />
          </div>
        <ol className="space-y-5">
          {steps.map((step, index) => (
            <li
              key={step.id}
              className="rounded-2xl border border-olive-950/10 bg-white p-6 shadow-sm shadow-olive-950/5 dark:border-white/10 dark:bg-white/5 sm:p-8"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-olive-950 text-sm font-semibold text-white dark:bg-white dark:text-olive-950">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight text-olive-950 dark:text-white">
                      {step.title}
                    </h3>
                    <p className="mt-2 leading-7 text-olive-700 dark:text-olive-300">{step.description}</p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
                  <span className="rounded-full bg-olive-100 px-2.5 py-1 text-xs font-medium text-olive-600 dark:bg-white/10 dark:text-olive-300">
                    {step.duration}
                  </span>
                  <a
                    href={step.externalUrl ?? crmUrl(step.path ?? '/dashboard', locationId)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-olive-950 underline decoration-olive-950/30 underline-offset-4 hover:decoration-olive-950 dark:text-white dark:decoration-white/40 dark:hover:decoration-white"
                  >
                    {step.externalLabel ?? 'Open related screen in CRM'}<ArrowNarrowRightIcon className="size-4" />
                  </a>
                </div>
              </div>

              {(step.videoUrl || !step.externalUrl) && (
                <div className="mt-6">
                  <StepVideo stepNumber={index + 1} videoUrl={step.videoUrl} />
                </div>
              )}

              <div className="mt-6">
                <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-olive-500 dark:text-olive-300">
                  What we&rsquo;ll accomplish
                </h4>
                <ul className="mt-3 space-y-3">
                  {step.tasks.map((task) => (
                    <li key={task} className="flex gap-3 text-sm leading-6 text-olive-800 dark:text-olive-200">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-olive-500" />
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {step.instructions && (
                <details className="group mt-8 rounded-2xl border border-olive-950/10 bg-olive-50 p-5 dark:border-white/10 dark:bg-white/10 sm:p-6">
                  <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    <div className="flex items-center justify-between gap-4">
                      <h4 className="text-base font-semibold text-olive-950 dark:text-white">{step.instructionsTitle}</h4>
                      <ArrowNarrowRightIcon className="size-4 rotate-90 text-olive-500 transition-transform group-open:-rotate-90 dark:text-olive-300" />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-olive-700 group-open:hidden dark:text-olive-300">
                      {instructionPreview(step.instructions)}
                    </p>
                    <span className="mt-3 inline-flex text-sm font-semibold text-olive-950 underline decoration-olive-950/30 underline-offset-4 group-open:hidden dark:text-white dark:decoration-white/40">
                      View full instructions
                    </span>
                  </summary>
                  <ol className="mt-4 list-decimal space-y-4 pl-5 text-sm leading-6 text-olive-800 marker:font-semibold marker:text-olive-950 dark:text-olive-200 dark:marker:text-white">
                    {step.instructions.map((item) => (
                      <li key={item.text}>
                        <p>{item.text}</p>
                        {item.details && (
                          <ul className="mt-2 space-y-1.5 pl-2">
                            {item.details.map((detail) => (
                              <li key={detail} className="flex gap-2.5">
                                <span className="mt-2.5 size-1 shrink-0 rounded-full bg-olive-500" />
                                <span>{detail}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ol>
                </details>
              )}

              <StepCheckbox id={step.id} />
            </li>
          ))}
        </ol>
        <CompleteSetupButton />
      </section>

      <section className="border-t border-olive-950/10 bg-white/60 px-6 py-10 dark:border-white/10 dark:bg-white/5 lg:px-8">
        <div className="mx-auto flex max-w-4xl flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-2xl font-medium sm:text-3xl">Ready for the next part?</h2>
            <p className="mt-2 text-olive-700 dark:text-olive-300">
              If you get stuck, open the CRM directly or book a working session with our team.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {quickLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.href.startsWith('http') ? '_blank' : undefined}
                rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
                className="rounded-full border border-olive-950/15 px-4 py-2 text-sm font-medium text-olive-950 transition-colors hover:bg-olive-950 hover:text-white dark:border-white/15 dark:text-white dark:hover:bg-white dark:hover:text-olive-950"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
        
      </section>
    </main>
    </SetupProvider>
    </DesktopGate>
    </AppShell>
  )
}
