import {
  FIND_ADS_ACCOUNT, FIND_CUSTOMER_ID, FIND_EIN, FIND_EIN_LETTER, GET_EIN, FIND_GBP_LINK, FIND_GBP_OWNER, FIND_PLATFORM, FIND_REGISTRAR, GBP_VIDEO, LSA_DOCS,
  PLATFORMS, REGISTRARS, platformInviteGuide, registrarInviteGuide,
} from './guides'
import { KICKBORD_ACCESS_EMAIL } from './services'
import { presetFor } from './trades'
import type { Answers, Ctx, Field, Option, Step } from './types'

const o = (...pairs: [string, string][]): Option[] => pairs.map(([value, label]) => ({ value, label }))
const YES_NO = o(['yes', 'Yes'], ['no', 'No'])
const YES_NO_UNSURE = o(['yes', 'Yes'], ['no', 'No'], ['not_sure', 'Not sure'])

export const DAYS = [
  ['mon', 'Monday'], ['tue', 'Tuesday'], ['wed', 'Wednesday'], ['thu', 'Thursday'],
  ['fri', 'Friday'], ['sat', 'Saturday'], ['sun', 'Sunday'],
] as const

export function defaultHours() {
  const h: Record<string, { open: string; close: string; closed: boolean }> = {}
  for (const [k] of DAYS) {
    const weekend = k === 'sat' || k === 'sun'
    h[k] = { open: '08:00', close: '17:00', closed: weekend }
  }
  return h
}

export const DEMO_FEEDBACK = {
  keep: 'keep_as_is',
  tweaks: 'keep_with_changes',
  redo: 'start_over',
} as const

/** The client liked the demo site and wants to keep it (as is or with changes). */
export const demoKept = (a: Answers, ctx: Ctx) =>
  ctx.demo && (a.demo_feedback === DEMO_FEEDBACK.keep || a.demo_feedback === DEMO_FEEDBACK.tweaks)

/** Full look-and-feel questions: no demo, or the client wants something different. */
const askFullLook = (a: Answers, ctx: Ctx) => !demoKept(a, ctx)
/** Any look-and-feel questions: everything except "keep it as is". */
const askAnyLook = (a: Answers, ctx: Ctx) => !(ctx.demo && a.demo_feedback === DEMO_FEEDBACK.keep)

const is = (id: string, ...vals: string[]) => (a: Answers) => vals.includes(a[id])

/** We are building them a new website (rebuild, or the full plan unless they chose to keep their site). */
const rebuilding = (a: Answers, ctx: Ctx) =>
  ctx.mods.site === 'rebuild' || (ctx.mods.site === 'ask' && a.website_plan !== 'keep_add')
/** We are keeping their website and adding the chat widget. */
const keepingSite = (a: Answers, ctx: Ctx) =>
  ctx.mods.site === 'keep' || (ctx.mods.site === 'ask' && a.has_website === 'yes' && a.website_plan === 'keep_add')
/** They have a website we need to know about. */
const hasSite = (a: Answers, ctx: Ctx) => ctx.mods.site === 'keep' || (ctx.mods.site !== null && a.has_website === 'yes')
/** We need a contact for whoever manages their website or domain. */
const needsWebContact = (a: Answers, ctx: Ctx) =>
  (hasSite(a, ctx) && a.website_platform === 'not_sure') ||
  (keepingSite(a, ctx) && a.site_access === 'someone_else') ||
  (rebuilding(a, ctx) && (a.has_domain === 'not_sure' ||
    (a.has_domain === 'yes' && (a.domain_registrar === 'not_sure' || a.domain_access === 'someone_else' || a.domain_access === 'not_sure'))))

