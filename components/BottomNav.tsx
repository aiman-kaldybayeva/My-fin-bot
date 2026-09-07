"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHomeNav, IconSettings, IconPlus } from "@/lib/icons";

export default function BottomNav() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bottom">
      <div className="nav-inner">
        <Link href="/" className={`nav-item ${isActive("/") ? "on" : ""}`}>
          <IconHomeNav width={22} height={22} />
          <span>Главная</span>
        </Link>

        <Link href="/add" className="nav-add" aria-label="Добавить операцию">
          <IconPlus width={28} height={28} strokeWidth={2.6} color="#fff" />
        </Link>

        <Link
          href="/settings"
          className={`nav-item ${isActive("/settings") ? "on" : ""}`}
        >
          <IconSettings width={22} height={22} />
          <span>Настройки</span>
        </Link>
      </div>
    </nav>
  );
}
