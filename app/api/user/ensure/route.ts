import { NextRequest, NextResponse } from "next/server";
import { verifyTelegramInitData } from "@/lib/verifyTelegram";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  const { initData } = await req.json();
  const user = verifyTelegramInitData(
    initData || "",
    process.env.TELEGRAM_BOT_TOKEN as string
  );

  if (!user) {
    return NextResponse.json({ error: "Неверные данные Telegram." }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        telegram_id: user.id,
        username: user.username || null,
        first_name: user.first_name || null,
      },
      { onConflict: "telegram_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
