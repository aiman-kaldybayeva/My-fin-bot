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
    fetch(
      `/api/categories?initData=${encodeURIComponent(initData)}&type=${type}`
    )
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
    if (!value || value <= 0) {
      setError("Введи корректную сумму.");
      return;
    }
    if (!categoryId) {
      setError("Выбери категорию.");
      return;
    }
    if (!initData) {
      setError("Открой приложение через Telegram.");
      return;
    }

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

    if (data.error) {
      setError(data.error);
      return;
    }

    router.push("/");
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold">Новая операция</h1>

      <div className="flex rounded-2xl bg-tgsecondary p-1">
        {(["expense", "income"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
              type === t
                ? t === "expense"
                  ? "bg-expense text-white"
                  : "bg-income text-white"
                : "text-tghint"
            }`}
          >
            {t === "expense" ? "Расход" : "Доход"}
          </button>
        ))}
      </div>

      <div className="card px-5 py-6">
        <label className="mb-2 block text-sm text-tghint">Сумма</label>
        <input
          type="number"
          inputMode="decimal"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full bg-transparent text-4xl font-bold outline-none placeholder:text-tghint"
        />
      </div>

      <div className="card px-5 py-5">
        <p className="mb-3 text-sm text-tghint">Категория</p>
        <div className="grid grid-cols-4 gap-3">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryId(c.id)}
              className={`flex flex-col items-center gap-1 rounded-2xl py-3 text-xs font-medium transition ${
                categoryId === c.id
                  ? "btn-primary"
                  : "bg-tgsecondary text-tgtext"
              }`}
            >
              <span className="text-xl">{c.icon}</span>
              <span className="line-clamp-1">{c.name}</span>
            </button>
          ))}

          {addingCategory ? (
            <div className="col-span-4 flex gap-2">
              <input
                autoFocus
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Название"
                className="flex-1 rounded-xl bg-tgsecondary px-3 py-2 text-sm outline-none"
              />
              <button
                onClick={handleAddCategory}
                className="rounded-xl btn-primary px-4 text-sm font-semibold"
              >
                ОК
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingCategory(true)}
              className="flex flex-col items-center gap-1 rounded-2xl border border-dashed border-tghint py-3 text-xs font-medium text-tghint"
            >
              <span className="text-xl">＋</span>
              Своя
            </button>
          )}
        </div>
      </div>

      <div className="card px-5 py-5">
        <label className="mb-2 block text-sm text-tghint">
          Комментарий (необязательно)
        </label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Например: обед с коллегами"
          className="w-full bg-transparent text-sm outline-none placeholder:text-tghint"
        />
      </div>

      {error && <p className="text-sm text-expense">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="btn-primary w-full rounded-2xl py-4 text-base font-semibold disabled:opacity-60"
      >
        {submitting ? "Сохраняю…" : "Сохранить"}
      </button>
    </div>
  );
}
