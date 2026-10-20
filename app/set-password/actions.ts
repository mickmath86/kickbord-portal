"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function setPassword(formData: FormData) {
  const password = formData.get("password") as string
  const confirm = formData.get("confirm_password") as string

  if (password.length < 8) {
    redirect("/set-password?error=Password+must+be+at+least+8+characters")
  }
  if (password !== confirm) {
    redirect("/set-password?error=Passwords+do+not+match")
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    redirect(`/set-password?error=${encodeURIComponent(error.message)}`)
  }

  redirect("/dashboard")
}
