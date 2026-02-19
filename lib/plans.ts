export type PlanId = "starter" | "voice-pro" | "ai-agent";

export type Plan = {
  id: PlanId;
  name: string;
  price: string;
  description: string;
  aiEnabled: boolean;
  voiceEnabled: boolean;
  stripePriceLookupKey: string;
  features: string[];
};

export const plans: Record<PlanId, Plan> = {
  starter: {
    id: "starter",
    name: "Starter",
    price: "$29/mo",
    description: "Manual booking flow with calendar and SMS follow-ups.",
    aiEnabled: false,
    voiceEnabled: false,
    stripePriceLookupKey: "starter-monthly",
    features: [
      "Manual appointment booking",
      "Realtime availability lookup",
      "Basic booking dashboard",
    ],
  },
  "voice-pro": {
    id: "voice-pro",
    name: "Voice Pro",
    price: "$99/mo",
    description: "Voice intake + availability lookup + assisted booking.",
    aiEnabled: false,
    voiceEnabled: true,
    stripePriceLookupKey: "voice-pro-monthly",
    features: [
      "Everything in Starter",
      "AI voice assistant",
      "Voice-first booking flow",
      "Auto follow-up reminders",
    ],
  },
  "ai-agent": {
    id: "ai-agent",
    name: "AI Agent",
    price: "$249/mo",
    description: "Full AI voice agent that can confirm slots and close bookings.",
    aiEnabled: true,
    voiceEnabled: true,
    stripePriceLookupKey: "ai-agent-monthly",
    features: [
      "Everything in Voice Pro",
      "Full AI closure",
      "Sentiment analysis",
      "Custom voice selection",
    ],
  },
};

export type PlanTier = PlanId;
