"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function completeSignup(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const confirm = formData.get("confirm_password") as string

  if (password.length < 8) {
    redirect("/signup?error=Password+must+be+at+least+8+characters")
  }
  if (password !== confirm) {
    redirect("/signup?error=Passwords+do+not+match")
  }

  const supabase = await createClient()

  const { data: signupData, error: signupError } =
    await supabase.auth.signUp({
      email,
      password,
    })
  if (signupError) {
    redirect(`/signup?error=${encodeURIComponent(signupError.message)}`)
  }

  // signUp() on an already-registered email returns a fake user with no
  // identities (anti-enumeration) — the password is NOT set in that case.
  if (signupData.user && signupData.user.identities?.length === 0) {
    redirect(
      "/login?error=" +
        encodeURIComponent(
          "An account already exists for this email — log in or reset your password."
        )
    )
  }

  // Sign in immediately (works when email confirmation is disabled,
  // or when the user was already confirmed via the invite flow)
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (loginError) {
    redirect(
      "/login?error=" +
        encodeURIComponent(
          "Account created — confirm your email, then log in here."
        )
    )
  }

  // Refresh the clients row with any edits made on the signup form
  await supabase
    .from("clients")
    .update({
      first_name: (formData.get("first_name") as string) || null,
      last_name: (formData.get("last_name") as string) || null,
      business_name: (formData.get("business_name") as string) || null,
      phone: (formData.get("phone") as string) || null,
      location_id: (formData.get("location_id") as string) || null,
    })
    .eq("email", email)

  redirect("/dashboard")
}
