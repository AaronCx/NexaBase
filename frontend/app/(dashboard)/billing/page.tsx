import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { BillingContent } from "@/components/billing/BillingContent";

export const metadata = { title: "Billing" };

export default async function BillingPage() {
  const supabase = createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier, stripe_customer_id")
    .eq("id", session.user.id)
    .single();

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription and payment details.
        </p>
      </div>
      <BillingContent
        token={session.access_token}
        currentTier={(profile?.tier ?? "free") as "free" | "pro"}
        stripeCustomerId={profile?.stripe_customer_id ?? null}
      />
    </div>
  );
}
