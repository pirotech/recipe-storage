import { useMutation } from "@tanstack/react-query";
import { logoutRequest, useSessionStore } from "@/entities/session";

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      const { refreshToken } = useSessionStore.getState();
      if (refreshToken) await logoutRequest(refreshToken);
    },
    // Выходим локально в любом случае, даже если сервер недоступен
    onSettled: () => useSessionStore.getState().clear(),
  });
}
