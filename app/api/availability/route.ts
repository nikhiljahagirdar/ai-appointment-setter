import { NextRequest, NextResponse } from "next/server";
import { hasSupabase, supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { date, timezone } = await req.json();

  if (!date) {
    return NextResponse.json({ error: "A date is required." }, { status: 400 });
  }

  if (!hasSupabase || !supabase) {
    return NextResponse.json({
      mode: "mock",
      slots: ["09:00", "11:30", "14:15", "16:00"],
      message:
        "Supabase keys are not configured. Using mock availability data for demo purposes."
    });
  }

  const { data, error } = await supabase
    .from("appointment_slots")
    .select("time")
    .eq("date", date)
    .eq("is_booked", false)
    .order("time", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Unable to fetch appointment availability.", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    mode: "supabase",
    timezone: timezone || "UTC",
    slots: data.map((slot) => slot.time)
  });
}
