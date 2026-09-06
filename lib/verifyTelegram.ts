import crypto from "crypto";

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

/**
 * Validates the `initData` string that the Telegram Mini App sends to
 * the backend. This proves the request really came from Telegram and
 * was not forged by someone calling the API directly.
 * Returns the parsed Telegram user, or null if the signature is invalid.
 */
export function verifyTelegramInitData(
  initData: string,
  botToken: string
): TelegramUser | null {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) return null;
    params.delete("hash");

    const pairs: string[] = [];
    // URLSearchParams keeps insertion order; sort() orders keys alphabetically
    params.sort();
    params.forEach((value, key) => {
      pairs.push(`${key}=${value}`);
    });
    const dataCheckString = pairs.join("\n");

    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest();

    const computedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    if (computedHash !== hash) return null;

    const userStr = params.get("user");
    if (!userStr) return null;

    return JSON.parse(userStr) as TelegramUser;
  } catch {
    return null;
  }
}
