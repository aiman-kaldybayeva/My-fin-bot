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
    if (Number.isNaN(value) || value < 0) return setError("Введи корректное число.");
    if (!initData) return setError("Открой приложение через Telegram.");

    setSaving(true);
    const res = await fetch("/api/limit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData, daily_limit: value }),
    });
    const data = await res.json();
    setSaving(false);

    if (data.error) setError(data.error);
    else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <>
      <div className="center-head">
        <h1>Настройки</h1>
        <p>Управляй дневным лимитом трат</p>
      </div>

      <div className="panel">
        <div className="limit-head">
          <div className="ic">💰</div>
          <div>
            <p className="t">Дневной лимит трат</p>
            <p className="s">Сколько можно тратить в день</p>
          </div>
        </div>
        <label className="mini-label" htmlFor="limit-input">Сумма лимита</label>
        <div className="big-input">
          <span className="cur">₸</span>
          <input
            id="limit-input"
            inputMode="decimal"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            placeholder="Например, 10000"
          />
        </div>
        <p className="mini-label" style={{ marginTop: 12, marginBottom: 0 }}>
          Если потратишь больше этой суммы за день — бот пришлёт предупреждение в чат.
        </p>
      </div>

      {error && <p className="error-text">{error}</p>}
      {saved && <p className="success-text">Сохранено ✓</p>}

      <button className="btn-primary" disabled={saving} onClick={handleSave}>
        {saving ? "Сохраняю…" : "Сохранить лимит"}
      </button>
    </>
  );
}
