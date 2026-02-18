export type PlanTier = "starter" | "pro";

export const plans = {
  starter: {
    name: "Starter",
    price: "$29/mo",
    aiVoiceEnabled: false,
    features: [
      "Manual appointment booking",
      "Realtime availability lookup",
      "Basic booking dashboard",
    ],
  },
  pro: {
    name: "Pro Voice AI",
    price: "$129/mo",
    aiVoiceEnabled: true,
    features: [
      "Everything in Starter",
      "AI voice assistant",
      "Voice-first booking flow",
      "Auto follow-up reminders",
    ],
  },
} as const;
