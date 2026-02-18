"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useMemo, useState } from "react";
import AuthButtons from "@/components/auth/AuthButtons";
import { plans, type BillingInterval, type PlanId } from "@/lib/plans";

type AvailabilityResponse = {
  slots?: string[];
  mode?: "mock" | "supabase";
  message?: string;
  error?: string;
  plan?: {
    plan_code: string;
    ai_enabled: boolean;
    voice_enabled: boolean;
  };
};

const animations = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
};

function VoiceHelper({ enabled, onTranscript }: { enabled: boolean; onTranscript: (text: string) => void }) {
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState("Tap to start voice input.");

  async function startVoice() {
    if (!enabled) return;

    const SpeechRecognition =
      typeof window !== "undefined"
        ? ((window as any).webkitSpeechRecognition as any) || ((window as any).SpeechRecognition as any)
        : null;

    if (!SpeechRecognition) {
      setStatus("Speech recognition is not available in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    setListening(true);
    setStatus("Listening… say a date and preferred time.");

    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? "";
      onTranscript(transcript);
      setStatus(`Heard: \"${transcript}\"`);
    };

    recognition.onerror = () => {
      setStatus("Voice capture failed. Please type your request.");
      setListening(false);
    };

    recognition.onend = () => setListening(false);
    recognition.start();
  }

  return (
    <div className="glass rounded-2xl p-5">
      <p className="mb-2 text-xs uppercase tracking-[0.2em] text-cyan-300">Voice Booking</p>
      <button
        onClick={startVoice}
        disabled={!enabled || listening}
        className="pulse-glow rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {enabled ? (listening ? "Listening..." : "Start Voice") : "Voice disabled on this tenant plan"}
      </button>
      <p className="mt-3 text-sm text-slate-300">{status}</p>
    </div>
  );
}

export default function AppointmentSetter() {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("voice-pro");
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("month");
  const [tenantSlug, setTenantSlug] = useState("demo-clinic");
  const [tenantName, setTenantName] = useState("Demo Clinic");
  const [adminEmail, setAdminEmail] = useState("owner@demo-clinic.com");
  const [date, setDate] = useState("");
  const [transcript, setTranscript] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [apiMessage, setApiMessage] = useState<string>("");
  const [tenantPlanCapabilities, setTenantPlanCapabilities] = useState<{
    ai_enabled: boolean;
    voice_enabled: boolean;
    plan_code: string;
  } | null>(null);

  const currentPlan = useMemo(() => plans.find((plan) => plan.id === selectedPlan) ?? plans[0], [selectedPlan]);
  const currentPrice =
    currentPlan.prices.find((price) => price.interval === billingInterval) ?? currentPlan.prices[0];

  const planVoiceEnabled = tenantPlanCapabilities?.voice_enabled ?? currentPlan.voiceEnabled;
  const planAiEnabled = tenantPlanCapabilities?.ai_enabled ?? currentPlan.aiEnabled;

  async function searchAvailability() {
    if (!date || !tenantSlug) {
      setApiMessage("Tenant slug and date are required.");
      return;
    }

    setLoading(true);
    setApiMessage("");

    const res = await fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantSlug,
        date,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      })
    });

    const data: AvailabilityResponse = await res.json();

    if (!res.ok) {
      setApiMessage(data.error ?? "Could not load slots.");
      setSlots([]);
      setLoading(false);
      return;
    }

    setSlots(data.slots ?? []);
    setTenantPlanCapabilities(data.plan ?? null);
    setApiMessage(data.message ?? "Found available appointment slots.");
    setLoading(false);
  }

  async function registerTenantAndCheckout() {
    const res = await fetch("/api/tenant/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantName,
        tenantSlug,
        adminEmail,
        planCode: selectedPlan,
        billingInterval
      })
    });

    const data = await res.json();

    if (!res.ok) {
      setApiMessage(data.error ?? "Unable to register tenant.");
      return;
    }

    if (data.checkoutUrl) window.location.href = data.checkoutUrl;
  }

  async function goToStripeCheckout() {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantSlug,
        planCode: selectedPlan,
        billingInterval
      })
    });

    const data = await res.json();
    if (!res.ok) {
      setApiMessage(data.error ?? "Unable to start checkout.");
      return;
    }

    if (data.url) window.location.href = data.url;
  }

  function confirmBooking() {
    if (!selectedSlot) {
      setApiMessage("Select a slot before booking.");
      return;
    }
    const modeLabel = planAiEnabled ? "AI voice assistant" : "standard flow";
    setApiMessage(`Booked ${date} at ${selectedSlot} for ${tenantSlug} via ${modeLabel}.`);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-6 py-10">
      <motion.header
        initial="hidden"
        animate="visible"
        variants={animations}
        transition={{ duration: 0.45 }}
        className="glass rounded-3xl p-8"
      >
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Supabase + Auth + Stripe + Multi-Tenant</p>
        <h1 className="mt-3 text-4xl font-bold">AI Voice Appointment Setter</h1>
        <p className="mt-3 max-w-3xl text-slate-300">
          Tenant registration, OAuth sign-in (Google/Facebook/Apple), monthly/yearly plan billing, voice booking,
          and tenant admin analytics.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/superadmin" className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900">
            Open Superadmin
          </Link>
          <Link href="/admin" className="rounded-lg bg-indigo-300 px-4 py-2 text-sm font-semibold text-slate-900">
            Open Tenant Admin
          </Link>
        </div>
      </motion.header>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="space-y-6">
          <section className="grid gap-5 md:grid-cols-3">
            {plans.map((plan, idx) => (
              <motion.button
                key={plan.id}
                initial="hidden"
                animate="visible"
                variants={animations}
                transition={{ duration: 0.35, delay: idx * 0.08 }}
                onClick={() => setSelectedPlan(plan.id)}
                className={`glass rounded-2xl p-5 text-left transition ${
                  selectedPlan === plan.id ? "border-cyan-400 ring-2 ring-cyan-400/40" : ""
                }`}
              >
                <p className="text-sm text-cyan-300">{plan.name}</p>
                <h2 className="mt-2 text-xl font-semibold">{currentPrice.label}</h2>
                <p className="mt-2 text-sm text-slate-300">{plan.description}</p>
                <div className="mt-4 text-xs text-slate-400">
                  AI: {plan.aiEnabled ? "Enabled" : "Disabled"} · Voice: {plan.voiceEnabled ? "Enabled" : "Disabled"}
                </div>
              </motion.button>
            ))}
          </section>

          <section className="glass rounded-2xl p-6">
            <h3 className="text-xl font-semibold">Tenant Registration + Plan Purchase</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input value={tenantName} onChange={(e) => setTenantName(e.target.value)} placeholder="Tenant name" className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2" />
              <input value={tenantSlug} onChange={(e) => setTenantSlug(e.target.value)} placeholder="Tenant slug" className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2" />
              <input value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="Admin email" className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2" />
              <select value={billingInterval} onChange={(e) => setBillingInterval(e.target.value as BillingInterval)} className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2">
                <option value="month">Monthly billing</option>
                <option value="year">Yearly billing</option>
              </select>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={registerTenantAndCheckout} className="rounded-lg bg-fuchsia-400 px-4 py-2 font-semibold text-slate-900">Register tenant + pay</button>
              <button onClick={goToStripeCheckout} className="rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-900">Change current tenant plan</button>
            </div>
          </section>

          <motion.section initial="hidden" animate="visible" variants={animations} transition={{ duration: 0.4, delay: 0.2 }} className="glass rounded-2xl p-6">
            <h3 className="text-xl font-semibold">Book by voice or manual input</h3>
            <div className="mt-4 flex flex-wrap gap-3">
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2" />
              <button onClick={searchAvailability} disabled={loading} className="rounded-lg bg-indigo-400 px-4 py-2 font-semibold text-slate-900 disabled:opacity-50">{loading ? "Searching..." : "Search availability"}</button>
            </div>

            <textarea value={transcript} onChange={(event) => setTranscript(event.target.value)} placeholder="Voice transcript appears here and can be edited manually..." className="mt-4 min-h-28 w-full rounded-lg border border-slate-600 bg-slate-900 p-3" />

            <AnimatePresence>
              <motion.div key={slots.join("|") || "empty"} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-5">
                <p className="mb-2 text-sm text-slate-300">Available slots</p>
                <div className="flex flex-wrap gap-2">
                  {slots.length ? (
                    slots.map((slot) => (
                      <button key={slot} onClick={() => setSelectedSlot(slot)} className={`rounded-md px-3 py-2 text-sm ${selectedSlot === slot ? "bg-cyan-300 text-slate-900" : "bg-slate-800 text-slate-100"}`}>
                        {slot}
                      </button>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">No slots loaded yet.</span>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            <button onClick={confirmBooking} className="mt-6 rounded-lg bg-emerald-400 px-4 py-2 font-semibold text-slate-900">Confirm appointment</button>
            {apiMessage ? <p className="mt-4 text-sm text-cyan-200">{apiMessage}</p> : null}
          </motion.section>
        </section>

        <motion.aside initial="hidden" animate="visible" variants={animations} transition={{ duration: 0.4, delay: 0.3 }} className="space-y-4">
          <AuthButtons />
          <VoiceHelper enabled={planVoiceEnabled} onTranscript={setTranscript} />
          <div className="glass rounded-2xl p-5 text-sm text-slate-300">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Tenant Plan Guardrails</p>
            <ul className="mt-3 list-disc space-y-2 pl-4">
              <li>Tenant: {tenantSlug || "-"}</li>
              <li>Effective plan: {tenantPlanCapabilities?.plan_code ?? currentPlan.id}</li>
              <li>Billing interval: {billingInterval}</li>
              <li>AI voice booking: {planAiEnabled ? "On" : "Off"}</li>
              <li>Voice input: {planVoiceEnabled ? "On" : "Off"}</li>
            </ul>
          </div>
        </motion.aside>
      </div>
    </main>
  );
}
