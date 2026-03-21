import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/config";
import { DEMO_PROFILE } from "@/lib/demo/data";
import { SettingsContent } from "@/components/settings/SettingsContent";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  if (isDemoMode) {
    return (
      <div className="max-w-2xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and preferences.
          </p>
        </div>
        <SettingsContent
          user={{
            email: DEMO_PROFILE.email,
            fullName: DEMO_PROFILE.full_name ?? "",
            tier: DEMO_PROFILE.tier,
            createdAt: DEMO_PROFILE.created_at,
          }}
        />
      </div>
    );
  }

  const { isSupabaseConfigured, createServerClient } = await import(
    "@/lib/supabase/server"
  );

  if (!isSupabaseConfigured()) redirect("/login");

  const supabase = createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const { data: profile } = (await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single()) as {
    data: {
      full_name: string | null;
      email: string;
      tier: string;
      created_at: string;
    } | null;
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and preferences.
        </p>
      </div>
      <SettingsContent
        user={{
          email: session.user.email ?? "",
          fullName: profile?.full_name ?? "",
          tier: (profile?.tier ?? "free") as "free" | "pro",
          createdAt: profile?.created_at ?? session.user.created_at,
        }}
      />
    </div>
  );
}
