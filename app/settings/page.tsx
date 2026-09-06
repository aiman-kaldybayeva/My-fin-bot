"use client";

import { useEffect, useState } from "react";
import { useTelegram } from "@/lib/TelegramContext";

export default function SettingsPage() {
  const { initData, ready } = useTelegram();
  const [limit, setLimit] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !initData) return;
    fetch(`/api/limit?initData=${encodeURIComponent(initData)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.daily_limit) setLimit(String(data.daily_limit));
      });
  }, [ready, initData]);

  async function handleSave() {
    setError(null);
    setSaved(false);
    const value = parseFloat(limit.replace(",", "."));
    if (Number.isNaN(value) || value < 0) {
      setError("Введи корректное число.");
      return;
    }
    if (!initData) {
      setError("Открой приложение через Telegram.");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/limit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData, daily_limit: value }),
    });
    const data = await res.json();
    setSaving(false);

    if (data.error) {
      setError(data.error);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold">Настройки</h1>

      <div className="card px-5 py-6">
        <label className="mb-2 block text-sm text-tghint">
          Ежедневная норма трат
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            placeholder="Например, 10000"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            className="w-full bg-transparent text-3xl font-bold outline-none placeholder:text-tghint"
          />
          <span className="text-2xl text-tghint">₸</span>
        </div>
        <p className="mt-2 text-xs text-tghint">
          Если потратишь больше этой суммы за день — бот пришлёт
          предупреждение в чат.
        </p>
      </div>

      {error && <p className="text-sm text-expense">{error}</p>}
      {saved && <p className="text-sm text-income">Сохранено ✓</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary w-full rounded-2xl py-4 text-base font-semibold disabled:opacity-60"
      >
        {saving ? "Сохраняю…" : "Сохранить лимит"}
      </button>
    </div>
  );
}
