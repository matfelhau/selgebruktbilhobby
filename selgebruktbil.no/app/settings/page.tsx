// src/app/settings/page.tsx
"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [settings, setSettings] = useState({
    email: "Laster...",
    template: "Laster...",
    accepted_template: `Laster...`,
    rejected_template: `Laster...`
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
        if (Array.isArray(data)) {
          // Format: [{ setting: "key", value: "value" }, ...]
          data.forEach((item: any) => {
            transformedSettings[item.setting] = item.value;
          });
        } else {
          // Direct object format
          Object.assign(transformedSettings, data);
        }
        
        // Set default templates if they don't exist
        if (!transformedSettings.accepted_template) {
          transformedSettings.accepted_template = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Tilbud akseptert</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #27ae60;">🎉 Tilbud akseptert!</h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Kunde: {CUSTOMER_NAME}</h3>
            <p><strong>E-post:</strong> {CUSTOMER_EMAIL}</p>
            <p><strong>Telefon:</strong> {CUSTOMER_PHONE}</p>
            <p><strong>Bil:</strong> {VEHICLE_MAKE} {VEHICLE_MODEL}</p>
            <p><strong>Reg.nr:</strong> {VEHICLE_REG}</p>
        </div>
        
        <p>En kunde har akseptert tilbudet ditt. Du kan nå ta kontakt for å gjennomføre handelen.</p>
        
        <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Neste steg:</strong> Ta kontakt med kunden for å avtale henting/levering.</p>
        </div>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">Dette er en automatisk e-post fra EasyDeals systemet.</p>
    </div>
</body>
</html>`;
        }
        
        if (!transformedSettings.rejected_template) {
          transformedSettings.rejected_template = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Tilbud avvist</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #e74c3c;">❌ Tilbud avvist</h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Kunde: {CUSTOMER_NAME}</h3>
            <p><strong>E-post:</strong> {CUSTOMER_EMAIL}</p>
            <p><strong>Telefon:</strong> {CUSTOMER_PHONE}</p>
            <p><strong>Bil:</strong> {VEHICLE_MAKE} {VEHICLE_MODEL}</p>
            <p><strong>Reg.nr:</strong> {VEHICLE_REG}</p>
        </div>
        
        <p>Dessverre har kunden avvist tilbudet ditt. Du kan vurdere å sende et nytt tilbud eller markere saken som ikke interessert.</p>
        
        <div style="background-color: #ffeaea; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Vurder:</strong> Send et justert tilbud eller marker som "Ikke interessert".</p>
        </div>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">Dette er en automatisk e-post fra EasyDeals systemet.</p>
    </div>
</body>
</html>`;
        }
        
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
            E-post *for kopi av utsendte tilbud og varsler
          </Label>
          <Input
            id="email"
            type="email"
            value={settings.email}
            onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
            className="w-full"
            placeholder="din@epost.no"
          />
          <p className="text-xs text-gray-500 mt-1">
            Denne e-posten vil motta kopier av alle tilbud og varsler om aksepterte/avviste tilbud
          </p>
        </div>

        {/* Email Templates Tabs */}
        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-4">
            E-postmaler
          </Label>
          
          <Tabs defaultValue="offer" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="offer">Tilbudsmal</TabsTrigger>
              <TabsTrigger value="accepted">Akseptert varsel</TabsTrigger>
              <TabsTrigger value="rejected">Avvist varsel</TabsTrigger>
            </TabsList>
            
            <TabsContent value="offer" className="space-y-4">
              <div>
                <Label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-2">
                  E-postmal for tilbud
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
            </TabsContent>
            
            <TabsContent value="accepted" className="space-y-4">
              <div>
                <Label htmlFor="accepted_template" className="block text-sm font-medium text-gray-700 mb-2">
                  Varsel når tilbud aksepteres
                </Label>
                <Textarea
                  id="accepted_template"
                  value={settings.accepted_template}
                  onChange={(e) => setSettings(prev => ({ ...prev, accepted_template: e.target.value }))}
                  className="w-full h-64 font-mono text-sm"
                  placeholder="HTML e-mail mal for aksepterte tilbud..."
                />
                <div className="text-xs text-gray-500 mt-1">
                  <p className="font-medium mb-1">Tilgjengelige placeholders:</p>
                  <div className="grid grid-cols-2 gap-1">
                    <span>• {"{CUSTOMER_NAME}"} - Kundens navn</span>
                    <span>• {"{CUSTOMER_EMAIL}"} - Kundens e-post</span>
                    <span>• {"{CUSTOMER_PHONE}"} - Kundens telefon</span>
                    <span>• {"{VEHICLE_MAKE}"} - Bilmerke</span>
                    <span>• {"{VEHICLE_MODEL}"} - Bilmodell</span>
                    <span>• {"{VEHICLE_REG}"} - Registreringsnummer</span>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="rejected" className="space-y-4">
              <div>
                <Label htmlFor="rejected_template" className="block text-sm font-medium text-gray-700 mb-2">
                  Varsel når tilbud avvises
                </Label>
                <Textarea
                  id="rejected_template"
                  value={settings.rejected_template}
                  onChange={(e) => setSettings(prev => ({ ...prev, rejected_template: e.target.value }))}
                  className="w-full h-64 font-mono text-sm"
                  placeholder="HTML e-mail mal for avviste tilbud..."
                />
                <div className="text-xs text-gray-500 mt-1">
                  <p className="font-medium mb-1">Tilgjengelige placeholders:</p>
                  <div className="grid grid-cols-2 gap-1">
                    <span>• {"{CUSTOMER_NAME}"} - Kundens navn</span>
                    <span>• {"{CUSTOMER_EMAIL}"} - Kundens e-post</span>
                    <span>• {"{CUSTOMER_PHONE}"} - Kundens telefon</span>
                    <span>• {"{VEHICLE_MAKE}"} - Bilmerke</span>
                    <span>• {"{VEHICLE_MODEL}"} - Bilmodell</span>
                    <span>• {"{VEHICLE_REG}"} - Registreringsnummer</span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
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