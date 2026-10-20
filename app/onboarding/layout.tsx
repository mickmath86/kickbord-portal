import { Instrument_Serif } from 'next/font/google'

// Same display font as kickbord.com/onboarding, used by the `font-display` headings.
const display = Instrument_Serif({ subsets: ['latin'], weight: '400', variable: '--font-instrument' })

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${display.variable} flex min-h-full flex-1 flex-col`}>{children}</div>
}
