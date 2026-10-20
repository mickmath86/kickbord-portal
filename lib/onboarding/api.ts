import { createClient } from '@supabase/supabase-js'
import type { Answers, FileRec } from './types'

// Public values (safe to ship to the browser), fixed here so stray Vercel env vars cannot break uploads.
// The anon key only grants uploads through signed URLs; all data calls go through /api/onboarding.
const SUPABASE_URL = 'https://rtlhldhumcmzgbvkqmnm.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0bGhsZGh1bWNtemdidmtxbW5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1MDM5NzAsImV4cCI6MjA5ODA3OTk3MH0.75ekkQTasFQHksnDF0obWw-s1QRz1nsxGmSGmtJeono'
const ENDPOINT = '/api/onboarding'
const BUCKET = 'onboarding-uploads'

export type Meta = { plan?: string; cid?: string; demo?: string; services?: string[]; location?: string; email?: string }

export type Progress = { step_id: string; step_number: number; step_count: number }

async function call<T>(payload: Record<string, unknown>): Promise<T> {
  let res: Response
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new ApiError('Network problem. Check your connection and try again.', 0)
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(data?.error || 'Something went wrong. Please try again.', res.status, data)
  return data as T
}

export class ApiError extends Error {
  constructor(message: string, public status: number, public data?: Record<string, unknown>) {
    super(message)
  }
}

export type Loaded = {
  token: string
  status: 'in_progress' | 'completed'
  step: number
  answers: Answers
  plan: string | null
  demo_url: string | null
  services: string[] | null
  location_id: string | null
  setup_steps: string[]
  setup_completed: boolean
  login_created: boolean
  login_email: string | null
  has_ein_on_file: boolean
  ein_last4: string | null
  files: FileRec[]
}

export const loadSubmission = (token: string) => call<Loaded>({ action: 'load', token })

export const findSubmission = (location: string, email: string) =>
  call<{ token: string; status: string }>({ action: 'find', location, email })

export const saveSetup = (p: { token?: string | null; location?: string | null; email?: string | null; services?: string[]; steps_checked: string[] }) =>
  call<{ ok: true; token: string }>({ action: 'setup_save', ...p })

export const completeSetup = (p: { token?: string | null; location?: string | null; email?: string | null; services?: string[]; steps_checked: string[] }) =>
  call<{ ok: true; token: string; status: string }>({ action: 'setup_complete', ...p })

export const createLogin = (token: string, password: string) =>
  call<{ ok: true; status: 'created' | 'exists'; email: string }>({ action: 'create_login', token, password })

export const saveSubmission = (p: { token?: string | null; step: number; answers: Answers; ein?: string; meta?: Meta; hp?: string; progress?: Progress }) =>
  call<{ ok: true; token: string; status: string }>({ action: 'save', ...p })

export const completeSubmission = (p: { token: string; step: number; answers: Answers; ein?: string }) =>
  call<{ ok: true; status: string }>({ action: 'complete', ...p })

export async function uploadFile(token: string, fieldId: string, file: File): Promise<FileRec> {
  const type = file.type || guessType(file.name)
  const signed = await call<{ path: string; upload_token: string }>({
    action: 'sign_upload', token, field_id: fieldId, filename: file.name, content_type: type, size: file.size,
  })
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } })
  const { error } = await supabase.storage.from(BUCKET).uploadToSignedUrl(signed.path, signed.upload_token, file, { contentType: type })
  if (error) throw new ApiError('Upload failed. Please try again.', 500)
  const reg = await call<{ file: FileRec }>({
    action: 'register_file', token, field_id: fieldId, path: signed.path, name: file.name, size: file.size, content_type: type,
  })
  return reg.file
}

export const deleteFile = (token: string, fileId: string) => call<{ ok: true }>({ action: 'delete_file', token, file_id: fileId })

function guessType(name: string) {
  const ext = name.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml', heic: 'image/heic',
    pdf: 'application/pdf', csv: 'text/csv', xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }
  return (ext && map[ext]) || 'application/octet-stream'
}
