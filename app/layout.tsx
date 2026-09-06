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
      <body className="min-h-screen bg-tgbg text-tgtext">
        <TelegramProvider>
          <main className="mx-auto max-w-md pb-24 pt-4 px-4">{children}</main>
          <BottomNav />
        </TelegramProvider>
      </body>
    </html>
  );
}
