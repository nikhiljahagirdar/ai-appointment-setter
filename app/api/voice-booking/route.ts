import { NextRequest, NextResponse } from "next/server";
import { plans, type PlanTier } from "@/lib/plans";
import { supabase } from "@/lib/supabase";

type SlotRow = {
  id: string;
  date: string;
  time: string;
  is_booked: boolean;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const plan = (searchParams.get("plan") ?? "starter") as PlanTier;

  if (!date) {
    return NextResponse.json({ error: "Missing date query parameter." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("appointment_slots")
    .select("id, date, time, is_booked")
    .eq("date", date)
    .eq("is_booked", false)
    .order("time", { ascending: true })
    .limit(plans[plan].voiceEnabled ? 10 : 5);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ slots: (data ?? []) as SlotRow[] });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    plan?: PlanTier;
    slotId?: string;
    transcript?: string;
    customerName?: string;
    customerPhone?: string;
  };

  const plan = body.plan ?? "starter";

  if (!plans[plan].voiceEnabled) {
    return NextResponse.json(
      {
        error: "Your current plan does not include AI voice booking. Upgrade to Voice Pro or AI Agent.",
      },
      { status: 403 }
    );
  }

  if (!body.slotId || !body.transcript) {
    return NextResponse.json({ error: "slotId and transcript are required." }, { status: 400 });
  }

  const { data: slot, error: slotError } = await supabase
    .from("appointment_slots")
    .select("id, date, time, is_booked, tenant_id")
    .eq("id", body.slotId)
    .single();

  if (slotError || !slot || slot.is_booked) {
    return NextResponse.json({ error: "That slot is no longer available." }, { status: 409 });
  }

  // Transaction-like update: set slot as booked
  const { error: updateError } = await supabase
    .from("appointment_slots")
    .update({ is_booked: true })
    .eq("id", body.slotId)
    .eq("is_booked", false);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Create the appointment record
  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .insert({
      tenant_id: slot.tenant_id,
      slot_id: slot.id,
      customer_name: body.customerName ?? "Voice Customer",
      customer_phone: body.customerPhone ?? "Voice Call",
      status: "confirmed",
      voice_transcript: body.transcript,
    })
    .select()
    .single();

  if (appointmentError) {
    return NextResponse.json({ error: appointmentError.message }, { status: 500 });
  }

  return NextResponse.json({
    confirmation: `Confirmed by voice: Your appointment for ${slot.date} at ${slot.time} is booked.`,
    appointment,
  });
}
