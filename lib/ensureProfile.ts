import { verifyTelegramInitData, TelegramUser } from "@/lib/verifyTelegram";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function ensureProfile(
  initData: string
): Promise<{ user: TelegramUser; dailyLimit: number } | null> {
  const user = verifyTelegramInitData(
    initData || "",
    process.env.TELEGRAM_BOT_TOKEN as string
  );
  if (!user) return null;

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

  if (error) return null;

  return { user, dailyLimit: Number(data?.daily_limit || 0) };
}
