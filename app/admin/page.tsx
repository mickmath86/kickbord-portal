import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCurrentAccount } from "@/lib/account"
import { viewAsClient, resendInvite } from "./actions"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AddClientDialog } from "@/components/add-client-dialog"
import { AppShell } from "@/components/app-shell"
import { connection } from "next/server"

export const instant = false

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ invited?: string; error?: string }>
}) {
  await connection()
  const account = await getCurrentAccount()
  if (account?.role !== "admin") redirect("/dashboard")

  const { invited, error } = await searchParams

  const supabase = await createClient()
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <AppShell>
      <div className="px-4 lg:px-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Client Accounts</CardTitle>
              <CardDescription>
                Select a client to view the app as they would see it.
              </CardDescription>
            </div>
            <AddClientDialog />
          </div>
        </CardHeader>
        {invited && (
          <p className="px-6 pb-2 text-sm text-green-600">
            Invite email sent to {invited}.
          </p>
        )}
        {error && (
          <p className="text-destructive px-6 pb-2 text-sm">{error}</p>
        )}
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Location ID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients?.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>{client.business_name ?? "—"}</TableCell>
                  <TableCell>
                    {[client.first_name, client.last_name]
                      .filter(Boolean)
                      .join(" ") || "—"}
                  </TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{client.location_id ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{client.role}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <form action={resendInvite.bind(null, client.id)}>
                        <Button type="submit" variant="ghost" size="sm">
                          Resend invite
                        </Button>
                      </form>
                      <form action={viewAsClient.bind(null, client.id)}>
                        <Button type="submit" variant="outline" size="sm">
                          View as
                        </Button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </div>
    </AppShell>
  )
}
