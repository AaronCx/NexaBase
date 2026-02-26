"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bot, LayoutDashboard, MessageSquare, CreditCard, LogOut } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "AI Chat", icon: MessageSquare },
  { href: "/billing", label: "Billing", icon: CreditCard },
];

export function DashboardNav({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
            <Bot className="h-5 w-5 text-primary" />
            NexaBase
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === href || pathname.startsWith(href + "/")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>

          {/* User actions */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block truncate max-w-[180px]">
              {user.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Log out</span>
            </Button>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="flex md:hidden items-center gap-1 pb-2 overflow-x-auto">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors",
                pathname === href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
