import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/config";
import { DashboardNav } from "@/components/DashboardNav";
import { DemoBanner } from "@/components/DemoBanner";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isDemoMode) {
    // In demo mode, render with a synthetic user — no Supabase needed
    const demoUser = {
      id: "demo-user-001",
      email: "demo@nexabase.app",
      user_metadata: { full_name: "Demo User" },
      created_at: "2025-12-01T00:00:00Z",
    };

    return (
      <div className="min-h-screen bg-background">
        <DemoBanner />
        <DashboardNav user={demoUser as any} />
        <main className="container mx-auto px-4 py-8 max-w-7xl">{children}</main>
      </div>
    );
  }

  const { isSupabaseConfigured, createServerClient } = await import(
    "@/lib/supabase/server"
  );

  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const supabase = createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav user={session.user} />
      <main className="container mx-auto px-4 py-8 max-w-7xl">{children}</main>
    </div>
  );
}
