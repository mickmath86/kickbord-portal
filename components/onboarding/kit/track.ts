// Analytics hook. The portal has no analytics yet; this forwards to PostHog only if a page loads it.
export function track(event: string, props?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  const ph = (window as unknown as { posthog?: { capture: (e: string, p?: Record<string, unknown>) => void } }).posthog
  try { ph?.capture(event, props) } catch { /* ignore */ }
}
