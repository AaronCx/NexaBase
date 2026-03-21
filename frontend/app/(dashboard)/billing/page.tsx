import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/config";
import { DEMO_PROFILE } from "@/lib/demo/data";
import { BillingContent } from "@/components/billing/BillingContent";

export const metadata = { title: "Billing" };

export default async function BillingPage() {
  let token: string;
  let currentTier: "free" | "pro";
  let stripeCustomerId: string | null;

  if (isDemoMode) {
    token = "demo-token";
    currentTier = DEMO_PROFILE.tier;
    stripeCustomerId = DEMO_PROFILE.stripe_customer_id;
  } else {
    const { createServerClient } = await import("@/lib/supabase/server");
    const supabase = createServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) redirect("/login");
    token = session.access_token;

    const { data: profile } = await supabase
      .from("profiles")
      .select("tier, stripe_customer_id")
      .eq("id", session.user.id)
      .single() as { data: { tier: string; stripe_customer_id: string | null } | null };

    currentTier = (profile?.tier ?? "free") as "free" | "pro";
    stripeCustomerId = profile?.stripe_customer_id ?? null;
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription and payment details.
        </p>
      </div>
      <BillingContent
        token={token}
        currentTier={currentTier}
        stripeCustomerId={stripeCustomerId}
      />
    </div>
  );
}
