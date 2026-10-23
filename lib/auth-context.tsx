"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { UserProfile } from "@/lib/types";

interface AuthContextValue {
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type ProfileResult = { ok: true; profile: UserProfile | null } | { ok: false };

// Looks up the profile row for an email. `ok: false` means the request itself failed
// (e.g. no network right after the app resumes), which is not the same as "no profile".
async function fetchProfile(email: string): Promise<ProfileResult> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabase.from("user_extra").select("*").ilike("email", email).maybeSingle();
    if (!error) return { ok: true, profile: (data as UserProfile | null) ?? null };
    await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
  }
  return { ok: false };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Bumped on every auth change, so a slow profile lookup can't overwrite a newer one.
  const syncId = useRef(0);
  const profileEmail = useRef<string | null>(null);

  // Session and profile are published together, so the UI never sees a session
  // without its profile (which used to flash the "no profile found" screen).
  const applySession = useCallback(async (next: Session | null) => {
    const id = ++syncId.current;
    const email = next?.user?.email ?? null;

    if (!email) {
      profileEmail.current = null;
      setSession(null);
      setProfile(null);
      setIsLoading(false);
      return;
    }

    // Same user (token refresh, tab resume): just swap the session, keep the profile.
    if (profileEmail.current?.toLowerCase() === email.toLowerCase()) {
      setSession(next);
      return;
    }

    setIsLoading(true);
    const result = await fetchProfile(email);
    if (id !== syncId.current) return;

    if (result.ok) {
      profileEmail.current = result.profile ? email : null;
      setProfile(result.profile);
    }
    setSession(next);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // INITIAL_SESSION covers the stored session on startup, so no separate getSession().
    // The callback must not await Supabase calls directly (it can deadlock the auth
    // client), hence the setTimeout.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setTimeout(() => applySession(next), 0);
    });
    return () => subscription.unsubscribe();
  }, [applySession]);

  const refreshProfile = useCallback(async () => {
    const email = session?.user?.email;
    if (!email) return;
    const result = await fetchProfile(email);
    if (result.ok) {
      profileEmail.current = result.profile ? email : null;
      setProfile(result.profile);
    }
  }, [session]);

  return (
    <AuthContext.Provider value={{ session, profile, isLoading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
