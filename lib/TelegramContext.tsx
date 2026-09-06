"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface TelegramUser {
  id: number;
  first_name?: string;
  username?: string;
}

interface TelegramContextValue {
  initData: string | null;
  user: TelegramUser | null;
  ready: boolean;
}

const TelegramContext = createContext<TelegramContextValue>({
  initData: null,
  user: null,
  ready: false,
});

export function useTelegram() {
  return useContext(TelegramContext);
}

function applyThemeVars(theme: Record<string, string>) {
  const root = document.documentElement;
  Object.entries(theme).forEach(([key, value]) => {
    const cssKey = "--tg-theme-" + key.replace(/_/g, "-");
    root.style.setProperty(cssKey, value.startsWith("#") ? value : `#${value}`);
  });
}

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<TelegramContextValue>({
    initData: null,
    user: null,
    ready: false,
  });

  useEffect(() => {
    let cancelled = false;

    import("@twa-dev/sdk").then((mod) => {
      const WebApp = mod.default;
      if (cancelled) return;

      WebApp.ready();
      WebApp.expand();

      if (WebApp.themeParams) {
        applyThemeVars(WebApp.themeParams as unknown as Record<string, string>);
      }
      document.documentElement.classList.toggle(
        "dark",
        WebApp.colorScheme === "dark"
      );

      const initData = WebApp.initData || null;
      const user = (WebApp.initDataUnsafe?.user as TelegramUser) || null;

      setValue({ initData, user, ready: true });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <TelegramContext.Provider value={value}>
      {children}
    </TelegramContext.Provider>
  );
}
