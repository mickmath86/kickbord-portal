// Services Kickbord is providing for a client. Comes from the CRM multi-select field `contact.services`,
// passed in the onboarding link as ?services=Kickbord%20Launch%2C%20Reputation%20Management
//
// Bundles expand into building blocks:
//   Kickbord Launch = Website Rebuild + Reputation Management + AI Fall Back Receptionist
//   Kickbord Grow   = Kickbord Launch + Google Local Services Ads
// Rules:
//   "Keeping Current Site" wins over "Website Rebuild".
//   "Custom", or no services at all, shows every section.

export type ServiceSlug =
  | 'launch'
  | 'grow'
  | 'website_rebuild'
  | 'keep_site'
  | 'reputation'
  | 'ai_receptionist'
  | 'lsa'
  | 'custom'

const LABELS: Record<string, ServiceSlug> = {
  'kickbord launch': 'launch',
  launch: 'launch',
  'kickbord grow': 'grow',
  grow: 'grow',
  'website rebuild': 'website_rebuild',
  website_rebuild: 'website_rebuild',
  'keeping current site': 'keep_site',
  'keep current site': 'keep_site',
  keep_site: 'keep_site',
  'reputation management': 'reputation',
  reputation: 'reputation',
  'ai fall back receptionist': 'ai_receptionist',
  'ai fallback receptionist': 'ai_receptionist',
  'ai receptionist': 'ai_receptionist',
  ai_receptionist: 'ai_receptionist',
  'local services ads': 'lsa',
  'google local services ads': 'lsa',
  lsa: 'lsa',
  custom: 'custom',
}

export const SERVICE_NAMES: Record<ServiceSlug, string> = {
  launch: 'Kickbord Launch',
  grow: 'Kickbord Grow',
  website_rebuild: 'Website rebuild',
  keep_site: 'Keeping your current site',
  reputation: 'Reputation management',
  ai_receptionist: 'AI fall back receptionist',
  lsa: 'Google Local Services Ads',
  custom: 'Custom plan',
}

/** Parse the raw query value (comma, semicolon, or pipe separated; labels or slugs). Unknown values are dropped. */
export function parseServices(raw: unknown): ServiceSlug[] {
  const parts = (Array.isArray(raw) ? raw : [raw])
    .filter((v): v is string => typeof v === 'string')
    .flatMap((v) => v.split(/[,;|]/))
    .map((v) => v.replace(/\+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase())
    .filter(Boolean)
  const out: ServiceSlug[] = []
  for (const p of parts) {
    const slug = LABELS[p]
    if (slug && !out.includes(slug)) out.push(slug)
  }
  return out
}

export type Mods = {
  /** No services, or Custom: ask every section. */
  all: boolean
  /** 'rebuild' = we build the site; 'keep' = we keep theirs and add the chat widget; 'ask' = let them tell us. */
  site: 'rebuild' | 'keep' | 'ask' | null
  reputation: boolean
  receptionist: boolean
  lsa: boolean
  services: ServiceSlug[]
}

export function resolveMods(services: ServiceSlug[]): Mods {
  if (services.length === 0 || services.includes('custom')) {
    return { all: true, site: 'ask', reputation: true, receptionist: true, lsa: true, services }
  }
  const has = (s: ServiceSlug) => services.includes(s)
  const bundle = has('launch') || has('grow')
  const rebuild = bundle || has('website_rebuild')
  return {
    all: false,
    site: has('keep_site') ? 'keep' : rebuild ? 'rebuild' : null,
    reputation: bundle || has('reputation'),
    receptionist: bundle || has('ai_receptionist'),
    lsa: has('grow') || has('lsa'),
    services,
  }
}

/** The email clients invite to their accounts. */
export const KICKBORD_ACCESS_EMAIL = 'mike@kickbord.com'
