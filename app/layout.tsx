import { LayoutWrapper } from "@/components/layout-wrapper"
import { auth } from "@/auth"
import "./globals.css"

export const metadata = {
  title: "NotebookLM Clone",
  description: "AI-powered notebook with RAG capabilities",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  return (
    <html lang="en" className="dark">
      <body>
        <LayoutWrapper session={session}>{children}</LayoutWrapper>
      </body>
    </html>
  )
}