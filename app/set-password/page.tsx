import { Suspense } from "react"
import { setPassword } from "./actions"
import { GalleryVerticalEndIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

function SetPasswordForm({ error }: { error?: string }) {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Create your password</CardTitle>
        <CardDescription>
          Set a password to finish setting up your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <p className="text-destructive mb-4 text-center text-sm">{error}</p>
        )}
        <form>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="password">New password</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={8}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm_password">
                Confirm password
              </FieldLabel>
              <Input
                id="confirm_password"
                name="confirm_password"
                type="password"
                minLength={8}
                required
              />
            </Field>
            <Field>
              <Button type="submit" formAction={setPassword}>
                Set password
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

async function SetPasswordFormWithError({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  return <SetPasswordForm error={error} />
}

export default function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GalleryVerticalEndIcon className="size-4" />
          </div>
          Kickbord
        </a>
        <Suspense fallback={<SetPasswordForm />}>
          <SetPasswordFormWithError searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  )
}
