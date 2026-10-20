// Plain-language "how do I find this?" instructions shown under questions.
// Written for business owners who are not technical: one action per step, with direct links.
import { KICKBORD_ACCESS_EMAIL as K } from './services'
import { normalizeUrl } from './url'
import type { Answers } from './types'

export type Guide = {
  title: string
  steps: string[]
  links?: { label: string; href: string }[]
  note?: string
}

// ── domain providers ───────────────────────────────────────────────────────

export const REGISTRARS: [string, string][] = [
  ['godaddy', 'GoDaddy'],
  ['namecheap', 'Namecheap'],
  ['squarespace', 'Squarespace (includes old Google Domains)'],
  ['cloudflare', 'Cloudflare'],
  ['wix', 'Wix'],
  ['network_solutions', 'Network Solutions'],
  ['bluehost', 'Bluehost'],
  ['hostgator', 'HostGator'],
  ['ionos', 'IONOS (1&1)'],
  ['hostinger', 'Hostinger'],
  ['porkbun', 'Porkbun'],
  ['other', 'Other'],
  ['not_sure', 'Not sure'],
]

export const FIND_REGISTRAR: Guide = {
  title: 'How do I find out where my domain is?',
  steps: [
    'Search your email inbox for "domain renewal" or "domain registration". The company that sent the receipt is your domain provider.',
    'Or open the free ICANN lookup below, type your domain (for example yourcompany.com), and click Lookup.',
    'Scroll to "Registrar Information". The name shown there is your domain provider.',
  ],
  links: [{ label: 'Open the ICANN domain lookup', href: 'https://lookup.icann.org/en/lookup' }],
  note: 'Still not sure? Choose "Not sure" and tell us who set up your website. We will figure it out.',
}

const REGISTRAR_INVITES: Record<string, Guide> = {
  godaddy: {
    title: `How to give ${K} access in GoDaddy`,
    steps: [
      'Open the GoDaddy access page below and sign in.',
      'Under "People who can access my account", click "Invite to Access".',
      `Enter the name Mike Mathias and the email ${K}.`,
      'Choose "Products & Domains", then click "Invite".',
    ],
    links: [
      { label: 'Open GoDaddy account access', href: 'https://account.godaddy.com/access' },
      { label: 'GoDaddy help article', href: 'https://www.godaddy.com/help/invite-a-delegate-to-access-my-godaddy-account-12376' },
    ],
    note: 'This does not share your password. You can remove access any time.',
  },
  namecheap: {
    title: `How to give ${K} access in Namecheap`,
    steps: [
      'Open your Namecheap domain list below and sign in.',
      'Click "Manage" next to your domain.',
      'Click the "Sharing & Transfer" tab at the top.',
      `Under "Share Access", type ${K} in "New Manager", then click "Add".`,
      'Choose "Full Access" (or at least DNS access), then confirm.',
    ],
    links: [
      { label: 'Open Namecheap domain list', href: 'https://ap.www.namecheap.com/domains/list/' },
      { label: 'Namecheap help article', href: 'https://www.namecheap.com/support/knowledgebase/article.aspx/192/46/how-do-i-share-access-to-my-domain-with-other-users/' },
    ],
  },
  squarespace: {
    title: `How to give ${K} access in Squarespace Domains`,
    steps: [
      'Open your Squarespace domains page below and sign in.',
      'Click your domain name.',
      'Click "Permissions", then "Invite domain manager".',
      `Enter ${K} and send the invite.`,
    ],
    links: [
      { label: 'Open Squarespace domains', href: 'https://account.squarespace.com/domains' },
      { label: 'Squarespace help article', href: 'https://support.squarespace.com/hc/en-us/articles/25974568684557-Managing-domain-permissions' },
    ],
  },
  cloudflare: {
    title: `How to give ${K} access in Cloudflare`,
    steps: [
      'Open the Cloudflare dashboard below and sign in.',
      'Click "Manage Account" in the left menu, then "Members".',
      `Click "Invite", enter ${K}, and choose the "Administrator" role (or "DNS" if you prefer).`,
      'Click "Continue", then "Invite".',
    ],
    links: [
      { label: 'Open Cloudflare dashboard', href: 'https://dash.cloudflare.com/' },
      { label: 'Cloudflare help article', href: 'https://developers.cloudflare.com/fundamentals/manage-members/manage/' },
    ],
  },
  wix: {
    title: `How to give ${K} access in Wix`,
    steps: [
      'Open your Wix dashboard below and sign in. Pick your site.',
      'Click "Settings", then "Roles & Permissions".',
      `Click "Invite People", enter ${K}, and choose "Admin (Co-Owner)".`,
      'Click "Send Invite".',
    ],
    links: [
      { label: 'Open Wix dashboard', href: 'https://manage.wix.com/' },
      { label: 'Wix help article', href: 'https://support.wix.com/en/article/inviting-people-to-contribute-to-your-site' },
    ],
  },
}

