import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ensureProfile } from "@/lib/ensureProfile";

function startOfTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfMonthISO() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

async function sendTelegramAlert(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  }).catch(() => {});
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const initData = searchParams.get("initData") || "";

  const profile = await ensureProfile(initData);
  if (!profile) {
    return NextResponse.json({ error: "Неверные данные Telegram." }, { status: 401 });
  }
  const userId = profile.user.id;

  const [{ data: all }, { data: month }, { data: today }, { data: recent }] =
    await Promise.all([
      supabaseAdmin.from("transactions").select("amount, type").eq("user_id", userId),
      supabaseAdmin
        .from("transactions")
        .select("amount, type")
        .eq("user_id", userId)
        .gte("created_at", startOfMonthISO()),
      supabaseAdmin
        .from("transactions")
        .select("amount, type")
        .eq("user_id", userId)
        .gte("created_at", startOfTodayISO()),
      supabaseAdmin
        .from("transactions")
        .select("id, amount, type, note, created_at, categories(name, icon)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  const sum = (rows: { amount: number; type: string }[] | null, type: string) =>
    (rows || [])
      .filter((r) => r.type === type)
      .reduce((acc, r) => acc + Number(r.amount), 0);

  const balance = sum(all, "income") - sum(all, "expense");

  return NextResponse.json({
    balance,
    todayIncome: sum(today, "income"),
    todayExpense: sum(today, "expense"),
    monthIncome: sum(month, "income"),
    monthExpense: sum(month, "expense"),
    dailyLimit: profile.dailyLimit,
    spentToday: sum(today, "expense"),
    recent: (recent || []).map((t: any) => ({
      id: t.id,
      amount: Number(t.amount),
      type: t.type,
      note: t.note,
      created_at: t.created_at,
      category_name: t.categories?.name || "Без категории",
      category_icon: t.categories?.icon || "💰",
    })),
  });
}

export async function POST(req: NextRequest) {
  const { initData, amount, type, category_id, note } = await req.json();

  const profile = await ensureProfile(initData);
  if (!profile) {
    return NextResponse.json({ error: "Неверные данные Telegram." }, { status: 401 });
  }

  if (!amount || amount <= 0 || !["income", "expense"].includes(type)) {
    return NextResponse.json({ error: "Некорректные данные операции." }, { status: 400 });
  }

  const userId = profile.user.id;

  const { data: inserted, error } = await supabaseAdmin
    .from("transactions")
    .insert({
      user_id: userId,
      category_id: category_id || null,
      amount,
      type,
      note: note || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let limitExceeded = false;

  if (type === "expense" && profile.dailyLimit > 0) {
    const { data: todayExpenses } = await supabaseAdmin
      .from("transactions")
      .select("amount")
      .eq("user_id", userId)
      .eq("type", "expense")
      .gte("created_at", startOfTodayISO());

    const spentToday = (todayExpenses || []).reduce(
      (acc, r) => acc + Number(r.amount),
      0
    );

    if (spentToday > profile.dailyLimit) {
      limitExceeded = true;
      await sendTelegramAlert(
        userId,
        `⚠️ Внимание! Вы превысили свой дневной лимит расходов.\n\nПотрачено сегодня: ${spentToday.toLocaleString(
          "ru-RU"
        )} ₸\nЛимит: ${profile.dailyLimit.toLocaleString("ru-RU")} ₸`
      );
    }
  }

  return NextResponse.json({ transaction: inserted, limitExceeded });
}
