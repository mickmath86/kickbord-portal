import { OnboardingChecklist } from "@/components/onboarding-checklist"
import { AppShell } from "@/components/app-shell"
import { getViewedAccount } from "@/lib/account"
import { connection } from "next/server"

export const instant = false

export default async function Page() {
  await connection()
  const { account } = await getViewedAccount()

  return (
    <AppShell>
      <OnboardingChecklist locationId={account?.location_id} />
    </AppShell>
  )
}