const BASE_STEPS: Step[] = [
  {
    id: 'you',
    title: 'About you and your business',
    intro: 'Quick basics so we know who we are working with.',
    fields: [
      { id: 'first_name', label: 'First name', type: 'text', required: true, autoComplete: 'given-name', half: true },
      { id: 'last_name', label: 'Last name', type: 'text', required: true, autoComplete: 'family-name', half: true },
      { id: 'mobile', label: 'Mobile number', type: 'tel', required: true, autoComplete: 'tel', half: true, help: 'We text urgent updates here.' },
      { id: 'email', label: 'Email', type: 'email', required: true, autoComplete: 'email', half: true },
      {
        id: 'role', label: 'Your role', type: 'select', required: true, half: true,
        options: o(['owner', 'Owner'], ['manager', 'Manager'], ['office_admin', 'Office or admin'], ['other', 'Other']),
      },
      { id: 'company_name', label: 'Business name', type: 'text', required: true, autoComplete: 'organization', half: true },
      {
        id: 'team_size', label: 'Team size', type: 'select', required: true, half: true,
        options: o(['just_me', 'Just me'], ['2_5', '2 to 5'], ['6_10', '6 to 10'], ['11_25', '11 to 25'], ['26_plus', '26 or more']),
      },
      {
        id: 'years_in_business', label: 'Years in business', type: 'select', half: true,
        options: o(['lt1', 'Less than 1'], ['1_2', '1 to 2'], ['3_5', '3 to 5'], ['6_10', '6 to 10'], ['10_plus', 'More than 10']),
      },
    ],
  },
  {
    id: 'legal',
    title: 'Business details for texting',
    intro:
      'US carriers require every business to be registered before it can send text messages. These details are used only for that registration. This takes about two minutes.',
    fields: [
      {
        id: 'entity_type', label: 'How is your business set up?', type: 'select', required: true,
        options: o(
          ['llc', 'LLC'], ['corporation', 'Corporation'], ['partnership', 'Partnership'], ['nonprofit', 'Nonprofit'],
          ['sole_proprietor', 'Sole proprietor (no registered entity)'], ['other', 'Other'], ['not_sure', 'Not sure'],
        ),
      },
      {
        id: 'has_ein', label: 'Does your business have an EIN (federal tax ID)?', type: 'radio', required: true, options: YES_NO_UNSURE,
        help: 'This is the 9-digit federal tax number for your business, like 12-3456789. It is not your Social Security number.',
      },
      {
        id: 'ein_unsure_note', label: 'Check first', type: 'note', showIf: is('has_ein', 'not_sure'), guide: FIND_EIN,
        body: 'Your EIN decides how much you can text, so it is worth a quick check.',
      },
      {
        id: 'no_ein_note', label: 'Texting without an EIN', type: 'note', showIf: is('has_ein', 'no'), guide: GET_EIN,
        body: 'Without an EIN, we register you as a sole proprietor. That works, but carriers limit you to 1 texting number and about 1,000 texts a day to T-Mobile customers. An EIN removes those limits, and getting one is free and takes about 15 minutes online.',
      },
      {
        id: 'ein_plan', label: 'What would you like to do?', type: 'radio', required: true, showIf: is('has_ein', 'no'),
        options: o(['sole_prop', 'Register me as a sole proprietor for now'], ['get_ein', 'I will get an EIN first']),
      },
      {
        id: 'sp_email', label: 'Personal email for the registration', type: 'email', required: true,
        showIf: (a) => a.has_ein === 'no' && a.ein_plan === 'sole_prop',
        help: 'Must be a free email like Gmail, Yahoo, or Outlook.com. Carriers do not accept business emails for sole proprietors.',
        defaultValue: (a) => (/@(gmail|yahoo|outlook|hotmail|icloud|aol)\./i.test(a.email ?? '') ? a.email : ''),
      },
      {
        id: 'sp_mobile', label: 'Your personal cell phone', type: 'tel', required: true,
        showIf: (a) => a.has_ein === 'no' && a.ein_plan === 'sole_prop',
        help: 'Carriers text a code here to confirm it is you, and we will ask you for it. It must be a real cell phone, not Google Voice or an internet phone line.',
        defaultValue: (a) => a.mobile ?? '',
      },
      {
        id: 'ein', label: 'EIN', type: 'ein', required: true, showIf: is('has_ein', 'yes'),
        help: 'Stored encrypted. It is never shown on your website or sent to other tools. Got your EIN in the last 15 days? Carriers may not see it yet, so we may wait a bit before registering.',
      },
      {
        id: 'ein_letter', label: 'IRS EIN confirmation letter, CP 575 or 147C (optional)', type: 'file', showIf: is('has_ein', 'yes'),
        accept: '.pdf,.png,.jpg,.jpeg,.webp,.heic', maxFiles: 1, guide: FIND_EIN_LETTER,
        help: 'A photo or PDF of the letter. It helps your texting registration get approved faster.',
      },
      {
        id: 'legal_name', label: 'Legal business name', type: 'text', required: true,
        help: 'Exactly as it appears on your IRS letter (CP 575 or 147C), including LLC or Inc. No EIN? Use your full legal name, without LLC or Inc.',
      },
      { id: 'dba_name', label: 'Doing business as (if different)', type: 'text' },
      { id: 'address_street', label: 'Business street address', type: 'text', required: true, autoComplete: 'address-line1' },
      { id: 'address_city', label: 'City', type: 'text', required: true, autoComplete: 'address-level2', half: true },
      { id: 'address_state', label: 'State', type: 'text', required: true, autoComplete: 'address-level1', placeholder: 'CA', half: true },
      { id: 'address_zip', label: 'ZIP code', type: 'text', required: true, autoComplete: 'postal-code', half: true },
      {
        id: 'address_kind', label: 'Is this address your home?', type: 'radio', required: true, half: true,
        options: o(
          ['home_hidden', 'Yes, keep it off my public listings'],
          ['home_ok', 'Yes, but it is fine to show'],
          ['business', 'No, it is a business location'],
        ),
      },
    ],
  },
  {
    id: 'business',
    title: 'Your trade and services',
    intro: 'This shapes your website, your AI receptionist, and the questions it can answer.',
    fields: [
      { id: 'trade', label: 'Primary trade', type: 'trade', required: true, help: 'Pick the closest match.' },
      { id: 'trade_other', label: 'Describe your trade', type: 'text', required: true, showIf: (a) => a.trade === 'Other (not listed)' },
      { id: 'other_trades', label: 'Other trades you offer (optional)', type: 'trades' },
      {
        id: 'services', label: 'Services you offer', type: 'tags', required: true,
        help: 'Type a service and press Enter, or tap a suggestion.',
        suggestions: (a) => presetFor(a.trade)?.services ?? [],
      },
      {
        id: 'services_excluded', label: 'Work you do not do, or calls you do not want', type: 'textarea',
        help: 'Helps the AI avoid booking the wrong jobs.',
      },
      {
        id: 'service_cities', label: 'Cities and ZIP codes you serve', type: 'tags', required: true,
        placeholder: 'Ventura, 93003, Oxnard',
      },
      { id: 'cities_excluded', label: 'Places you do not serve (optional)', type: 'tags' },
      { id: 'license_number', label: 'License number and classification (optional)', type: 'text', half: true },
      { id: 'insured', label: 'Insured and bonded?', type: 'radio', half: true, options: o(['yes', 'Both'], ['insured', 'Insured only'], ['no', 'Neither']) },
      { id: 'hours', label: 'Business hours', type: 'hours', required: true },
      {
        id: 'emergency_after_hours', label: 'Do you take emergency calls outside those hours?', type: 'radio', required: true,
        options: o(['yes_fee', 'Yes, with an after-hours fee'], ['yes_same', 'Yes, at normal rates'], ['no', 'No']),
      },
      {
        id: 'payment_methods', label: 'Payment methods you accept', type: 'checkboxes',
        options: o(['card', 'Credit or debit card'], ['cash', 'Cash'], ['check', 'Check'], ['zelle', 'Zelle or Venmo'], ['financing', 'Financing'], ['other', 'Other']),
      },
      { id: 'brands', label: 'Brands you install or service (optional)', type: 'tags' },
      { id: 'warranty', label: 'Warranty or guarantee (optional)', type: 'text' },
      { id: 'diff_1', label: 'What makes you different? (optional)', type: 'text', placeholder: 'For example: same-day service' },
      { id: 'diff_2', label: 'Second thing (optional)', type: 'text' },
      { id: 'diff_3', label: 'Third thing (optional)', type: 'text' },
    ],
  },
  {
    id: 'web',
    title: (a, ctx) => (ctx.mods.site === 'keep' ? 'Your current website' : 'Website, domain, and email'),
    intro: (_a, ctx) =>
      ctx.mods.site === 'keep'
        ? 'We will keep your website and add your AI chat assistant to it. We just need to know how to get in.'
        : ctx.demo && ctx.mods.site !== null
          ? 'Take another look at the demo site we built for you, then tell us what you think.'
          : 'This tells us what to build and what to connect.',
    showIf: (_a, ctx) => ctx.mods.site !== null,
    fields: [
      { id: 'demo_preview', label: 'Your demo site', type: 'demo', showIf: (_a, ctx) => ctx.demo && ctx.mods.site !== 'keep' },
      {
        id: 'demo_feedback', label: 'Did you like the demo website we showed you on our call?', type: 'radio', required: true,
        showIf: (_a, ctx) => ctx.demo && ctx.mods.site !== 'keep',
        options: [
          { value: DEMO_FEEDBACK.keep, label: 'Yes, keep it as it is', hint: 'We will finish it and launch it.' },
          { value: DEMO_FEEDBACK.tweaks, label: 'Yes, with some changes', hint: 'Tell us what to change.' },
          { value: DEMO_FEEDBACK.redo, label: 'No, I would like something different', hint: 'We will ask a few questions about the look you want.' },
        ],
      },
      {
        id: 'demo_changes', label: 'What would you like us to change?', type: 'textarea', required: true,
        showIf: (a, ctx) => ctx.demo && ctx.mods.site !== 'keep' && a.demo_feedback === DEMO_FEEDBACK.tweaks,
        placeholder: 'Wording, photos, colors, pages, anything.',
      },
      {
        id: 'demo_notes', label: 'Anything else we should know about the site? (optional)', type: 'textarea',
        showIf: (a, ctx) => ctx.demo && ctx.mods.site !== 'keep' && a.demo_feedback === DEMO_FEEDBACK.keep,
      },
      {
        id: 'has_website', label: 'Do you have a website today?', type: 'radio', required: true, options: YES_NO,
        showIf: (_a, ctx) => ctx.mods.site !== 'keep',
        help: (_a, ctx) => (ctx.demo ? 'This is about the website you have today, not the demo.' : undefined),
      },
      { id: 'website_url', label: 'Your website address', type: 'url', required: true, showIf: hasSite, placeholder: 'yourcompany.com' },
      {
        id: 'website_plan', label: 'What should we do with it?', type: 'radio', required: true,
        showIf: (a, ctx) => ctx.mods.site === 'ask' && a.has_website === 'yes' && !demoKept(a, ctx),
        options: o(['replace', 'Replace it'], ['improve', 'Improve it'], ['keep_add', 'Keep it and only add the chat and AI features']),
      },
      {
        id: 'website_platform', label: 'What is your website built on?', type: 'select', required: true, showIf: hasSite,
        options: o(...PLATFORMS), guide: FIND_PLATFORM,
      },
      {
        id: 'site_access', label: `Please invite ${KICKBORD_ACCESS_EMAIL} as an admin on your website`, type: 'radio', required: true,
        showIf: (a, ctx) => keepingSite(a, ctx) && !!a.website_platform && a.website_platform !== 'not_sure',
        help: 'We need this to add the chat assistant to your site. We never need your password.',
        guide: (a) => platformInviteGuide(a),
        options: o(
          ['sent', `Done, I sent the invite to ${KICKBORD_ACCESS_EMAIL}`],
          ['kickoff', 'Help me do this on our kickoff call'],
          ['someone_else', 'Someone else manages my website'],
        ),
      },
      {
        id: 'has_domain', label: 'Do you own a domain name?', type: 'radio', required: true, options: YES_NO_UNSURE, showIf: rebuilding,
        help: 'A domain is your web address, like yourcompany.com.',
      },
      {
        id: 'domain_name', label: 'Domain name', type: 'text', required: true, placeholder: 'yourcompany.com',
        showIf: (a, ctx) => rebuilding(a, ctx) && a.has_domain === 'yes',
      },
      {
        id: 'domain_registrar', label: 'Where is your domain registered?', type: 'select', required: true,
        showIf: (a, ctx) => rebuilding(a, ctx) && a.has_domain === 'yes',
        options: o(...REGISTRARS), guide: FIND_REGISTRAR,
      },
      {
        id: 'domain_access', label: 'Can you sign in to that account?', type: 'radio', required: true,
        showIf: (a, ctx) => rebuilding(a, ctx) && a.has_domain === 'yes' && !!a.domain_registrar && a.domain_registrar !== 'not_sure',
        options: o(['me', 'Yes, I can'], ['someone_else', 'Someone else manages it'], ['not_sure', 'Not sure']),
      },
      {
        id: 'domain_invite', label: `Please invite ${KICKBORD_ACCESS_EMAIL} to your domain account`, type: 'radio', required: true,
        showIf: (a, ctx) => rebuilding(a, ctx) && a.has_domain === 'yes' && a.domain_access === 'me',
        help: 'We need this to point your domain to your new website and set up your business email. We never need your password.',
        guide: (a) => registrarInviteGuide(a),
        options: o(['sent', `Done, I sent the invite to ${KICKBORD_ACCESS_EMAIL}`], ['kickoff', 'Help me do this on our kickoff call']),
      },
      {
        id: 'web_contact_note', label: 'Who can help us with your website or domain?', type: 'note', showIf: needsWebContact,
        body: 'No problem. Give us the name and email of whoever built your site or set up your domain, like a web designer, IT person, or family member. We will reach out to them directly.',
      },
      { id: 'web_contact_name', label: 'Their name', type: 'text', required: true, half: true, showIf: needsWebContact },
      { id: 'web_contact_email', label: 'Their email', type: 'email', required: true, half: true, showIf: needsWebContact },
      { id: 'web_contact_phone', label: 'Their phone (optional)', type: 'tel', half: true, showIf: needsWebContact },
      {
        id: 'domain_help', label: 'Want us to help you pick and register one?', type: 'radio', required: true, options: YES_NO,
        showIf: (a, ctx) => rebuilding(a, ctx) && a.has_domain === 'no',
      },
      {
        id: 'email_preference', label: 'Which email should customers see on your website and emails?', type: 'radio', required: true,
        showIf: rebuilding,
        options: [
          { value: 'new_domain_email', label: 'Set up a business email on my domain (recommended)', hint: 'For example you@yourcompany.com. It looks more professional, builds trust, and helps your emails reach the inbox. We set it up for you, and your old messages can be forwarded.' },
          { value: 'keep_current', label: 'Keep my current email' },
          { value: 'not_sure', label: 'Not sure, advise me' },
        ],
      },
      {
        id: 'email_addresses_wanted', label: 'Which addresses would you like?', type: 'text', required: true,
        showIf: (a, ctx) => rebuilding(a, ctx) && a.email_preference === 'new_domain_email', placeholder: 'info@, firstname@, service@',
      },
    ],
  },
  {
    id: 'google',
    title: 'Your Google Business Profile',
    intro: 'Your Google Business Profile is the listing that shows on Google Maps and Search. It is how most local customers find you and read your reviews.',
    showIf: (_a, ctx) => ctx.mods.reputation || ctx.mods.lsa,
    fields: [
      {
        id: 'has_gbp', label: 'Do you have a Google Business Profile?', type: 'radio', required: true, options: YES_NO_UNSURE,
        help: 'Search your business name on Google. If a box with your business, reviews, and a map shows up, you have one.',
      },
      { id: 'gbp_url', label: 'Link to your Business Profile', type: 'text', required: true, showIf: is('has_gbp', 'yes'), placeholder: 'https://maps.app.goo.gl/...', guide: FIND_GBP_LINK },
      { id: 'gbp_owner_email', label: 'Which Google email owns it?', type: 'email', required: true, showIf: is('has_gbp', 'yes'), guide: FIND_GBP_OWNER },
      { id: 'gbp_verified', label: 'Does Google show it as verified?', type: 'radio', showIf: is('has_gbp', 'yes'), options: YES_NO_UNSURE, help: 'Verified profiles can be edited and show a "Your business on Google" panel when you are signed in.' },
      {
        id: 'gbp_connect_note', label: 'Next step', type: 'note', showIf: is('has_gbp', 'yes'),
        body: 'After this form, your CRM setup guide will walk you through connecting your profile in a few clicks.',
      },
      {
        id: 'gbp_visit', label: 'Do customers come to your location?', type: 'radio', required: true, showIf: is('has_gbp', 'no', 'not_sure'),
        options: o(['service_area', 'No, I go to my customers'], ['storefront', 'Yes, customers visit me'], ['both', 'Both']),
        help: 'No worries. We will search for an existing profile first, then create one with you on our kickoff call.',
      },
      { id: 'gbp_google_email', label: 'Which Google or Gmail account should own your new profile?', type: 'email', required: true, showIf: is('has_gbp', 'no', 'not_sure'), help: 'Use an account you will keep. You will own the profile, and we will be added as a manager.', defaultValue: (a) => a.email ?? '' },
      { id: 'gbp_video_note', label: 'Verification', type: 'note', showIf: is('has_gbp', 'no', 'not_sure'), guide: GBP_VIDEO, body: 'Google needs to confirm your business is real before your profile goes live.' },
      { id: 'review_link', label: 'Existing Google review link (optional)', type: 'url', showIf: (a, ctx) => ctx.mods.reputation && a.has_gbp === 'yes' },
      { id: 'social_facebook', label: 'Facebook page (optional)', type: 'text', half: true, showIf: (_a, ctx) => ctx.mods.reputation },
      { id: 'social_instagram', label: 'Instagram (optional)', type: 'text', half: true, showIf: (_a, ctx) => ctx.mods.reputation },
      { id: 'social_yelp', label: 'Yelp (optional)', type: 'text', half: true, showIf: (_a, ctx) => ctx.mods.reputation },
      { id: 'social_other', label: 'Other profiles (optional)', type: 'text', half: true, showIf: (_a, ctx) => ctx.mods.reputation },
      {
        id: 'tracking_ids', label: 'Ad or analytics accounts you already use (optional)', type: 'textarea', showIf: rebuilding,
        help: 'Google Analytics, Google Ads, Meta Pixel. IDs only. Never send us passwords.',
      },
    ],
  },
  {
    id: 'ads',
    title: 'Google Local Services Ads',
    intro: 'These are the "Google Screened" or "Google Guaranteed" ads at the very top of search results. You only pay when a customer contacts you. A few questions so we can set them up.',
    showIf: (_a, ctx) => ctx.mods.lsa,
    fields: [
      {
        id: 'lsa_has_account', label: 'Do you already have a Google Ads account?', type: 'radio', required: true, options: YES_NO_UNSURE,
        guide: FIND_ADS_ACCOUNT,
      },
      {
        id: 'lsa_customer_id', label: 'Your Google Ads customer ID', type: 'text', required: true, placeholder: '123-456-7890',
        showIf: is('lsa_has_account', 'yes'), guide: FIND_CUSTOMER_ID,
      },
      { id: 'lsa_owner_email', label: 'Which Google email do you sign in with?', type: 'email', required: true, showIf: is('lsa_has_account', 'yes') },
      {
        id: 'lsa_link_note', label: 'What happens next', type: 'note', showIf: is('lsa_has_account', 'yes'),
        body: `Kickbord will send a "link request" to your Google Ads account from ${KICKBORD_ACCESS_EMAIL}. Your CRM setup guide shows you exactly where to click Accept. You stay the owner and can remove us any time.`,
      },
      {
        id: 'lsa_google_email', label: 'Which Google or Gmail account should own your ads account?', type: 'email', required: true,
        showIf: is('lsa_has_account', 'no', 'not_sure'), defaultValue: (a) => a.gbp_owner_email || a.gbp_google_email || a.email || '',
        help: 'We will create the account and make this email the owner. Using the same account as your Business Profile is easiest.',
      },
      {
        id: 'lsa_budget', label: 'About how much would you like to spend on leads each month?', type: 'select', required: true,
        options: o(['lt500', 'Under $500'], ['500_1000', '$500 to $1,000'], ['1000_2500', '$1,000 to $2,500'], ['2500_plus', 'More than $2,500'], ['not_sure', 'Not sure, advise me']),
        help: 'Google bills this to your card directly. You can change it any time.',
      },
      {
        id: 'lsa_job_types', label: 'Which jobs do you want leads for?', type: 'tags', required: true,
        help: 'Google lets you turn job types on and off. Pick the ones you want more of.',
        defaultValue: (a) => (Array.isArray(a.services) ? a.services.slice(0, 6) : []),
      },
      { id: 'lsa_field_staff', label: 'How many people work in the field, including you?', type: 'select', required: true, half: true, options: o(['1', 'Just me'], ['2_5', '2 to 5'], ['6_10', '6 to 10'], ['11_plus', '11 or more']), help: 'Some trades require a background check for each field worker.' },
      { id: 'lsa_license', label: 'Contractor license (photo or PDF)', type: 'file', accept: '.pdf,.png,.jpg,.jpeg,.webp,.heic', maxFiles: 3, guide: LSA_DOCS },
      { id: 'lsa_insurance', label: 'Certificate of insurance (PDF)', type: 'file', accept: '.pdf,.png,.jpg,.jpeg,.webp', maxFiles: 3 },
    ],
  },
  {
    id: 'look',
    title: (a, ctx) => (demoKept(a, ctx) ? 'A few finishing touches' : 'Look and feel'),
    intro: (a, ctx) =>
      demoKept(a, ctx)
        ? 'Add anything that will make your site feel more like you.'
        : 'Help us make the site look like your business.',
    showIf: (a, ctx) => rebuilding(a, ctx) && askAnyLook(a, ctx),
    fields: [
      { id: 'logo', label: 'Logo', type: 'file', accept: '.png,.jpg,.jpeg,.webp,.svg,.pdf', maxFiles: 3, help: 'No logo? We will make a clean text version.' },
      { id: 'brand_colors', label: 'Brand colors (optional)', type: 'text', showIf: askFullLook, placeholder: 'Navy and orange, or hex codes' },
      { id: 'photos', label: 'Photos of your work, team, and vehicles', type: 'file', accept: '.png,.jpg,.jpeg,.webp,.heic', maxFiles: 20, help: 'Real photos convert better than stock.' },
      { id: 'headshot', label: 'Owner or team photo (optional)', type: 'file', accept: '.png,.jpg,.jpeg,.webp,.heic', maxFiles: 3, showIf: askFullLook },
      {
        id: 'stock_ok', label: 'If you do not have enough photos, is stock or AI-generated imagery okay?', type: 'radio', showIf: askFullLook,
        options: o(['yes', 'Yes'], ['no_people', 'Yes, but not for people'], ['no', 'No']),
      },
      {
        id: 'style_tone', label: 'What style fits you best?', type: 'radio', required: true, showIf: askFullLook,
        options: o(['modern', 'Clean and modern'], ['bold', 'Bold and high-energy'], ['classic', 'Classic and trusted'], ['friendly', 'Warm and friendly']),
      },
      { id: 'inspiration_urls', label: 'Websites you like (optional)', type: 'textarea', showIf: askFullLook, placeholder: 'Paste links, one per line' },
      {
        id: 'pages_wanted', label: 'Pages you want', type: 'checkboxes', required: true, showIf: askFullLook,
        defaultValue: () => ['home', 'services', 'about', 'reviews', 'contact'],
        options: o(['home', 'Home'], ['services', 'Services'], ['about', 'About'], ['gallery', 'Gallery'], ['reviews', 'Reviews'], ['faq', 'FAQ'], ['areas', 'Service areas'], ['financing', 'Financing'], ['blog', 'Blog'], ['contact', 'Contact']),
      },
      { id: 'story', label: 'Your story in a few sentences (optional)', type: 'textarea', showIf: askFullLook },
      {
        id: 'form_fields', label: 'What should your quote request form ask for?', type: 'checkboxes', required: true, showIf: askFullLook,
        defaultValue: () => ['name', 'phone', 'email', 'service_type', 'message'],
        options: o(['name', 'Name'], ['phone', 'Phone'], ['email', 'Email'], ['address', 'Address'], ['service_type', 'Service needed'], ['preferred_time', 'Preferred time'], ['photos', 'Photo upload'], ['message', 'Message']),
      },
      { id: 'offers', label: 'Specials or financing offers to feature (optional)', type: 'textarea' },
      { id: 'avoid', label: 'Anything we should avoid? (optional)', type: 'textarea' },
    ],
  },
  {
    id: 'voice',
    title: 'Your AI receptionist',
    intro: 'This sets up how calls and texts are answered, booked, and handed to you.',
    showIf: (_a, ctx) => ctx.mods.receptionist,
    fields: [
      { id: 'phone_current', label: 'Business phone number customers call today', type: 'tel', required: true, half: true },
      {
        id: 'carrier', label: 'Who provides that number?', type: 'select', required: true, half: true,
        options: o(['att', 'AT&T'], ['verizon', 'Verizon'], ['tmobile', 'T-Mobile'], ['google_voice', 'Google Voice'], ['voip', 'Other internet phone service'], ['landline', 'Landline'], ['other', 'Other'], ['not_sure', 'Not sure']),
      },
      {
        id: 'ai_role', label: 'How should the AI receptionist work with your phone line?', type: 'radio', required: true,
        options: [
          { value: 'fallback', label: 'Back me up (recommended)', hint: 'Your phone rings first. The AI answers the calls you miss.' },
          { value: 'main_line', label: 'Answer every call', hint: 'The AI picks up first and transfers to you when needed.' },
        ],
      },
      {
        id: 'ai_answer_mode', label: 'When should the AI pick up?', type: 'radio', required: true, showIf: is('ai_role', 'fallback'),
        options: o(['no_answer', 'When I do not answer'], ['after_hours', 'Only after hours'], ['after_hours_busy', 'After hours, and when I do not answer during the day']),
      },
      {
        id: 'new_number_ok', label: 'Is it okay to use a new local number for the AI and forward calls to it?', type: 'radio', required: true, options: YES_NO_UNSURE,
      },
      {
        id: 'transfer_number', label: 'If a caller needs a person, which number should we transfer to?', type: 'tel', required: true,
        defaultValue: (a) => a.mobile ?? '',
      },
      {
        id: 'transfer_when', label: 'When should the AI transfer a call?', type: 'checkboxes', required: true,
        options: o(['emergency', 'Emergencies'], ['asks_person', 'The caller asks for a person'], ['big_job', 'Large or complex jobs'], ['upset', 'The caller is upset'], ['never', 'Never, just take a message']),
      },
      {
        id: 'calendar', label: 'Which calendar should appointments go on?', type: 'select', required: true,
        options: o(['google', 'Google Calendar'], ['outlook', 'Outlook'], ['apple', 'Apple Calendar'], ['none', 'I do not use one, set one up for me'], ['other', 'Other']),
      },
      {
        id: 'appointment_types', label: 'Appointment types', type: 'rows', required: true,
        help: 'For example: free estimate, 60 minutes.',
        columns: [
          { id: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Free estimate' },
          { id: 'minutes', label: 'Length', type: 'select', required: true, options: o(['30', '30 min'], ['60', '1 hour'], ['90', '90 min'], ['120', '2 hours'], ['180', '3 hours'], ['240', 'Half day']) },
          { id: 'free', label: 'Free', type: 'checkbox' },
        ],
      },
      {
        id: 'pricing_mode', label: 'Should the AI talk about prices?', type: 'radio', required: true,
        options: o(['none', 'No, just book an estimate'], ['ranges', 'Yes, share price ranges I provide'], ['fees_only', 'Only share my service call or estimate fee']),
      },
      {
        id: 'price_list', label: 'Price ranges', type: 'rows', required: true, showIf: is('pricing_mode', 'ranges'),
        columns: [
          { id: 'service', label: 'Service', type: 'text', required: true },
          { id: 'low', label: 'From ($)', type: 'number', required: true },
          { id: 'high', label: 'To ($)', type: 'number' },
        ],
      },
      { id: 'price_file', label: 'Or upload a price list (optional)', type: 'file', accept: '.pdf,.csv,.xlsx,.xls,.png,.jpg,.jpeg', maxFiles: 1, showIf: is('pricing_mode', 'ranges') },
      { id: 'service_fee', label: 'Service call or diagnostic fee (optional)', type: 'text', showIf: is('pricing_mode', 'ranges', 'fees_only'), placeholder: '$89, applied to the repair' },
      {
        id: 'languages', label: 'Languages customers speak', type: 'checkboxes', required: true,
        defaultValue: () => ['english'],
        options: o(['english', 'English'], ['spanish', 'Spanish'], ['other', 'Other']),
      },
      { id: 'voice_style', label: 'Tone', type: 'radio', options: o(['warm', 'Warm and friendly'], ['professional', 'Professional'], ['upbeat', 'Upbeat']) },
      { id: 'assistant_name', label: 'Name for your assistant', type: 'text', defaultValue: () => 'Ava', half: true },
      { id: 'top_questions', label: 'Top questions customers ask (optional)', type: 'textarea', placeholder: 'One per line' },
      { id: 'never_say', label: 'Things the AI should never say or promise (optional)', type: 'textarea' },
      {
        id: 'safety_notes', label: 'Which situations are urgent?', type: 'textarea', required: true,
        help: 'We pre-filled a starting point for your trade. Edit it freely.',
        defaultValue: (a) => presetFor(a.trade)?.safety ?? '',
      },
      {
        id: 'notify_contacts', label: 'Who should get new-lead and booking alerts?', type: 'rows', required: true,
        defaultValue: (a) => [{ name: [a.first_name, a.last_name].filter(Boolean).join(' '), email: a.email ?? '', mobile: a.mobile ?? '', text_alerts: true, email_alerts: true }],
        columns: [
          { id: 'name', label: 'Name', type: 'text', required: true },
          { id: 'email', label: 'Email', type: 'email' },
          { id: 'mobile', label: 'Mobile', type: 'tel' },
          { id: 'text_alerts', label: 'Texts', type: 'checkbox' },
          { id: 'email_alerts', label: 'Emails', type: 'checkbox' },
        ],
      },
      {
        id: 'recording_ok', label: 'I understand the AI receptionist plays a short notice that calls may be recorded and transcribed.', type: 'checkbox', required: true,
      },
    ],
  },
  {
    id: 'reviews',
    title: 'Your review funnel',
    showIf: (_a, ctx) => ctx.mods.reputation,
    intro:
      'After each job, customers get a short message asking for a Google review. Every customer receives the same public review link, because Google does not allow filtering who gets asked based on how happy they are.',
    fields: [
      {
        id: 'job_done_how', label: 'How will we know a job is finished?', type: 'radio', required: true,
        options: o(['mark_done', 'I will mark it complete'], ['invoice', 'When an invoice is sent'], ['list', 'I will send a list of customers'], ['not_sure', 'Not sure, advise me']),
      },
      {
        id: 'review_delay', label: 'When should we ask for the review?', type: 'radio', required: true,
        defaultValue: () => 'next_day',
        options: o(['same_day', 'Same day'], ['next_day', 'Next day'], ['three_days', 'Three days later']),
      },
      {
        id: 'review_channel', label: 'How should we ask?', type: 'radio', required: true,
        defaultValue: () => 'text',
        options: o(['text', 'Text message'], ['email', 'Email'], ['both', 'Both']),
      },
      { id: 'review_reminder', label: 'Send one gentle reminder if they do not respond?', type: 'radio', required: true, options: YES_NO },
      {
        id: 'jobs_per_month', label: 'About how many jobs do you finish each month?', type: 'select', required: true, half: true,
        options: o(['lt10', 'Fewer than 10'], ['10_30', '10 to 30'], ['30_100', '30 to 100'], ['100_plus', 'More than 100']),
      },
      { id: 'review_sender_name', label: 'Name customers will see on the message', type: 'text', required: true, half: true, defaultValue: (a) => a.company_name ?? '' },
      {
        id: 'review_site', label: 'Where should reviews go?', type: 'radio', required: true, defaultValue: () => 'google',
        options: o(['google', 'Google (recommended)'], ['yelp', 'Yelp'], ['facebook', 'Facebook'], ['other', 'Other']),
      },
      {
        id: 'review_past_customers', label: 'Past customers to ask for reviews (optional)', type: 'file', accept: '.csv,.xlsx,.xls', maxFiles: 1,
        help: 'A spreadsheet with name, phone, and email.',
      },
      {
        id: 'past_customers_consent', label: 'I confirm I have the right to contact these customers by text or email.', type: 'checkbox', required: true,
        showIf: (_a, ctx) => ctx.files.some((f) => f.field_id === 'review_past_customers'),
      },
    ],
  },
  {
    id: 'signoff',
    title: 'Permissions and sign-off',
    intro: 'Last step. Almost done.',
    fields: [
      {
        id: 'extra_users', label: 'Anyone else who should have access to your account? (optional)', type: 'rows',
        columns: [
          { id: 'name', label: 'Name', type: 'text' },
          { id: 'email', label: 'Email', type: 'email' },
          { id: 'role', label: 'Role', type: 'text', placeholder: 'Office manager' },
        ],
      },
      { id: 'contact_pref', label: 'Best way to reach you', type: 'radio', required: true, half: true, options: o(['text', 'Text'], ['email', 'Email'], ['phone', 'Phone call']) },
      { id: 'contact_time', label: 'Best time to reach you (optional)', type: 'text', half: true },
      { id: 'notes', label: 'Anything else? (optional)', type: 'textarea' },
      {
        id: 'consent_a2p', type: 'consent', required: true,
        label: 'I authorize Kickbord to register my business with US mobile carriers for text messaging using the details above, and to send text messages to my customers on my behalf. I confirm the information I provided is accurate.',
      },
      {
        id: 'consent_terms', type: 'consent', required: true,
        label: 'I have read the Privacy Policy and agree to the Kickbord service terms.',
      },
      { id: 'signature_name', label: 'Type your full name to sign', type: 'text', required: true },
    ],
  },
]

// Every "Other" choice gets a required follow-up text field so the client can name it.
const OTHER_PROMPTS: Record<string, string> = {
  role: 'What is your role?',
  entity_type: 'How is your business set up?',
  payment_methods: 'Which other payment methods do you accept?',
  website_platform: 'What is your website built on?',
  domain_registrar: 'Where did you buy your domain?',
  carrier: 'Who provides your business phone number?',
  calendar: 'Which calendar do you use?',
  languages: 'Which other languages do your customers speak?',
  review_site: 'Which site should reviews go to?',
}

function withOtherFields(steps: Step[]): Step[] {
  return steps.map((step) => ({
    ...step,
    fields: step.fields.flatMap((f) => {
      const prompt = OTHER_PROMPTS[f.id]
      if (!prompt || !f.options?.some((o) => o.value === 'other')) return [f]
      const multi = f.type === 'checkboxes'
      const other: Field = {
        id: `${f.id}_other`,
        label: prompt,
        type: 'text',
        required: true,
        placeholder: 'Type it here',
        showIf: (a, ctx) =>
          (!f.showIf || f.showIf(a, ctx)) && (multi ? Array.isArray(a[f.id]) && a[f.id].includes('other') : a[f.id] === 'other'),
      }
      return [f, other]
    }),
  }))
}

export const STEPS: Step[] = withOtherFields(BASE_STEPS)

export function visibleSteps(a: Answers, ctx: Ctx) {
  return STEPS.filter((s) => !s.showIf || s.showIf(a, ctx))
}
export function visibleFields(step: Step, a: Answers, ctx: Ctx) {
  return step.fields.filter((f) => !f.showIf || f.showIf(a, ctx))
}

// ── validation ────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const isEmpty = (v: unknown) =>
  v === undefined || v === null || v === '' || v === false || (Array.isArray(v) && v.length === 0)

export function resolve<T>(v: T | ((a: Answers, ctx: Ctx) => T), a: Answers, ctx: Ctx): T {
  return typeof v === 'function' ? (v as (a: Answers, ctx: Ctx) => T)(a, ctx) : v
}

export function validateStep(step: Step, a: Answers, ctx: Ctx, ein: string): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const f of visibleFields(step, a, ctx)) {
    if (f.type === 'note' || f.type === 'demo') continue
    const required = !!resolve(f.required ?? false, a, ctx)
    const v = a[f.id]
    if (f.type === 'ein') {
      const digits = ein.replace(/\D/g, '')
      if (digits.length === 0) {
        if (required && !ctx.einOnFile) errors[f.id] = 'Enter your EIN, or choose "No" or "Not sure" above.'
      } else if (digits.length !== 9) errors[f.id] = 'An EIN has 9 digits.'
      continue
    }
    if (f.type === 'file') {
      if (required && !ctx.files.some((x) => x.field_id === f.id)) errors[f.id] = 'Please upload a file.'
      continue
    }
    if (f.type === 'hours') {
      const h = (v ?? {}) as Record<string, { closed: boolean; open: string; close: string }>
      const open = Object.values(h).filter((d) => d && !d.closed)
      if (required && open.length === 0) errors[f.id] = 'Choose at least one open day.'
      else if (open.some((d) => !d.open || !d.close || d.open >= d.close)) errors[f.id] = 'Each open day needs an opening time before its closing time.'
      continue
    }
    if (f.type === 'rows') {
      const rows = (Array.isArray(v) ? v : []).filter((r: Record<string, unknown>) =>
        (f.columns ?? []).some((c) => !isEmpty(r?.[c.id]) && c.type !== 'checkbox'),
      )
      if (required && rows.length === 0) {
        errors[f.id] = 'Add at least one row.'
      } else if (rows.some((r: Record<string, unknown>) => (f.columns ?? []).some((c) => c.required && isEmpty(r[c.id])))) {
        errors[f.id] = 'Fill in the required columns, or remove the empty row.'
      } else if (rows.some((r: Record<string, unknown>) => (f.columns ?? []).some((c) => c.type === 'email' && r[c.id] && !EMAIL_RE.test(String(r[c.id]))))) {
        errors[f.id] = 'Check the email addresses.'
      }
      continue
    }
    if (required && isEmpty(v)) {
      errors[f.id] = f.type === 'checkbox' || f.type === 'consent' ? 'Please check this box to continue.' : 'This is required.'
      continue
    }
    if (isEmpty(v)) continue
    if (f.type === 'email' && !EMAIL_RE.test(String(v).trim())) errors[f.id] = 'Enter a valid email address.'
    if (f.type === 'tel' && String(v).replace(/\D/g, '').length < 10) errors[f.id] = 'Enter a 10-digit phone number.'
    if (f.type === 'url' && !/^(https?:\/\/)?[^\s.]+\.[^\s]{2,}$/i.test(String(v).trim())) errors[f.id] = 'Enter a valid web address.'
    if (f.id === 'signature_name' && String(v).trim().split(/\s+/).length < 2) errors[f.id] = 'Please type your first and last name.'
  }
  return errors
}
