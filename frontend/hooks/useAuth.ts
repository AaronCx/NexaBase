"use client";

import { useEffect, useState } from "react";
import { isDemoMode } from "@/lib/config";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  token: string | null;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    token: null,
  });

  useEffect(() => {
    if (isDemoMode) {
      // In demo mode, return a synthetic user immediately
      const demoUser = {
        id: "demo-user-001",
        email: "demo@nexabase.app",
        user_metadata: { full_name: "Demo User" },
        created_at: "2025-12-01T00:00:00Z",
      } as unknown as User;

      setState({
        user: demoUser,
        session: { access_token: "demo-token" } as unknown as Session,
        loading: false,
        token: "demo-token",
      });
      return;
    }

    // Real Supabase auth
    import("@/lib/supabase/client").then(({ createClient }) => {
      const supabase = createClient();

      supabase.auth.getSession().then(({ data: { session } }) => {
        setState({
          user: session?.user ?? null,
          session,
          loading: false,
          token: session?.access_token ?? null,
        });
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setState({
          user: session?.user ?? null,
          session,
          loading: false,
          token: session?.access_token ?? null,
        });
      });

      return () => subscription.unsubscribe();
    });
  }, []);

  return state;
}
