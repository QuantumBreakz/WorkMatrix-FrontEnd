import type React from "react"
import { AuthProvider } from "@/contexts/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

export const metadata = {
  title: "WorkMatrix - Employee Monitoring & Productivity Platform",
  description:
    "WorkMatrix helps you track time, monitor activity, and improve team performance with powerful analytics.",
  keywords: "employee monitoring, time tracking, productivity, remote work, team management",
  authors: [{ name: "WorkMatrix Team" }],
  openGraph: {
    title: "WorkMatrix - Employee Monitoring & Productivity Platform",
    description:
      "WorkMatrix helps you track time, monitor activity, and improve team performance with powerful analytics.",
    url: "https://workmatrix.vercel.app",
    siteName: "WorkMatrix",
    images: [
      {
        url: "https://workmatrix.vercel.app/og-image.jpg",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
