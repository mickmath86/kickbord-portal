import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2Icon } from "lucide-react"

export async function ClientCards() {
  const supabase = await createClient()
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false })

  if (!clients?.length) {
    return (
      <div className="px-4 lg:px-6">
        <p className="text-muted-foreground text-sm">
          No clients yet. Add one from the Admin page.
        </p>
      </div>
    )
  }

  return (
    <div className="px-4 lg:px-6">
      <h2 className="mb-4 text-2xl font-semibold tracking-tight">Clients</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {clients.map((client) => {
          const name =
            client.business_name ||
            [client.first_name, client.last_name].filter(Boolean).join(" ") ||
            client.email
          return (
            <Link key={client.id} href={`/admin/clients/${client.id}`}>
              <Card className="transition-colors hover:border-primary/50 h-full">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="bg-muted flex size-9 items-center justify-center rounded-md">
                        <Building2Icon className="text-muted-foreground size-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{name}</CardTitle>
                        <CardDescription>{client.email}</CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant={
                        client.role === "admin" ? "default" : "secondary"
                      }
                    >
                      {client.role}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
