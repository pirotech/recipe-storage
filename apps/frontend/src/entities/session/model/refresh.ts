import { ApiError } from "@/shared/api";
import { refreshTokens } from "../api/sessionApi";
import { useSessionStore } from "./store";

let inflight: Promise<string | null> | null = null;

// Single-flight: если 3 запроса одновременно получили 401, на сервер уйдёт ОДИН refresh.
// Это обязательно: refresh одноразовый, и второй параллельный вызов с тем же токеном
// получил бы 401 и разлогинил пользователя.
export function refreshSession(): Promise<string | null> {
  inflight ??= doRefresh().finally(() => {
    inflight = null;
  });
  return inflight;
}

async function doRefresh(): Promise<string | null> {
  const { refreshToken, setTokens, clear } = useSessionStore.getState();
  if (!refreshToken) return null;
  try {
    const tokens = await refreshTokens(refreshToken);
    setTokens(tokens);
    return tokens.accessToken;
  } catch (e) {
    // Разлогиниваем, только если сервер ЯВНО отверг токен. При обрыве сети или 5xx
    // сессия остаётся: для PWA «нет интернета» не должно означать «выйди из аккаунта».
    if (e instanceof ApiError && e.status === 401) clear();
    return null;
  }
}
