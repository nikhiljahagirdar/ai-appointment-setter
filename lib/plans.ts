export type PlanId = "starter" | "voice-pro" | "ai-agent";

export type Plan = {
  id: PlanId;
  name: string;
  price: string;
  description: string;
  aiEnabled: boolean;
  voiceEnabled: boolean;
};

export const plans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: "$29/mo",
    description: "Manual booking flow with calendar and SMS follow-ups.",
    aiEnabled: false,
    voiceEnabled: false
  },
  {
    id: "voice-pro",
    name: "Voice Pro",
    price: "$99/mo",
    description: "Voice intake + availability lookup + assisted booking.",
    aiEnabled: false,
    voiceEnabled: true
  },
  {
    id: "ai-agent",
    name: "AI Agent",
    price: "$249/mo",
    description: "Full AI voice agent that can confirm slots and close bookings.",
    aiEnabled: true,
    voiceEnabled: true
  }
];
