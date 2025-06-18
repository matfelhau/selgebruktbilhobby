// src/app/settings/page.tsx
"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const { data: session, status } = useSession();

  // Client-side redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      signIn("credentials", { callbackUrl: "/settings" });
    }
  }, [status]);

  if (status === "loading") {
    return <div className="p-6">Laster innstillinger…</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Innstillinger</h1>
      <form className="space-y-6">
        {/* Placeholder for future settings */}
        <div>
          <Label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
            Visningsnavn
          </Label>
          <Input
            id="displayName"
            defaultValue={session?.user?.name || ""}
            className="mt-1 block w-full"
            placeholder="Ditt navn"
          />
        </div>

        <div>
          <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
            E-postadresse
          </Label>
          <Input
            id="email"
            type="email"
            defaultValue={session?.user?.email || ""}
            className="mt-1 block w-full"
            placeholder="din@epost.no"
          />
        </div>

        {/* Future settings sections go here */}

        <div className="flex items-center justify-between">
          <Button type="submit">Lagre endringer</Button>
        </div>
      </form>
    </div>
  );
}
