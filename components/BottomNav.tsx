"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bottom">
      <div className="nav-inner">
        <Link href="/" className={`nav-item ${isActive("/") ? "on" : ""}`}>
          <span>🏠</span>
          <span>Главная</span>
        </Link>

        <Link href="/add" className="nav-add" aria-label="Добавить операцию">
          +
        </Link>

        <Link
          href="/settings"
          className={`nav-item ${isActive("/settings") ? "on" : ""}`}
        >
          <span>⚙️</span>
          <span>Настройки</span>
        </Link>
      </div>
    </nav>
  );
}
