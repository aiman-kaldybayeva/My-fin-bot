"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTelegram } from "@/lib/TelegramContext";

interface Category {
  id: number;
  name: string;
  icon: string;
}

export default function AddPage() {
  const { initData, ready } = useTelegram();
  const router = useRouter();

  const [type, setType] = useState<"expense" | "income">("expense");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !initData) return;
    fetch(`/api/categories?initData=${encodeURIComponent(initData)}&type=${type}`)
      .then((res) => res.json())
      .then((data) => {
        setCategories(data.categories || []);
        setCategoryId(data.categories?.[0]?.id ?? null);
      });
  }, [ready, initData, type]);

  async function handleAddCategory() {
    if (!newCategoryName.trim() || !initData) return;
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData, name: newCategoryName.trim(), type }),
    });
    const data = await res.json();
    if (data.category) {
      setCategories((prev) => [...prev, data.category]);
      setCategoryId(data.category.id);
      setNewCategoryName("");
      setAddingCategory(false);
    }
  }

  async function handleSubmit() {
    setError(null);
    const value = parseFloat(amount.replace(",", "."));
    if (!value || value <= 0) return setError("Введи корректную сумму.");
    if (!categoryId) return setError("Выбери категорию.");
    if (!initData) return setError("Открой приложение через Telegram.");

    setSubmitting(true);
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        initData,
        amount: value,
        type,
        category_id: categoryId,
        note: note.trim() || null,
      }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (data.error) return setError(data.error);
    router.push("/");
  }

  return (
    <>
      <div className="center-head">
        <h1>Новая операция</h1>
        <p>Заполни данные и сохрани</p>
      </div>

      <div className="toggle">
        {(["expense", "income"] as const).map((t) => (
          <button
            key={t}
            className={type === t ? "on" : ""}
            onClick={() => setType(t)}
          >
            {t === "expense" ? "Расход" : "Доход"}
          </button>
        ))}
      </div>

      <div className="amount-box">
        <p className="cap">Сумма</p>
        <div className="amount-input-wrap">
          <span className="cur">₸</span>
          <input
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <p className="cat-title">Категория</p>
        <div className="cat-grid">
          {categories.map((c) => (
            <button
              key={c.id}
              className={`cat ${categoryId === c.id ? "on" : ""}`}
              onClick={() => setCategoryId(c.id)}
            >
              <span className="box">{c.icon}</span>
              <span className="label">{c.name}</span>
            </button>
          ))}
          {!addingCategory && (
            <button className="cat" onClick={() => setAddingCategory(true)}>
              <span className="box dashed">＋</span>
              <span className="label">Своя</span>
            </button>
          )}
        </div>

        {addingCategory && (
          <div style={{ display: "flex", gap: 8 }}>
            <input
              autoFocus
              className="text-input"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Название категории"
              style={{ flex: 1 }}
            />
            <button className="btn-primary" style={{ width: "auto", padding: "0 20px" }} onClick={handleAddCategory}>
              ОК
            </button>
          </div>
        )}
      </div>

      <div className="stack">
        <label className="field-label" htmlFor="note">Комментарий</label>
        <input
          id="note"
          className="text-input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Например: обед с командой"
        />
      </div>

      {error && <p className="error-text">{error}</p>}

      <button className="btn-primary" disabled={submitting} onClick={handleSubmit}>
        {submitting ? "Сохраняю…" : "Сохранить операцию"}
      </button>
    </>
  );
}
