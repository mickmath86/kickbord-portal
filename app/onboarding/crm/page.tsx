import { redirect } from 'next/navigation'

export const instant = false

type SP = Record<string, string | string[] | undefined>

// Old name for the setup stage. Keep old links working.
export default async function CrmRedirect({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(sp)) for (const x of Array.isArray(v) ? v : v ? [v] : []) q.append(k, x)
  redirect(q.size ? `/onboarding/setup?${q.toString()}` : '/onboarding/setup')
}
