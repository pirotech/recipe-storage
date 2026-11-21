import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Tokens } from "../api/sessionApi";

type SessionState = {
  accessToken: string | null;
  refreshToken: string | null;
  setTokens: (tokens: Tokens) => void;
  clear: () => void;
};

const STORAGE_KEY = "session";

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      setTokens: ({ accessToken, refreshToken }) =>
        set({ accessToken, refreshToken }),
      clear: () => set({ accessToken: null, refreshToken: null }),
    }),
    { name: STORAGE_KEY }, // сохраняется в localStorage; функции в JSON не попадают
  ),
);

// Сессия жива, пока жив refresh-токен
export const useIsAuthenticated = () =>
  useSessionStore((s) => s.refreshToken !== null);

// Zustand не синхронизирует вкладки сам. Без этого вкладка со старым refresh-токеном
// после ротации в соседней вкладке получит 401 и разлогинит всех.
window.addEventListener("storage", (e) => {
  if (e.key === STORAGE_KEY) void useSessionStore.persist.rehydrate();
});
