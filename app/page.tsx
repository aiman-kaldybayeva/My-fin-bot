"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTelegram } from "@/lib/TelegramContext";
import { IconTrendingUp, IconTrendingDown, getCategoryIcon } from "@/lib/icons";

interface Summary {
  balance: number;
  monthIncome: number;
  monthExpense: number;
  dailyLimit: number;
  spentToday: number;
  recent: {
    id: number;
    amount: number;
    type: "income" | "expense";
    note: string | null;
    category_name: string;
    category_icon: string;
  }[];
}

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(
    Math.abs(n)
  );

export default function DashboardPage() {
  const { initData, user, ready } = useTelegram();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!initData) {
      setError("Открой приложение через Telegram, чтобы увидеть данные.");
      setLoading(false);
      return;
    }

    fetch(`/api/transactions?initData=${encodeURIComponent(initData)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setSummary(data);
      })
      .catch(() => setError("Не удалось загрузить данные."))
      .finally(() => setLoading(false));
  }, [ready, initData]);

  const displayName = user?.first_name || user?.username || "друг";
  const initials = (user?.first_name?.[0] || "Ф") + (user?.username?.[0] || "");

  if (loading) return <p style={{ color: "var(--muted)", textAlign: "center", marginTop: 40 }}>Загрузка…</p>;
  if (error) return <p style={{ color: "var(--muted)", textAlign: "center", marginTop: 40 }}>{error}</p>;
  if (!summary) return null;

  const hasLimit = summary.dailyLimit > 0;
  const percent = hasLimit
    ? Math.min(100, Math.round((summary.spentToday / summary.dailyLimit) * 100))
    : 0;
  const overLimit = hasLimit && summary.spentToday > summary.dailyLimit;

  return (
    <>
      <div className="top-head">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="avatar">{initials.toUpperCase()}</div>
          <div>
            <p className="hi">Добро пожаловать</p>
            <p className="name">{displayName}</p>
          </div>
        </div>
      </div>

      <div className="balance">
        <p className="label">Общий баланс</p>
        <p className="amount">
          {summary.balance < 0 ? "-" : ""}
          {fmt(summary.balance)} ₸
        </p>
      </div>

      <div className="grid2">
        <div className="card accent">
          <div className="badge light"><IconTrendingUp width={20} height={20} color="#fff" /></div>
          <p className="cap">Доход за месяц</p>
          <p className="val">{fmt(summary.monthIncome)} ₸</p>
        </div>
        <div className="card ghost">
          <div className="badge dark"><IconTrendingDown width={20} height={20} color="#93b2ff" /></div>
          <p className="cap">Расход за месяц</p>
          <p className="val">{fmt(summary.monthExpense)} ₸</p>
        </div>
      </div>

      <div className="panel">
        <div className="row-between">
          <p className="limit-title">Дневной лимит трат</p>
          <p className="limit-nums">
            {hasLimit ? `${fmt(summary.spentToday)} / ${fmt(summary.dailyLimit)} ₸` : "не задан"}
          </p>
        </div>
        <div className="bar">
          <span
            className={overLimit ? "over" : ""}
            style={{ width: `${hasLimit ? percent : 0}%` }}
          />
        </div>
        {hasLimit ? (
          <p className="limit-left">
            {overLimit
              ? `Превышение на ${fmt(summary.spentToday - summary.dailyLimit)} ₸`
              : `Осталось ${fmt(summary.dailyLimit - summary.spentToday)} ₸ на сегодня`}
          </p>
        ) : (
          <Link href="/settings" className="limit-left" style={{ color: "var(--muted)" }}>
            Задать дневной лимит →
          </Link>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="section-title">
          <h2>Последние операции</h2>
        </div>
        {summary.recent.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--muted)" }}>
            Операций пока нет. Нажми «+», чтобы добавить первую.
          </p>
        ) : (
          <ul className="tx-list">
            {summary.recent.map((t) => {
              const Icon = getCategoryIcon(t.category_name, t.type);
              return (
                <li key={t.id} className="tx">
                  <div className="ic"><Icon width={20} height={20} color="#93b2ff" /></div>
                  <div className="mid">
                    <p className="t">{t.category_name}</p>
                    {t.note && <p className="c">{t.note}</p>}
                  </div>
                  <span className={`a ${t.type === "income" ? "inc" : "exp"}`}>
                    {t.type === "income" ? "+" : "\u2212"}
                    {fmt(t.amount)} ₸
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
