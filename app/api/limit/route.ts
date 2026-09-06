import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ensureProfile } from "@/lib/ensureProfile";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const initData = searchParams.get("initData") || "";

  const profile = await ensureProfile(initData);
  if (!profile) {
    return NextResponse.json({ error: "Неверные данные Telegram." }, { status: 401 });
  }

  return NextResponse.json({ daily_limit: profile.dailyLimit });
}

export async function POST(req: NextRequest) {
  const { initData, daily_limit } = await req.json();

  const profile = await ensureProfile(initData);
  if (!profile) {
    return NextResponse.json({ error: "Неверные данные Telegram." }, { status: 401 });
  }

  if (typeof daily_limit !== "number" || daily_limit < 0) {
    return NextResponse.json({ error: "Некорректное значение лимита." }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ daily_limit })
    .eq("telegram_id", profile.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, daily_limit });
}
