"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const linkBase =
  "flex flex-col items-center justify-center gap-1 text-xs font-medium w-16";

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-black/5 bg-tgcard">
      <div className="mx-auto flex max-w-md items-center justify-between px-6 py-2">
        <Link
          href="/"
          className={`${linkBase} ${isActive("/") ? "text-tglink" : "text-tghint"}`}
        >
          <span className="text-xl">🏠</span>
          Главная
        </Link>

        <Link
          href="/add"
          className="-mt-8 flex h-16 w-16 items-center justify-center rounded-full btn-primary text-3xl shadow-lg"
          aria-label="Добавить операцию"
        >
          +
        </Link>

        <Link
          href="/settings"
          className={`${linkBase} ${isActive("/settings") ? "text-tglink" : "text-tghint"}`}
        >
          <span className="text-xl">⚙️</span>
          Настройки
        </Link>
      </div>
    </nav>
  );
}