const GENERIC_INVITE = (what: string): Guide => ({
  title: `How to give ${K} access`,
  steps: [
    `Sign in to your ${what} account.`,
    'Look for a menu called "Users", "Team", "Delegate access", "Share access", or "Permissions". It is usually under Account or Settings.',
    `Invite ${K} with admin or full access.`,
    'Can\'t find it? Choose "Help me do this on our kickoff call" and we will do it together in a few minutes.',
  ],
  note: 'Please do not send us your password. An invite keeps your account secure, and you can remove it any time.',
})

export function registrarInviteGuide(a: Answers): Guide {
  const key = a.domain_registrar as string
  if (REGISTRAR_INVITES[key]) return REGISTRAR_INVITES[key]
  const name = REGISTRARS.find(([v]) => v === key)?.[1] ?? 'domain provider'
  return GENERIC_INVITE(key === 'other' && a.domain_registrar_other ? a.domain_registrar_other : name)
}

// ── website platforms ──────────────────────────────────────────────────────

export const PLATFORMS: [string, string][] = [
  ['wordpress', 'WordPress'],
  ['wix', 'Wix'],
  ['squarespace', 'Squarespace'],
  ['webflow', 'Webflow'],
  ['godaddy', 'GoDaddy Website Builder'],
  ['shopify', 'Shopify'],
  ['duda', 'Duda'],
  ['weebly', 'Weebly / Square Online'],
  ['drupal', 'Drupal'],
  ['joomla', 'Joomla'],
  ['custom', 'Custom-built by a developer'],
  ['other', 'Other'],
  ['not_sure', 'Not sure'],
]

export const FIND_PLATFORM: Guide = {
  title: 'How do I find out what my site is built on?',
  steps: [
    'Scroll to the very bottom of your website. Many sites say "Powered by Wix", "Made with Squarespace", or similar.',
    'Or open BuiltWith below, paste your website address, and click Lookup. Look for the "CMS" or "Website builder" line.',
    'Or ask the person who built your site.',
  ],
  links: [{ label: 'Open BuiltWith', href: 'https://builtwith.com/' }],
  note: 'Still not sure? Choose "Not sure" and give us a contact who can help.',
}

