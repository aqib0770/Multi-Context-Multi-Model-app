import { LayoutWrapper } from "@/components/layout-wrapper"
import "./globals.css"

export const metadata = {
  title: "NotebookLM Clone",
  description: "AI-powered notebook with RAG capabilities",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  )
}