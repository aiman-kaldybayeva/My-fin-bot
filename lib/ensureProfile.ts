import { verifyTelegramInitData, TelegramUser } from "@/lib/verifyTelegram";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type EnsureProfileResult =
  | { ok: true; user: TelegramUser; dailyLimit: number }
  | { ok: false; reason: "telegram"; detail?: string }
  | { ok: false; reason: "database"; detail: string };

export async function ensureProfile(
  initData: string
): Promise<EnsureProfileResult> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    return {
      ok: false,
      reason: "database",
      detail: "TELEGRAM_BOT_TOKEN не задан на сервере (проверь переменные окружения в Vercel).",
    };
  }

  const user = verifyTelegramInitData(initData || "", botToken);
  if (!user) {
    return { ok: false, reason: "telegram" };
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        telegram_id: user.id,
        username: user.username || null,
        first_name: user.first_name || null,
      },
      { onConflict: "telegram_id", ignoreDuplicates: false }
    )
    .select("daily_limit")
    .single();

  if (error) {
    return { ok: false, reason: "database", detail: error.message };
  }

  return { ok: true, user, dailyLimit: Number(data?.daily_limit || 0) };
}
