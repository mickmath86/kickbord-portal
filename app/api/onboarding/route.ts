// Same-origin proxy to the Supabase `onboarding` Edge Function.
// The browser calls /api/onboarding, so there are no CORS issues on localhost, previews, or production.
// The function URL is fixed on purpose: it is public, and ignoring NEXT_PUBLIC_* env vars means a
// stray value in Vercel cannot break the form. Override only with ONBOARDING_FUNCTION_URL (https required).
//
// Portal only: the signed-in user's access token and the client being viewed are added here, on the
// server. The Edge Function verifies them and links the onboarding record to that client (client_id).
// The browser cannot set these headers itself.
import { getViewedAccount } from '@/lib/account'
import { createClient } from '@/lib/supabase/server'

const DEFAULT_URL = 'https://rtlhldhumcmzgbvkqmnm.supabase.co/functions/v1/onboarding'

function endpoint() {
  const custom = process.env.ONBOARDING_FUNCTION_URL
  return custom && custom.startsWith('https://') ? custom : DEFAULT_URL
}

export async function POST(request: Request) {
  const body = await request.text()
  if (body.length > 300_000) return Response.json({ error: 'Request too large.' }, { status: 413 })

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return Response.json({ error: 'Please sign in again.' }, { status: 401 })
  const { account } = await getViewedAccount()
  if (!account) return Response.json({ error: 'No portal account found for this sign-in.' }, { status: 403 })

  try {
    const response = await fetch(endpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-portal-auth': `Bearer ${session.access_token}`,
        'x-portal-client-id': account.id,
      },
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
