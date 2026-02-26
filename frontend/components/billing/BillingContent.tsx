"use client";

import { useState } from "react";
import { Check, Loader2, ExternalLink } from "lucide-react";
import { billingApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/useToast";

interface Props {
  token: string;
  currentTier: "free" | "pro";
  stripeCustomerId: string | null;
}

const PRO_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export function BillingContent({ token, currentTier, stripeCustomerId }: Props) {
  const [upgrading, setUpgrading] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);

  async function handleUpgrade() {
    setUpgrading(true);
    try {
      const { checkout_url } = await billingApi.createCheckout(
        {
          price_id: PRO_PRICE_ID,
          success_url: `${APP_URL}/billing?success=true`,
          cancel_url: `${APP_URL}/billing?canceled=true`,
        },
        token
      );
      window.location.href = checkout_url;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to start checkout";
      toast({ variant: "destructive", title: "Checkout error", description: msg });
      setUpgrading(false);
    }
  }

  async function handleManage() {
    setOpeningPortal(true);
    try {
      const { portal_url } = await billingApi.createPortal(
        { return_url: `${APP_URL}/billing` },
        token
      );
      window.location.href = portal_url;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to open portal";
      toast({ variant: "destructive", title: "Portal error", description: msg });
      setOpeningPortal(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Current plan banner */}
      <Card className={currentTier === "pro" ? "border-blue-300 bg-blue-50/40" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Current Plan</CardTitle>
            <Badge variant={currentTier === "pro" ? "default" : "secondary"}>
              {currentTier === "pro" ? "Pro" : "Free"}
            </Badge>
          </div>
          <CardDescription>
            {currentTier === "pro"
              ? "You have access to all Pro features."
              : "You are on the Free plan. Upgrade for more messages."}
          </CardDescription>
        </CardHeader>
        {currentTier === "pro" && stripeCustomerId && (
          <CardFooter>
            <Button variant="outline" onClick={handleManage} disabled={openingPortal}>
              {openingPortal ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="mr-2 h-4 w-4" />
              )}
              Manage subscription
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Plans */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Free */}
        <Card className={currentTier === "free" ? "ring-2 ring-primary" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Free
              {currentTier === "free" && (
                <Badge variant="outline">Current plan</Badge>
              )}
            </CardTitle>
            <CardDescription>Perfect for trying NexaBase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">
              $0<span className="text-base font-normal text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-2 text-sm">
              {[
                "50 AI messages / month",
                "Conversation history",
                "Standard response speed",
                "Community support",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" disabled>
              {currentTier === "free" ? "Current plan" : "Downgrade"}
            </Button>
          </CardFooter>
        </Card>

        {/* Pro */}
        <Card className={currentTier === "pro" ? "ring-2 ring-blue-500 border-blue-300" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Pro
              {currentTier === "pro" ? (
                <Badge>Current plan</Badge>
              ) : (
                <Badge variant="secondary">Recommended</Badge>
              )}
            </CardTitle>
            <CardDescription>For power users and teams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">
              $19<span className="text-base font-normal text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-2 text-sm">
              {[
                "5,000 AI messages / month",
                "Conversation history",
                "Priority response speed",
                "Priority support",
                "Early access to new features",
                "Stripe customer portal",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            {currentTier === "pro" ? (
              <Button
                className="w-full"
                variant="outline"
                onClick={handleManage}
                disabled={openingPortal}
              >
                {openingPortal && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Manage subscription
              </Button>
            ) : (
              <Button className="w-full" onClick={handleUpgrade} disabled={upgrading}>
                {upgrading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Upgrade to Pro
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
