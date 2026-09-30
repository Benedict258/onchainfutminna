import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { apiGetSettings, apiUpsertSettings } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

const SETTING_KEYS = [
  "club_name",
  "club_description",
  "contact_email",
  "twitter_url",
  "discord_url",
  "telegram_url",
  "github_url",
  "instagram_url",
  "linkedin_url",
  "youtube_url",
  "maintenance_mode",
];

interface SettingsForm {
  [key: string]: string;
}

const defaultForm: SettingsForm = {
  club_name: "",
  club_description: "",
  contact_email: "",
  twitter_url: "",
  discord_url: "",
  telegram_url: "",
  github_url: "",
  instagram_url: "",
  linkedin_url: "",
  youtube_url: "",
  maintenance_mode: "false",
};

function AdminSettings() {
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SettingsForm>(defaultForm);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => apiGetSettings(),
    enabled: !!accessToken,
  });

  useEffect(() => {
    if (settings && Array.isArray(settings)) {
      const formMap: SettingsForm = { ...defaultForm };
      settings.forEach((s: { key: string; value: string }) => {
        if (SETTING_KEYS.includes(s.key)) {
          formMap[s.key] = s.value;
        }
      });
      setForm(formMap);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: () =>
      apiUpsertSettings(
        Object.entries(form)
          .filter(([key]) => SETTING_KEYS.includes(key))
          .map(([key, value]) => ({ key, value })),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      toast.success("Settings saved");
    },
    onError: () => toast.error("Failed to save settings"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-headline-lg">Settings</h1>
          <p className="text-muted-foreground">Configure your club settings</p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-lg">Settings</h1>
          <p className="text-muted-foreground">Configure your club settings</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Save className="mr-2 h-4 w-4" />
          {saveMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Basic club information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Club Name</Label>
            <Input
              value={form.club_name}
              onChange={(e) => setForm({ ...form, club_name: e.target.value })}
              placeholder="Blockchain Club FUTMinna"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Input
              value={form.club_description}
              onChange={(e) => setForm({ ...form, club_description: e.target.value })}
              placeholder="Building the future of blockchain at FUTMinna"
            />
          </div>
          <div>
            <Label>Contact Email</Label>
            <Input
              type="email"
              value={form.contact_email}
              onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              placeholder="contact@blockchainclub.futminna.edu.ng"
            />
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle>Social Links</CardTitle>
          <CardDescription>Your club's social media profiles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Twitter / X</Label>
              <Input
                value={form.twitter_url}
                onChange={(e) => setForm({ ...form, twitter_url: e.target.value })}
                placeholder="https://x.com/..."
              />
            </div>
            <div>
              <Label>Discord</Label>
              <Input
                value={form.discord_url}
                onChange={(e) => setForm({ ...form, discord_url: e.target.value })}
                placeholder="https://discord.gg/..."
              />
            </div>
            <div>
              <Label>Telegram</Label>
              <Input
                value={form.telegram_url}
                onChange={(e) => setForm({ ...form, telegram_url: e.target.value })}
                placeholder="https://t.me/..."
              />
            </div>
            <div>
              <Label>GitHub</Label>
              <Input
                value={form.github_url}
                onChange={(e) => setForm({ ...form, github_url: e.target.value })}
                placeholder="https://github.com/..."
              />
            </div>
            <div>
              <Label>Instagram</Label>
              <Input
                value={form.instagram_url}
                onChange={(e) => setForm({ ...form, instagram_url: e.target.value })}
                placeholder="https://instagram.com/..."
              />
            </div>
            <div>
              <Label>LinkedIn</Label>
              <Input
                value={form.linkedin_url}
                onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/..."
              />
            </div>
            <div>
              <Label>YouTube</Label>
              <Input
                value={form.youtube_url}
                onChange={(e) => setForm({ ...form, youtube_url: e.target.value })}
                placeholder="https://youtube.com/..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance</CardTitle>
          <CardDescription>Control site availability</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Maintenance Mode</p>
              <p className="text-sm text-muted-foreground">
                When enabled, the site will show a maintenance page to non-admin users
              </p>
            </div>
            <Switch
              checked={form.maintenance_mode === "true"}
              onCheckedChange={(v) => setForm({ ...form, maintenance_mode: v.toString() })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save button (bottom) */}
      <div className="flex justify-end">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Save className="mr-2 h-4 w-4" />
          {saveMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
