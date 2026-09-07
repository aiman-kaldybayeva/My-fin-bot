import { NextResponse } from "next/server";
import { EnsureProfileResult } from "@/lib/ensureProfile";

export function profileErrorResponse(
  profile: Extract<EnsureProfileResult, { ok: false }>
) {
  if (profile.reason === "telegram") {
    return NextResponse.json(
      { error: "Неверные данные Telegram." },
      { status: 401 }
    );
  }
  // reason === "database": this is NOT a Telegram problem, it's Supabase.
  return NextResponse.json(
    { error: `Ошибка базы данных: ${profile.detail}` },
    { status: 500 }
  );
}
