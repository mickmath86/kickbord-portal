// Same-origin proxy to the Supabase `onboarding` Edge Function.
// The browser calls /api/onboarding, so there are no CORS issues on localhost, previews, or production.
// The function URL is fixed on purpose: it is public, and ignoring NEXT_PUBLIC_* env vars means a
// stray value in Vercel cannot break the form. Override only with ONBOARDING_FUNCTION_URL (https required).
const DEFAULT_URL = 'https://rtlhldhumcmzgbvkqmnm.supabase.co/functions/v1/onboarding'

function endpoint() {
  const custom = process.env.ONBOARDING_FUNCTION_URL
  return custom && custom.startsWith('https://') ? custom : DEFAULT_URL
}

export async function POST(request: Request) {
  const body = await request.text()
  if (body.length > 300_000) return Response.json({ error: 'Request too large.' }, { status: 413 })

  try {
    const response = await fetch(endpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(25_000),
    })
    return new Response(await response.text(), {
      status: response.status,
      headers: { 'Content-Type': response.headers.get('Content-Type') || 'application/json', 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    console.error('onboarding proxy failed', err)
    return Response.json({ error: 'The onboarding service is temporarily unavailable. Please try again.' }, { status: 502 })
  }
}
