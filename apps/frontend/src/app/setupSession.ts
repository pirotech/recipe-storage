import { refreshSession, useSessionStore } from "@/entities/session";
import { queryClient, setAuthAdapter } from "@/shared/api";

export function setupSession() {
  setAuthAdapter({
    getAccessToken: () => useSessionStore.getState().accessToken,
    refresh: refreshSession,
  });

  // Любой выход (кнопка, умерший refresh, выход в другой вкладке) очищает кэш запросов,
  // иначе следующий вошедший пользователь на секунду увидит данные предыдущего
  useSessionStore.subscribe((state, prev) => {
    if (prev.refreshToken && !state.refreshToken) queryClient.clear();
  });
}
