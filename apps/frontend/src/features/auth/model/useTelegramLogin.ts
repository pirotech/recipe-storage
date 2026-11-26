import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  pollTelegramLogin,
  startTelegramLogin,
  useSessionStore,
} from "@/entities/session";

export function useTelegramLogin() {
  const setTokens = useSessionStore((s) => s.setTokens);

  // щаг 1: просим сервер начать вход, он возвращает ссылку на бота и секрет для опроса
  const start = useMutation({ mutationFn: startTelegramLogin });
  const pollToken = start.data?.pollToken ?? null;

  // щаг 3: раз в 2 секунды спрашиваем сервер, подтвердил ли пользователь вход в боте
  const poll = useQuery({
    queryKey: ["telegram-login", pollToken],
    queryFn: () => pollTelegramLogin(pollToken!),
    enabled: pollToken !== null,
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === "confirmed" || s === "expired" ? false : 2000;
    },
    refetchIntervalInBackground: true,
    retry: false,
    gcTime: 0, // ответ содержит токены: не держим его в кэше
  });

  // сервер подтвердил: сохраняем токены
  // дальше GuestOnly сам перекинет на главную
  useEffect(() => {
    if (poll.data?.status === "confirmed") setTokens(poll.data.tokens);
  }, [poll.data, setTokens]);

  return {
    start,
    status: poll.data?.status ?? "pending",
    reset: start.reset, // сбрасывает pollToken, и опрос останавливается
  };
}
