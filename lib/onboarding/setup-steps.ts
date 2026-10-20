// Steps on /onboarding/setup. Each step can be limited to certain services with `when`.
import type { Mods } from './services'

export type Instruction = {
  text: string
  details?: string[]
}

export type Task = string | { text: string; when: (m: Mods) => boolean }

export type SetupStep = {
  /** Stable id sent in the webhook. Do not rename. */
  id: string
  title: string
  duration: string
  description: string
  tasks: Task[]
  /** CRM screen for this step. */
  path?: string
  /** Outside link for steps done in another app (for example Google Ads). */
  externalUrl?: string
  externalLabel?: string
  /** One video per step for now. Can be swapped per service later. */
  videoUrl?: string
  instructionsTitle?: string
  instructions?: Instruction[]
  /** Show this step only for these services. Missing means always. */
  when?: (m: Mods) => boolean
}

export const googleWork = (m: Mods) => m.reputation || m.lsa

export const SETUP_STEPS: SetupStep[] = [
  {
    id: 'business_details',
    title: 'Confirm business details',
    duration: '5 min',
    description:
      'Open your company settings and confirm the details your CRM will use for messaging, reporting, notifications, and customer records.',
    tasks: [
      'Confirm your official business name and primary contact information.',
      'Review your address, time zone, and business hours.',
      'Save the company settings before moving to the next step.',
    ],
    path: '/settings/company',
    videoUrl: 'https://www.youtube.com/embed/MbG0tItwJhs',
    instructionsTitle: 'Update your business details',
    instructions: [
      {
        text: 'Open Settings. Click the Settings gear icon at the bottom of the left-hand menu.',
      },
      {
        text: 'Go to Business Profile. It’s usually the first option.',
      },
      {
        text: 'Upload your logo. Drag your logo into the upload box, or click to browse. A size of 350 × 180 pixels works best.',
      },
      {
        text: 'Update your business info. Check your:',
        details: ['Business name', 'Phone number', 'Website', 'Address (country, state, city, zip code)'],
      },
      {
        text: 'Add your EIN, if you have one. Scroll down to Business Information, choose EIN as the registration type, and enter your number in the Business Registration Number field.',
        details: [
          'Why it matters: your EIN confirms your business for texting and calling features (A2P registration). Without it, your messages may be blocked or limited.',
          'Can’t find it? It’s on your IRS confirmation letter (CP 575) or on past tax returns.',
        ],
      },
      {
        text: 'Click Save. Use the blue Save button at the bottom right. Changes aren’t kept until you save.',
      },
    ],
  },
  {
    id: 'integrations',
    title: 'Integrate your third-party tools',
    duration: '6 min',
    description:
      'Connect the external accounts Kickbord needs for bookings, messaging, reviews, and business visibility.',
    tasks: [
      { text: 'Connect the calendar your team uses for appointments.', when: (m) => m.receptionist },
      { text: 'Connect the Google account that manages business access.', when: googleWork },
      { text: 'Link your Google Business Profile and confirm the correct location.', when: googleWork },
    ],
    when: (m) => m.receptionist || googleWork(m),
    path: '/settings/lc-integrations',
    videoUrl: 'https://www.youtube.com/embed/zwon4lQtUso',
  },
  {
    id: 'phone_system',
    title: 'Connect your phone system',
    duration: '7 min',
    description:
      'Set up the phone number and routing rules that will handle calls, texts, voicemail, and AI reception.',
    tasks: [
      'Choose or add the phone number connected to your CRM.',
      'Configure call forwarding, ringing, and voicemail behavior.',
      'Place a test call and confirm the number is working correctly.',
    ],
    path: '/settings/phone_system?tab=manage',
    videoUrl: 'https://www.youtube.com/embed/JJ-PBcGx9iw',
    when: (m) => m.receptionist,
  },
  {
    id: 'gbp_verify',
    title: 'Verify your Google Business Profile',
    duration: '5 min',
    description:
      'Only needed if your profile is new or Google asks you to verify it. Google usually asks for a short video, recorded on your phone.',
    tasks: [
      'Record one continuous video, at least 30 seconds long.',
      'Show your service area, your work truck or tools, and proof the business is yours.',
      'Upload it from the verification screen in your Business Profile.',
    ],
    externalUrl: 'https://business.google.com/locations',
    externalLabel: 'Open your Business Profiles',
    instructionsTitle: 'How to record your verification video',
    instructions: [
      { text: 'Open your Business Profiles (link above) and sign in with the Google account that owns your profile.' },
      { text: 'Click "Get verified" (or "Verify") on your business. If you do not see it, your profile is already verified and you can skip this step.' },
      { text: 'Choose "Video" if Google offers it. Then record one continuous video on your phone, at least 30 seconds long. Do not stop and start again.' },
      {
        text: 'In the video, show:',
        details: [
          'Where you work: a street sign or landmark in the area you serve.',
          'That the business is yours: your work truck with your logo, or your branded tools and equipment.',
          'Proof you run it: open your license, a permit, or an invoice with your business name on it.',
        ],
      },
      { text: 'Upload the video when Google asks. Review usually takes a few days. Google will email you when it is done.' },
      { text: 'Stuck? Book a setup session below and we will do it with you.' },
    ],
    when: googleWork,
  },
  {
    id: 'google_ads',
    title: 'Accept Kickbord in Google Ads',
    duration: '5 min',
    description:
      'This lets Kickbord run your Local Services Ads. You stay the owner and pay Google directly. You can remove access any time.',
    tasks: [
      'Accept the link request Kickbord sent to your Google Ads account.',
      'Link your Google Business Profile to Google Ads so customers can book from your ads.',
    ],
    externalUrl: 'https://ads.google.com/',
    externalLabel: 'Open Google Ads',
    instructionsTitle: 'Where to click in Google Ads',
    instructions: [
      { text: 'Open Google Ads (link above) and sign in with the Google account you gave us in onboarding.' },
      {
        text: 'Accept the link request:',
        details: [
          'Click "Admin" (the gear icon) in the left menu.',
          'Click "Access and security".',
          'Click the "Managers" tab.',
          'Find the request from Kickbord and click "Accept".',
          'No request yet? We may not have sent it. We will text you when it is ready.',
        ],
      },
      {
        text: 'Link your Business Profile:',
        details: [
          'Click "Tools" in the left menu, then "Data manager".',
          'Find "Google Business Profile" and click "Manage & link".',
          'Pick your business and confirm the location is right, then click "Link".',
        ],
      },
      { text: 'That is it. We handle the rest, including ad setup and booking from your ads.' },
    ],
    when: (m) => m.lsa,
  },
]

export function stepsFor(mods: Mods) {
  return SETUP_STEPS.filter((step) => !step.when || step.when(mods)).map((step) => ({
    ...step,
    tasks: step.tasks.flatMap((t) => (typeof t === 'string' ? [t] : t.when(mods) ? [t.text] : [])),
  }))
}
