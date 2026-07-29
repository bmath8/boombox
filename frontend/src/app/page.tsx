"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/env";
import { LandingPage } from "@/components/landing/landing-page";
import { Music2 } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

import { useRouter } from "next/navigation";

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // If Supabase is not configured, just show landing page
    if (!isSupabaseConfigured() || !supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session) {
        router.push('/radio');
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        router.push('/radio');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="relative">
          <div className="vinyl-circle w-24 h-24 animate-[vinyl-spin_2s_linear_infinite]">
            <div className="absolute inset-0 flex items-center justify-center">
              <Music2 className="w-12 h-12 text-primary" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (session) {
    return null; // Redirecting...
  }

  return <LandingPage />;
}
