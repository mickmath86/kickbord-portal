import { getViewedAccount } from "@/lib/account"
import { exitViewAs } from "@/app/admin/actions"
import { Button } from "@/components/ui/button"
import { EyeIcon } from "lucide-react"

export async function ViewAsBanner() {
  const { account, isViewingAs } = await getViewedAccount()
  if (!isViewingAs || !account) return null

  const name =
    account.business_name ||
    [account.first_name, account.last_name].filter(Boolean).join(" ") ||
    account.email

  return (
    <div className="bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200 flex items-center justify-center gap-3 px-4 py-2 text-sm">
      <EyeIcon className="size-4" />
      <span>
        You are viewing this app as <strong>{name}</strong>
      </span>
      <form action={exitViewAs}>
        <Button type="submit" variant="outline" size="sm" className="h-6">
          Exit view
        </Button>
      </form>
    </div>
  )
}
