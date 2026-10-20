import { ClientCards } from "@/components/client-cards"
import { OnboardingChecklist } from "@/components/onboarding-checklist"
import { AppShell } from "@/components/app-shell"
import { getViewedAccount } from "@/lib/account"
import { connection } from "next/server"
import { getOnboardingRecord, statusOf } from "@/lib/onboarding/record"

export const instant = false

export default async function Page() {
  await connection()
  const { account, isViewingAs, currentAccount } = await getViewedAccount()
  const isAdminView = currentAccount?.role === "admin" && !isViewingAs
  const onboarding = !isAdminView && account ? await getOnboardingRecord(account.id) : null

  return (
    <AppShell>
      {isAdminView ? (
        <ClientCards />
      ) : (
        <OnboardingChecklist
          locationId={account?.location_id}
          onboardingStatus={statusOf(onboarding)}
        />
      )}
    </AppShell>
  )
}
