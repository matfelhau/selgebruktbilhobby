// src/app/settings/page.tsx
"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [settings, setSettings] = useState({
    email: "Laster...",
    template: `Laster...`
  });
  const [saving, setSaving] = useState(false);

  // Client-side redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      signIn("credentials", { callbackUrl: "/settings" });
    }
  }, [status]);

  // Load existing settings
  useEffect(() => {
    if (status === "authenticated") {
      loadSettings();
    }
  }, [status]);

  const loadSettings = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_WP_URL}/wp-json/easydeals/v1/settings`, {
        headers: { Authorization: `Bearer ${(session as any).wpToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Transform the WordPress settings format to our state format
        const transformedSettings: any = {};
        data.forEach((item: any) => {
          transformedSettings[item.setting] = item.value;
        });
        setSettings(prev => ({ ...prev, ...transformedSettings }));
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_WP_URL}/wp-json/easydeals/v1/settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).wpToken}`,
        },
        body: JSON.stringify(settings),
      });
      
      if (res.ok) {
        // Show success message
        toast.success("Innstillinger lagret!", {
          description: "Dine innstillinger ble lagret uten problemer.",
        });
      } else {
        console.error("Failed to save settings", await res.text());
        toast.error("Feil ved lagring av innstillinger", {
          description: "Det oppstod en feil under lagring. Prøv igjen.",
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Feil ved lagring av innstillinger", {
        description: "Det oppstod en uventet feil. Prøv igjen senere.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") {
    return <div className="p-6">Laster innstillinger…</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Innstillinger</h1>

      <form onSubmit={saveSettings} className="space-y-6">
        
        {/* E-mail Section */}
        <div>
          <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            E-mail
          </Label>
          <Input
            id="email"
            type="email"
            value={settings.email}
            onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
            className="w-full"
            placeholder="din@epost.no"
          />
        </div>

        {/* Email Template Section */}
        <div>
          <Label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-2">
            E-mail mal
          </Label>
          <Textarea
            id="template"
            value={settings.template}
            onChange={(e) => setSettings(prev => ({ ...prev, template: e.target.value }))}
            className="w-full h-64 font-mono text-sm"
            placeholder="HTML e-mail mal..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Bruk {"{PRICE}"} som placeholder for tilbudsprisen
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end pt-4 border-t">
          <Button 
            type="submit" 
            disabled={saving}
            className="cursor-pointer"
          >
            {saving ? "Lagrer..." : "Lagre"}
          </Button>
        </div>
      </form>
      
      <Toaster />
    </div>
  );
}