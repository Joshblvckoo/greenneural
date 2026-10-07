import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

export function useUser(): { user: User | null; loading: boolean } {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let authEventReceived = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      authEventReceived = true;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    void supabase.auth.getUser().then(({ data, error }) => {
      if (!active || authEventReceived) return;
      if (error) {
        console.error("Unable to load the current user:", error);
      }
      setUser(error ? null : data.user);
      setLoading(false);
    }).catch((error: unknown) => {
      if (!active || authEventReceived) return;
      console.error("Unable to load the current user:", error);
      setUser(null);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
