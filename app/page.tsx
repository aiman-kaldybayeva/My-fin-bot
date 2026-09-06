"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTelegram } from "@/lib/TelegramContext";
import ProgressBar from "@/components/ProgressBar";

interface Summary {
  balance: number;
  todayIncome: number;
  todayExpense: number;
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
    created_at: string;
  }[];
}

export default function DashboardPage() {
  const { initData, ready } = useTelegram();
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
        if (data.error) {
          setError(data.error);
        } else {
          setSummary(data);
        }
      })
      .catch(() => setError("Не удалось загрузить данные."))
      .finally(() => setLoading(false));
  }, [ready, initData]);

  if (loading) {
    return <p className="mt-10 text-center text-tghint">Загрузка…</p>;
  }

  if (error) {
    return <p className="mt-10 text-center text-tghint">{error}</p>;
  }

  if (!summary) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="card px-5 py-6">
        <p className="text-sm text-tghint">Баланс</p>
        <p className="mt-1 text-4xl font-bold tracking-tight">
          {summary.balance.toLocaleString("ru-RU")} ₸
        </p>

        <div className="mt-4 flex gap-4">
          <div className="flex-1 rounded-2xl bg-tgsecondary px-3 py-2">
            <p className="text-xs text-tghint">Доход за месяц</p>
            <p className="font-semibold text-income">
              +{summary.monthIncome.toLocaleString("ru-RU")} ₸
            </p>
          </div>
          <div className="flex-1 rounded-2xl bg-tgsecondary px-3 py-2">
            <p className="text-xs text-tghint">Расход за месяц</p>
            <p className="font-semibold text-expense">
              -{summary.monthExpense.toLocaleString("ru-RU")} ₸
            </p>
          </div>
        </div>
      </div>

      <div className="card px-5 py-5">
        <ProgressBar spent={summary.spentToday} limit={summary.dailyLimit} />
        {summary.dailyLimit === 0 && (
          <Link
            href="/settings"
            className="mt-3 inline-block text-sm font-medium text-tglink"
          >
            Задать дневной лимит →
          </Link>
        )}
      </div>

      <div className="card px-5 py-5">
        <p className="mb-3 text-sm font-semibold text-tghint">
          Последние операции
        </p>
        {summary.recent.length === 0 ? (
          <p className="text-sm text-tghint">
            Операций пока нет. Нажми «+», чтобы добавить первую.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {summary.recent.map((t) => (
              <li key={t.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-tgsecondary text-lg">
                    {t.category_icon}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{t.category_name}</p>
                    {t.note && (
                      <p className="text-xs text-tghint">{t.note}</p>
                    )}
                  </div>
                </div>
                <span
                  className={`font-semibold ${
                    t.type === "income" ? "text-income" : "text-expense"
                  }`}
                >
                  {t.type === "income" ? "+" : "-"}
                  {t.amount.toLocaleString("ru-RU")} ₸
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
