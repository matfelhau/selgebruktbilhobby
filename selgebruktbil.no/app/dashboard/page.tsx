// src/app/dashboard/page.tsx

export const dynamic = 'force-dynamic'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import DashboardClient from "@/components/dashboardClient"

export default async function DashboardPage() {
  // Server‐side: get the session
  const session = await getServerSession(authOptions)
  if (!session) {
    // Not signed in → send to NextAuth signin page, then back here
    redirect("/api/auth/signin?callbackUrl=/dashboard")
  }

  // Authenticated → render the client component
  return <DashboardClient />
}
