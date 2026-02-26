"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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

  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
        token: session?.access_token ?? null,
      });
    });

    // Listen for auth changes
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
  }, []);

  return state;
}