export function platformInviteGuide(a: Answers): Guide {
  const site = a.website_url ? normalizeUrl(String(a.website_url)).replace(/\/+$/, '') : ''
  switch (a.website_platform) {
    case 'wordpress':
      return {
        title: `How to give ${K} access in WordPress`,
        steps: [
          site ? 'Click "Open WordPress Add User" below and sign in.' : 'Go to yourwebsite.com/wp-admin and sign in.',
          'In the left menu, click "Users", then "Add New User".',
          `Username: kickbord. Email: ${K}.`,
          'Set "Role" to "Administrator", then click "Add New User".',
        ],
        links: site ? [{ label: 'Open WordPress Add User', href: `${site}/wp-admin/user-new.php` }] : undefined,
      }
    case 'wix':
      return REGISTRAR_INVITES.wix
    case 'squarespace':
      return {
        title: `How to give ${K} access in Squarespace`,
        steps: [
          'Open Squarespace below, sign in, and open your website.',
          'Click "Settings", then "Permissions & Ownership".',
          `Click "Invite contributor", enter ${K}, and choose "Administrator".`,
          'Click "Invite".',
        ],
        links: [
          { label: 'Open Squarespace', href: 'https://account.squarespace.com/' },
          { label: 'Squarespace help article', href: 'https://support.squarespace.com/hc/en-us/articles/206537297-Contributor-roles-and-permissions' },
        ],
      }
    case 'webflow':
      return {
        title: `How to give ${K} access in Webflow`,
        steps: [
          'Open your Webflow dashboard below and sign in.',
          'Open "Workspace settings", then "Members".',
          `Click "Invite", enter ${K}, and choose a role that can edit the site (or invite as an "Agency or Freelancer Guest").`,
          'Send the invite.',
        ],
        links: [{ label: 'Open Webflow dashboard', href: 'https://webflow.com/dashboard' }],
      }
    case 'shopify':
      return {
        title: `How to give ${K} access in Shopify`,
        steps: [
          'Open your Shopify admin below and sign in.',
          'Click "Settings" (bottom left), then "Users".',
          `Click "Add users", enter ${K}, and allow access to "Online Store" and "Themes".`,
          'Click "Send invite".',
        ],
        links: [
          { label: 'Open Shopify admin', href: 'https://admin.shopify.com/' },
          { label: 'Shopify help article', href: 'https://help.shopify.com/en/manual/your-account/users' },
        ],
      }
    case 'godaddy':
      return REGISTRAR_INVITES.godaddy
    default: {
      const name = PLATFORMS.find(([v]) => v === a.website_platform)?.[1] ?? 'website'
      const g = GENERIC_INVITE(a.website_platform === 'other' && a.website_platform_other ? a.website_platform_other : name)
      if (a.website_platform === 'custom') {
        g.steps = [
          `Send your developer this message: "Please add ${K} as an admin on our website so Kickbord can add a chat widget."`,
          'Or choose "Someone else manages it" and give us their contact. We will reach out.',
        ]
      }
      return g
    }
  }
}

// ── Google ─────────────────────────────────────────────────────────────────

export const FIND_GBP_LINK: Guide = {
  title: 'How do I find my Google Business Profile link?',
  steps: [
    'Open Google Maps below.',
    'Search for your business name and city, then click your business.',
    'Click "Share", then "Copy link".',
    'Paste the link here.',
  ],
  links: [
    { label: 'Open Google Maps', href: 'https://www.google.com/maps' },
    { label: 'Open your Business Profiles', href: 'https://business.google.com/locations' },
  ],
  note: 'Can\'t find it? Type your business name and city exactly as they appear on Google.',
}

export const FIND_GBP_OWNER: Guide = {
  title: 'Which Google email owns my profile?',
  steps: [
    'Open the Business Profile link below.',
    'If you see your business listed, you are signed in with the right account. Click your picture in the top right to see the email.',
    'If you see no business, try signing in with your other Google or Gmail accounts.',
  ],
  links: [{ label: 'Open Google Business Profiles', href: 'https://business.google.com/locations' }],
}

export const GBP_VIDEO: Guide = {
  title: 'What Google will ask for: a short verification video',
  steps: [
    'Google usually asks new businesses to record one continuous video, at least 30 seconds long, on your phone.',
    'Show where you work: street signs or landmarks in your service area.',
    'Show that it is your business: your work truck or branded tools, and a permit, invoice, or business license with your business name.',
    'We will walk you through it on our kickoff call. No need to record anything yet.',
  ],
  links: [{ label: 'Google help: video verification', href: 'https://support.google.com/business/answer/14271705?hl=en' }],
}

export const FIND_ADS_ACCOUNT: Guide = {
  title: 'How do I check if I have a Google Ads account?',
  steps: [
    'Open Google Ads below and sign in with your business Google or Gmail account.',
    'If you see a dashboard with your business name, you have an account. Choose "Yes".',
    'If Google asks you to create a new account, close the page and choose "No". Do not create one yet. We will set it up for you.',
  ],
  links: [{ label: 'Open Google Ads', href: 'https://ads.google.com/' }],
}

