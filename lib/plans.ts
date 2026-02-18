export type PlanId = "starter" | "voice-pro" | "ai-agent";
export type BillingInterval = "month" | "year";

export type PlanPrice = {
  interval: BillingInterval;
  label: string;
  amountCents: number;
  stripePriceLookupKey: string;
};

export type Plan = {
  id: PlanId;
  name: string;
  description: string;
  aiEnabled: boolean;
  voiceEnabled: boolean;
  prices: PlanPrice[];
};

export const plans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Manual booking flow with tenant scheduling and reminders.",
    aiEnabled: false,
    voiceEnabled: false,
    prices: [
      {
        interval: "month",
        label: "$29 / month",
        amountCents: 2900,
        stripePriceLookupKey: "starter-monthly"
      },
      {
        interval: "year",
        label: "$290 / year",
        amountCents: 29000,
        stripePriceLookupKey: "starter-yearly"
      }
    ]
  },
  {
    id: "voice-pro",
    name: "Voice Pro",
    description: "Voice intake + availability lookup with human confirmation.",
    aiEnabled: false,
    voiceEnabled: true,
    prices: [
      {
        interval: "month",
        label: "$99 / month",
        amountCents: 9900,
        stripePriceLookupKey: "voice-pro-monthly"
      },
      {
        interval: "year",
        label: "$990 / year",
        amountCents: 99000,
        stripePriceLookupKey: "voice-pro-yearly"
      }
    ]
  },
  {
    id: "ai-agent",
    name: "AI Agent",
    description: "Full AI voice booking + policy-based auto-confirmation.",
    aiEnabled: true,
    voiceEnabled: true,
    prices: [
      {
        interval: "month",
        label: "$249 / month",
        amountCents: 24900,
        stripePriceLookupKey: "ai-agent-monthly"
      },
      {
        interval: "year",
        label: "$2490 / year",
        amountCents: 249000,
        stripePriceLookupKey: "ai-agent-yearly"
      }
    ]
  }
];
