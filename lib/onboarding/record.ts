import { createClient } from '@/lib/supabase/server'
import { STEPS } from '@/lib/onboarding/schema'
import type { Field } from '@/lib/onboarding/types'

// A client's onboarding answers, read through the client_onboardings.client_id relation.
// RLS lets a client read only their own record and admins read all. The resume token and the
// encrypted EIN are not readable from the portal.
export type OnboardingRecord = {
  id: string
  client_id: string
  status: 'in_progress' | 'completed'
  answers: Record<string, unknown>
  services: string[] | null
  plan: string | null
  progress_step_number: number | null
  progress_step_count: number | null
  ein_last4: string | null
  setup_steps: string[] | null
  setup_completed_at: string | null
  login_email: string | null
  login_created_at: string | null
  webhook_status: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
}

const COLUMNS =
  'id, client_id, status, answers, services, plan, progress_step_number, progress_step_count, ein_last4, setup_steps, setup_completed_at, login_email, login_created_at, webhook_status, created_at, updated_at, completed_at'

export async function getOnboardingRecord(clientId: string): Promise<OnboardingRecord | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('client_onboardings')
    .select(COLUMNS)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1)
  return (data?.[0] as OnboardingRecord | undefined) ?? null
}

export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed'
export const statusOf = (r: OnboardingRecord | null): OnboardingStatus => (r ? r.status : 'not_started')

// ── readable answers for the admin view ─────────────────────────────────────
const SKIP = new Set(['note', 'demo', 'consent', 'ein'])

function format(field: Field, v: unknown): string {
  if (v === null || v === undefined || v === '') return ''
  const label = (x: unknown) => field.options?.find((o) => o.value === x)?.label ?? String(x)
  if (Array.isArray(v)) {
    if (v.every((x) => typeof x !== 'object' || x === null)) return v.map(label).join(', ')
    return v
      .map((row) =>
        Object.entries(row as Record<string, unknown>)
          .filter(([, x]) => x !== '' && x !== null && x !== undefined && x !== false)
          .map(([k, x]) => `${field.columns?.find((c) => c.id === k)?.label ?? k}: ${x === true ? 'Yes' : x}`)
          .join(' · '),
      )
      .filter(Boolean)
      .join('\n')
  }
  if (typeof v === 'object') {
    return Object.entries(v as Record<string, unknown>)
      .map(([k, x]) => `${k}: ${typeof x === 'object' && x !== null ? Object.values(x).filter(Boolean).join(' to ') || 'closed' : x}`)
      .join('\n')
  }
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  return label(v)
}

export type AnswerSection = { id: string; title: string; rows: { label: string; value: string }[] }

export function answerSections(answers: Record<string, unknown>): AnswerSection[] {
  const used = new Set<string>()
  const sections: AnswerSection[] = []
  for (const step of STEPS) {
    const rows: { label: string; value: string }[] = []
    for (const f of step.fields) {
      used.add(f.id)
      if (SKIP.has(f.type) || f.type === 'file') continue
      const value = format(f, answers[f.id])
      if (value) rows.push({ label: f.label, value })
    }
    if (rows.length) sections.push({ id: step.id, title: typeof step.title === 'string' ? step.title : step.id, rows })
  }
  const extra = Object.entries(answers).filter(([k, v]) => !used.has(k) && v !== '' && v !== null && v !== undefined)
  if (extra.length) {
    sections.push({
      id: 'other',
      title: 'Other answers',
      rows: extra.map(([k, v]) => ({ label: k, value: typeof v === 'object' ? JSON.stringify(v) : String(v) })),
    })
  }
  return sections
}
