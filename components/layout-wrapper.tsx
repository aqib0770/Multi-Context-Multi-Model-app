"use client"

import { usePathname } from "next/navigation"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SessionProvider } from "next-auth/react"
import { Session } from "next-auth"

export function LayoutWrapper({ children, session }: { children: React.ReactNode, session: Session | null }) {
  const pathname = usePathname()
  const isLoginPage = pathname === "/login"

  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <SessionProvider session={session}>
      <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="h-svh overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="font-semibold text-lg">NotebookLM Clone</div>
        </header>
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </SidebarInset>
      </SidebarProvider>
    </SessionProvider>
  )
}
