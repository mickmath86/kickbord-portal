"use server"

import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { getCurrentAccount, setViewAsClient } from "@/lib/account"
import { createClient } from "@/lib/supabase/server"

const GHL_WEBHOOK_URL =
  "https://services.leadconnectorhq.com/hooks/FJeizTc6Xn4BiUesMgHQ/webhook-trigger/4d88b126-1f53-4648-88dd-d07b81f33e05"

type InvitePayload = {
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  business_name: string | null
  location_id: string | null
  role: string
}

async function sendInviteWebhook(client: InvitePayload) {
  const origin = (await headers()).get("origin")
  const signupParams = new URLSearchParams({
    email: client.email,
    first_name: client.first_name ?? "",
    last_name: client.last_name ?? "",
    business_name: client.business_name ?? "",
    phone: client.phone ?? "",
    location_id: client.location_id ?? "",
  })

  const res = await fetch(GHL_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...client,
      signup_url: `${origin}/signup?${signupParams.toString()}`,
    }),
  })

  return res.ok
}

export async function inviteClient(formData: FormData) {
  const account = await getCurrentAccount()
  if (account?.role !== "admin") redirect("/dashboard")

  const email = (formData.get("email") as string).trim().toLowerCase()
  const role = formData.get("role") === "admin" ? "admin" : "client"

  const supabase = await createClient()

  // Pre-create the client row; the handle_new_user trigger links it
  // to the auth user when they complete signup.
  const { error: insertError } = await supabase.from("clients").insert({
    email,
    business_name: (formData.get("business_name") as string) || null,
    first_name: (formData.get("first_name") as string) || null,
    last_name: (formData.get("last_name") as string) || null,
    phone: (formData.get("phone") as string) || null,
    location_id: (formData.get("location_id") as string) || null,
    role,
  })

  if (insertError) {
    redirect(`/admin?error=${encodeURIComponent(insertError.message)}`)
  }

  const sent = await sendInviteWebhook({
    email,
    first_name: (formData.get("first_name") as string) || null,
    last_name: (formData.get("last_name") as string) || null,
    phone: (formData.get("phone") as string) || null,
    business_name: (formData.get("business_name") as string) || null,
    location_id: (formData.get("location_id") as string) || null,
    role,
  })

  if (!sent) {
    redirect("/admin?error=Webhook+failed+to+send+invite+email")
  }

  redirect(`/admin?invited=${encodeURIComponent(email)}`)
}

export async function resendInvite(clientId: string) {
  const account = await getCurrentAccount()
  if (account?.role !== "admin") redirect("/dashboard")

  const supabase = await createClient()
  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single()

  if (error || !client) {
    redirect("/admin?error=Client+not+found")
  }

  const sent = await sendInviteWebhook(client)
  if (!sent) {
    redirect("/admin?error=Webhook+failed+to+send+invite+email")
  }

  redirect(`/admin?invited=${encodeURIComponent(client.email)}`)
}

export async function viewAsClient(clientId: string) {
  const account = await getCurrentAccount()
  if (account?.role !== "admin") redirect("/dashboard")

  await setViewAsClient(clientId)
  redirect("/dashboard")
}

export async function exitViewAs() {
  await setViewAsClient(null)
  redirect("/admin")
}
