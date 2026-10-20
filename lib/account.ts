import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

export type AccountRole = "client" | "admin"

export type Client = {
  id: string
  user_id: string | null
  business_name: string | null
  first_name: string | null
  last_name: string | null
  phone: string | null
  email: string
  location_id: string | null
  role: AccountRole
}

const VIEW_AS_COOKIE = "view_as_client"

// The client row belonging to the currently authenticated user.
export async function getCurrentAccount(): Promise<Client | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", user.id)
    .single()

  return data
}

// The account whose view should be rendered. For admins, honors the
// "view as" cookie; for everyone else it's just their own account.
export async function getViewedAccount(): Promise<{
  account: Client | null
  isViewingAs: boolean
  currentAccount: Client | null
}> {
  const currentAccount = await getCurrentAccount()

  if (currentAccount?.role !== "admin") {
    return { account: currentAccount, isViewingAs: false, currentAccount }
  }

  const cookieStore = await cookies()
  const viewAsId = cookieStore.get(VIEW_AS_COOKIE)?.value
  if (!viewAsId) {
    return { account: currentAccount, isViewingAs: false, currentAccount }
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("id", viewAsId)
    .single()

  return { account: data, isViewingAs: !!data, currentAccount }
}

export async function setViewAsClient(clientId: string | null) {
  const cookieStore = await cookies()
  if (clientId) {
    cookieStore.set(VIEW_AS_COOKIE, clientId, { path: "/" })
  } else {
    cookieStore.delete(VIEW_AS_COOKIE)
  }
}
