// src/app/page.tsx
import Link from "next/link"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default async function Home() {
  // Sjekk om bruker allerede er logget inn
  const session = await getServerSession(authOptions)
  if (session) {
    // Hvis logget inn, send videre til dashboard
    redirect('/dashboard')
  }

  // Uten autentisering: vis en enkel landingsside med login-knapp
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <Image
        src="/gretland-logo-2025-white.png"
        alt="Gretland bil Logo"
        width={500}
        height={250}
        className="mb-6 bg-black"
      />
      <h1 className="text-4xl font-bold mb-4">Selge-bruktbil Dashboard</h1>
      <p className="mb-6 text-gray-600">Logg inn for å administrere henvendelser</p>
      <Button asChild>
        <Link href="/api/auth/signin?callbackUrl=/dashboard">Logg inn</Link>
      </Button>
    </div>
  )
}