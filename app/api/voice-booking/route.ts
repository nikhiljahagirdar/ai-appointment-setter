import { NextRequest, NextResponse } from "next/server";
import { plans, type PlanTier } from "@/lib/plans";
import { supabase } from "@/lib/supabase";

type AvailabilityRow = {
  id: string;
  starts_at: string;
  provider_name: string;
  is_available: boolean;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const plan = (searchParams.get("plan") ?? "starter") as PlanTier;

  if (!date) {
    return NextResponse.json({ error: "Missing date query parameter." }, { status: 400 });
  }

  const startOfDay = `${date}T00:00:00.000Z`;
  const endOfDay = `${date}T23:59:59.999Z`;

  const { data, error } = await supabase
    .from("appointment_slots")
    .select("id, starts_at, provider_name, is_available")
    .eq("is_available", true)
    .gte("starts_at", startOfDay)
    .lte("starts_at", endOfDay)
    .order("starts_at", { ascending: true })
    .limit(plans[plan].aiVoiceEnabled ? 10 : 5);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ slots: (data ?? []) as AvailabilityRow[] });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    plan?: PlanTier;
    slotId?: string;
    transcript?: string;
  };

  const plan = body.plan ?? "starter";

  if (!plans[plan].aiVoiceEnabled) {
    return NextResponse.json(
      {
        error: "Your current plan does not include AI voice booking. Upgrade to Pro Voice AI.",
      },
      { status: 403 }
    );
  }

  if (!body.slotId || !body.transcript) {
    return NextResponse.json({ error: "slotId and transcript are required." }, { status: 400 });
  }

  const { data: slot, error: slotError } = await supabase
    .from("appointment_slots")
    .select("id, starts_at, provider_name, is_available")
    .eq("id", body.slotId)
    .single();

  if (slotError || !slot?.is_available) {
    return NextResponse.json({ error: "That slot is no longer available." }, { status: 409 });
  }

  const { error: updateError } = await supabase
    .from("appointment_slots")
    .update({ is_available: false })
    .eq("id", body.slotId)
    .eq("is_available", true);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    confirmation: `Confirmed by voice: Your appointment for ${new Date(slot.starts_at).toLocaleString()} with ${slot.provider_name} is booked.`,
  });
}
