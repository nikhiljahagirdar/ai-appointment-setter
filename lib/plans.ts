export type PlanId = "starter" | "voice-pro" | "ai-agent";

export type Plan = {
  id: PlanId;
  name: string;
  price: string;
  description: string;
  aiEnabled: boolean;
  voiceEnabled: boolean;
  stripePriceLookupKey: string;
};

export const plans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: "$29/mo",
    description: "Manual booking flow with calendar and SMS follow-ups.",
    aiEnabled: false,
    voiceEnabled: false,
    stripePriceLookupKey: "starter-monthly"
  },
  {
    id: "voice-pro",
    name: "Voice Pro",
    price: "$99/mo",
    description: "Voice intake + availability lookup + assisted booking.",
    aiEnabled: false,
    voiceEnabled: true,
    stripePriceLookupKey: "voice-pro-monthly"
  },
  {
    id: "ai-agent",
    name: "AI Agent",
    price: "$249/mo",
    description: "Full AI voice agent that can confirm slots and close bookings.",
    aiEnabled: true,
    voiceEnabled: true,
    stripePriceLookupKey: "ai-agent-monthly"
  }
];
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
