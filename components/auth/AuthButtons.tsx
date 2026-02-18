"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const providers = [
  { id: "google", label: "Continue with Google" },
  { id: "facebook", label: "Continue with Facebook" },
  { id: "apple", label: "Continue with Apple" }
] as const;

export default function AuthButtons() {
  const [error, setError] = useState<string>("");

  async function signInWith(provider: "google" | "facebook" | "apple") {
    setError("");
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/`
      }
    });

    if (authError) {
      setError(authError.message);
    }
  }

  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Supabase Auth</p>
      <div className="mt-3 flex flex-col gap-2">
        {providers.map((provider) => (
          <button
            key={provider.id}
            onClick={() => signInWith(provider.id)}
            className="rounded-lg bg-slate-100 px-4 py-2 text-left text-sm font-semibold text-slate-900"
          >
            {provider.label}
          </button>
        ))}
      </div>
      {error ? <p className="mt-2 text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
