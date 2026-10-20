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
      </div>
    </AppShell>
  )
}
