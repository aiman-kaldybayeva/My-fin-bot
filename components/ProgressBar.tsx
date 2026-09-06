export default function ProgressBar({
  spent,
  limit,
}: {
  spent: number;
  limit: number;
}) {
  const hasLimit = limit > 0;
  const percent = hasLimit ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
  const overLimit = hasLimit && spent > limit;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-tghint">Дневной лимит</span>
        <span className={overLimit ? "font-semibold text-expense" : "text-tghint"}>
          {hasLimit
            ? `${spent.toLocaleString("ru-RU")} / ${limit.toLocaleString("ru-RU")} ₸`
            : "не задан"}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-tgsecondary">
        <div
          className={`h-full rounded-full transition-all ${
            overLimit ? "bg-expense" : "bg-tglink"
          }`}
          style={{ width: `${hasLimit ? percent : 0}%` }}
        />
      </div>
      {overLimit && (
        <p className="mt-1 text-xs font-medium text-expense">
          Лимит превышен на {(spent - limit).toLocaleString("ru-RU")} ₸
        </p>
      )}
    </div>
  );
}
