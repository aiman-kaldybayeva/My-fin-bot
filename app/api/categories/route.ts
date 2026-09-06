import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ensureProfile } from "@/lib/ensureProfile";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const initData = searchParams.get("initData") || "";
  const type = searchParams.get("type") || "expense";

  const profile = await ensureProfile(initData);
  if (!profile) {
    return NextResponse.json({ error: "Неверные данные Telegram." }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("id, name, icon, is_custom")
    .eq("type", type)
    .or(`user_id.is.null,user_id.eq.${profile.user.id}`)
    .order("is_custom", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ categories: data });
}

export async function POST(req: NextRequest) {
  const { initData, name, type } = await req.json();

  const profile = await ensureProfile(initData);
  if (!profile) {
    return NextResponse.json({ error: "Неверные данные Telegram." }, { status: 401 });
  }
  if (!name || !type) {
    return NextResponse.json({ error: "Укажи название и тип категории." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("categories")
    .insert({
      user_id: profile.user.id,
      name,
      type,
      icon: type === "income" ? "💰" : "🏷️",
      is_custom: true,
    })
    .select("id, name, icon, is_custom")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ category: data });
}