export const FIND_CUSTOMER_ID: Guide = {
  title: 'How do I find my Google Ads customer ID?',
  steps: [
    'Open Google Ads below and sign in.',
    'Click your profile picture in the top right corner.',
    'Your customer ID is the 10-digit number under your account name. It looks like 123-456-7890.',
    'You can also find it on past Google Ads emails or billing receipts.',
  ],
  links: [
    { label: 'Open Google Ads', href: 'https://ads.google.com/' },
    { label: 'Google help: find your customer ID', href: 'https://support.google.com/google-ads/answer/1704344?hl=en' },
  ],
}

export const LSA_DOCS: Guide = {
  title: 'Why Google needs these',
  steps: [
    'Google checks every business before Local Services Ads can run. Depending on your trade, this can include your license, insurance, and background checks.',
    'License: a photo of your contractor license card, or a screenshot from your state license lookup.',
    'Insurance: ask your insurance agent for a "certificate of insurance" (COI) PDF. They can email it the same day.',
  ],
}

// ── IRS EIN confirmation letter ────────────────────────────────────────────

export const FIND_EIN_LETTER: Guide = {
  title: 'Where do I find my EIN letter?',
  steps: [
    'Look for a letter from the IRS called "CP 575" that came after you got your EIN. If you applied online, it was a PDF you could download or save at the end.',
    'Search your email and computer for "CP 575" or "EIN". Check the folder where you keep business or tax papers.',
    'Found it? Take a clear photo of the whole first page, or upload the PDF here.',
    'Lost it? If you have an IRS Business Tax Account, sign in and download a new copy under your notices.',
    'No online account? Call the IRS Business and Specialty Tax Line at 800-829-4933 (Monday to Friday, 7 a.m. to 7 p.m. your local time). Ask for "Letter 147C, EIN Previously Assigned". They can fax or mail it to you.',
  ],
  links: [
    { label: 'IRS Business Tax Account', href: 'https://www.irs.gov/businesses/business-tax-account' },
    { label: 'IRS help with EIN letters', href: 'https://www.irs.gov/businesses/employer-identification-number' },
  ],
  note: 'This is optional. Can\'t find it right now? Skip it and keep going. Carriers check that your business name matches IRS records, and this letter shows your exact legal name.',
}

export const FIND_EIN: Guide = {
  title: 'How do I check if my business has an EIN?',
  steps: [
    'Look for an IRS letter called "CP 575". Your EIN is printed near the top.',
    'Check a past business tax return. The EIN is at the top of the first page.',
    'Check the paperwork from when you opened your business bank account, or any 1099 or payroll forms you sent out.',
    'Ask your accountant or bookkeeper. They will usually know right away.',
    'Still not sure? Call the IRS at 800-829-4933 (Monday to Friday, 7 a.m. to 7 p.m. your local time) and ask if your business has an EIN.',
  ],
  note: 'Most LLCs and corporations have one. If you find it, change your answer to "Yes".',
}

export const GET_EIN: Guide = {
  title: 'How do I get an EIN?',
  steps: [
    'Open the IRS page below and click "Apply for an EIN". It is free. Never pay another website for one.',
    'Have your Social Security number ready. You have to finish in one sitting, and it times out after 15 minutes of no activity.',
    'Answer the questions. When you are approved, your EIN shows on the screen right away.',
    'Download and save the confirmation letter (CP 575) at the end. You can upload it here.',
    'Come back to this form using the link in your onboarding email, change your answer to "Yes", and enter your EIN.',
  ],
  links: [{ label: 'Apply for an EIN on IRS.gov', href: 'https://www.irs.gov/businesses/small-businesses-self-employed/get-an-employer-identification-number' }],
  note: 'Carriers can take about 15 days to see a new EIN, so we wait about two weeks before registering you.',
}
