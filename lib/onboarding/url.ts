/** Validate a demo-site link passed in the query string. Returns a normalized https URL or null. */
export function cleanDemoUrl(raw: unknown, allowlist: string[] = []): string | null {
  if (typeof raw !== 'string' || raw.length > 500) return null
  try {
    const u = new URL(raw.trim())
    if (u.protocol !== 'https:' || u.username || u.password) return null
    const h = u.hostname.toLowerCase()
    if (!h.includes('.') || h === 'localhost' || /^\d{1,3}(\.\d{1,3}){3}$/.test(h) || h.includes(':')) return null
    if (allowlist.length && !allowlist.some((d) => h === d || h.endsWith(`.${d}`))) return null
    return u.toString()
  } catch {
    return null
  }
}

/** Bare domains like "acme.com" become "https://acme.com". */
export function normalizeUrl(raw: string): string {
  const t = raw.trim()
  if (!t) return ''
  return /^https?:\/\//i.test(t) ? t : `https://${t}`
}

export const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
