import { Suspense } from "react"
import { connection } from "next/server"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { ViewAsBanner } from "@/components/view-as-banner"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getViewedAccount } from "@/lib/account"

export async function AppShell({ children }: { children: React.ReactNode }) {
  await connection()
  const { currentAccount, isViewingAs } = await getViewedAccount()
  const isAdmin = currentAccount?.role === "admin" && !isViewingAs

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" isAdmin={isAdmin} />
      <SidebarInset>
        <Suspense>
          <ViewAsBanner />
        </Suspense>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
