import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { TelegramProvider } from "@/lib/TelegramContext";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Финансы",
  description: "Учёт личных финансов в Telegram",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        <TelegramProvider>
          <div className="app-shell">
            <div className="glow glow-1" />
            <div className="glow glow-2" />
            <div className="content">{children}</div>
            <BottomNav />
          </div>
        </TelegramProvider>
      </body>
    </html>
  );
}
