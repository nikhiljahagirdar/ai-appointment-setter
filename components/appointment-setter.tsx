"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { plans, type PlanTier } from "@/lib/plans";

type AppointmentSlot = {
  id: string;
  starts_at: string;
  provider_name: string;
  is_available: boolean;
};

export function AppointmentSetter() {
  const [plan, setPlan] = useState<PlanTier>("pro");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null);
  const [voiceStatus, setVoiceStatus] = useState("Idle");

  const planDetails = useMemo(() => plans[plan], [plan]);

  async function searchAvailability() {
    setLoading(true);
    setError(null);
    setSelectedSlot(null);

    try {
      const response = await fetch(`/api/voice-booking?date=${encodeURIComponent(date)}&plan=${plan}`);
      const data = (await response.json()) as { slots?: AppointmentSlot[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to search appointments.");
      }

      setSlots(data.slots ?? []);
      if ((data.slots ?? []).length === 0) {
        setError("No appointment slots found for that date.");
      }
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Unknown error.");
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleVoiceBook(slot: AppointmentSlot) {
    if (!planDetails.aiVoiceEnabled) return;

    setVoiceStatus("Listening for your confirmation...");

    const response = await fetch("/api/voice-booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan,
        slotId: slot.id,
        transcript: "Book this appointment for me please.",
      }),
    });

    const data = (await response.json()) as { confirmation?: string; error?: string };

    if (!response.ok) {
      setVoiceStatus(data.error ?? "Voice booking failed.");
      return;
    }

    setSelectedSlot(slot);
    setVoiceStatus(data.confirmation ?? "Appointment booked successfully.");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-10">
      <motion.header
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur"
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Next.js 16 + Supabase + Tailwind 4</p>
        <h1 className="text-3xl font-semibold md:text-4xl">AI Voice Appointment Setter</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-200/90 md:text-base">
          Search your Supabase appointment database for availability, announce open slots to the user,
          and (if your plan includes AI voice) allow spoken booking confirmations.
        </p>
      </motion.header>

      <section className="grid gap-6 md:grid-cols-2">
        {Object.entries(plans).map(([key, item], index) => (
          <motion.button
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.12 }}
            onClick={() => setPlan(key as PlanTier)}
            className={`rounded-2xl border p-6 text-left transition ${
              plan === key
                ? "border-cyan-300 bg-cyan-300/10 shadow-[0_0_35px_rgba(45,212,191,0.2)]"
                : "border-white/10 bg-white/5 hover:border-white/20"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold">{item.name}</h2>
                <p className="text-sm text-slate-300">{item.price}</p>
              </div>
              <span className="rounded-full border border-white/15 px-3 py-1 text-xs">
                {item.aiVoiceEnabled ? "AI Voice On" : "AI Voice Off"}
              </span>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-200">
              {item.features.map((feature) => (
                <li key={feature}>• {feature}</li>
              ))}
            </ul>
          </motion.button>
        ))}
      </section>

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid gap-8 rounded-3xl border border-white/10 bg-black/20 p-8 md:grid-cols-[1fr_1.2fr]"
      >
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold">1) Search availability</h3>
          <p className="text-sm text-slate-300">
            Enter a preferred date and we will query Supabase for open appointment slots.
          </p>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none ring-cyan-300 transition focus:ring"
          />
          <button
            type="button"
            disabled={loading || !date}
            onClick={searchAvailability}
            className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-500"
          >
            {loading ? "Searching..." : "Find appointments"}
          </button>

          <AnimatePresence>
            {error ? (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="rounded-lg border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-200"
              >
                {error}
              </motion.p>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="space-y-3">
          <h3 className="text-2xl font-semibold">2) Voice-assisted booking</h3>
          <p className="text-sm text-slate-300">
            We speak available times, then listen for spoken confirmation to book a slot.
          </p>
          <div className="grid gap-3">
            {slots.map((slot, index) => (
              <motion.div
                key={slot.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
                className="rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <p className="font-medium">{new Date(slot.starts_at).toLocaleString()}</p>
                <p className="text-xs text-slate-300">Provider: {slot.provider_name}</p>
                <button
                  type="button"
                  disabled={!planDetails.aiVoiceEnabled}
                  onClick={() => handleVoiceBook(slot)}
                  className="mt-3 rounded-lg bg-indigo-400 px-3 py-2 text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-500"
                >
                  {planDetails.aiVoiceEnabled ? "Speak & book this slot" : "Upgrade for AI voice booking"}
                </button>
              </motion.div>
            ))}
          </div>

          <div className="rounded-xl border border-cyan-300/30 bg-cyan-400/10 p-4">
            <p className="text-xs uppercase tracking-widest text-cyan-200">Voice assistant</p>
            <div className="mt-2 flex items-end gap-1">
              {[...Array(6)].map((_, i) => (
                <span key={i} className="voice-wave inline-block h-7 w-1.5 rounded-sm" style={{ animationDelay: `${i * 120}ms` }} />
              ))}
            </div>
            <p className="mt-3 text-sm text-cyan-100">{voiceStatus}</p>
            {selectedSlot ? (
              <p className="mt-1 text-xs text-cyan-200">
                Booked: {new Date(selectedSlot.starts_at).toLocaleString()} with {selectedSlot.provider_name}
              </p>
            ) : null}
          </div>
        </div>
      </motion.section>
    </main>
  );
}
