import { redirect, notFound } from "next/navigation"
import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentAccount } from "@/lib/account"
import { viewAsClient, resendInvite } from "@/app/admin/actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AppShell } from "@/components/app-shell"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"
import { answerSections, getOnboardingRecord } from "@/lib/onboarding/record"

export const instant = false

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value || "—"}</span>
    </div>
  )
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await connection()
  const account = await getCurrentAccount()
  if (account?.role !== "admin") redirect("/dashboard")

  const { id } = await params
  const supabase = await createClient()
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single()

  if (!client) notFound()
  const onboarding = await getOnboardingRecord(client.id)
  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Los_Angeles" }) : null

  const name =
    client.business_name ||
    [client.first_name, client.last_name].filter(Boolean).join(" ") ||
    client.email

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-2xl px-4 lg:px-6">
      <Link
        href="/dashboard"
        className="text-muted-foreground mb-4 inline-flex items-center gap-1 text-sm hover:underline"
      >
        <ArrowLeftIcon className="size-4" /> Back to clients
      </Link>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl">{name}</CardTitle>
              <CardDescription>{client.email}</CardDescription>
            </div>
            <Badge variant={client.role === "admin" ? "default" : "secondary"}>
              {client.role}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            <Row label="Business name" value={client.business_name} />
            <Row
              label="Name"
              value={[client.first_name, client.last_name]
                .filter(Boolean)
                .join(" ")}
            />
            <Row label="Email" value={client.email} />
            <Row label="Phone" value={client.phone} />
            <Row label="Location ID" value={client.location_id} />
            <Row
              label="Account activated"
              value={client.user_id ? "Yes" : "Pending invite"}
            />
            <Row
              label="Created"
              value={new Date(client.created_at).toLocaleDateString()}
            />
          </div>
          <Separator className="my-4" />
          <div className="flex gap-2">
            <form action={viewAsClient.bind(null, client.id)}>
              <Button type="submit" variant="outline" size="sm">
                View as this client
              </Button>
            </form>
            <form action={resendInvite.bind(null, client.id)}>
              <Button type="submit" variant="ghost" size="sm">
                Resend invite
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Onboarding answers</CardTitle>
              <CardDescription>
                {onboarding
                  ? `Started ${fmt(onboarding.created_at)} · last saved ${fmt(onboarding.updated_at)}`
                  : "This client has not started the onboarding questionnaire in the portal yet."}
              </CardDescription>
            </div>
            {onboarding && (
              <Badge variant={onboarding.status === "completed" ? "default" : "secondary"}>
                {onboarding.status === "completed"
                  ? "Completed"
                  : `In progress${onboarding.progress_step_number ? ` · step ${onboarding.progress_step_number} of ${onboarding.progress_step_count ?? "?"}` : ""}`}
              </Badge>
            )}
          </div>
        </CardHeader>
        {onboarding && (
          <CardContent>
            <Row label="Submitted" value={fmt(onboarding.completed_at)} />
            <Row label="CRM login created" value={onboarding.login_created_at ? `${onboarding.login_email ?? ""} · ${fmt(onboarding.login_created_at)}` : null} />
            <Row label="Account setup finished" value={fmt(onboarding.setup_completed_at)} />
            <Row label="EIN on file" value={onboarding.ein_last4 ? `ending in ${onboarding.ein_last4}` : null} />
            {answerSections(onboarding.answers ?? {}).map((section) => (
              <div key={section.id} className="mt-5">
                <Separator className="mb-3" />
                <p className="mb-1 text-sm font-semibold">{section.title}</p>
                {section.rows.map((r) => (
                  <div key={r.label} className="flex justify-between gap-6 py-1.5 text-sm">
                    <span className="text-muted-foreground shrink-0">{r.label}</span>
                    <span className="text-right font-medium whitespace-pre-line break-words">{r.value}</span>
                  </div>
                ))}
              </div>
            ))}
          </CardContent>
        )}
      </Card>
      </div>
    </AppShell>
  )
}
