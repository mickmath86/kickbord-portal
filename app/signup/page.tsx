import { Suspense } from "react"
import { completeSignup } from "./actions"
import { GalleryVerticalEndIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type InviteFields = {
  email?: string
  first_name?: string
  last_name?: string
  business_name?: string
  phone?: string
  location_id?: string
  error?: string
}

function SignupForm({ fields }: { fields: InviteFields }) {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Welcome to Kickbord</CardTitle>
        <CardDescription>
          Create a password to finish setting up your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {fields.error && (
          <p className="text-destructive mb-4 text-center text-sm">
            {fields.error}
          </p>
        )}
        <form>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={fields.email}
                readOnly={!!fields.email}
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="first_name">First name</FieldLabel>
                <Input
                  id="first_name"
                  name="first_name"
                  defaultValue={fields.first_name}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="last_name">Last name</FieldLabel>
                <Input
                  id="last_name"
                  name="last_name"
                  defaultValue={fields.last_name}
                  required
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="business_name">Business name</FieldLabel>
              <Input
                id="business_name"
                name="business_name"
                defaultValue={fields.business_name}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="phone">Phone</FieldLabel>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={fields.phone}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="location_id">Location ID</FieldLabel>
                <Input
                  id="location_id"
                  name="location_id"
                  defaultValue={fields.location_id}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="password">Create password</FieldLabel>
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
              <Button type="submit" formAction={completeSignup}>
                Create account
              </Button>
              <FieldDescription className="text-center">
                Your details were set up by your account manager. You can
                update them here if needed.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

async function SignupFormWithParams({
  searchParams,
}: {
  searchParams: Promise<InviteFields>
}) {
  const fields = await searchParams
  return <SignupForm fields={fields} />
}

export default function SignupPage({
  searchParams,
}: {
  searchParams: Promise<InviteFields>
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GalleryVerticalEndIcon className="size-4" />
          </div>
          Kickbord
        </a>
        <Suspense fallback={<SignupForm fields={{}} />}>
          <SignupFormWithParams searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  )
}
