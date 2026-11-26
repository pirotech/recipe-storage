import { api } from "@/shared/api";

type TokenResponseDto = { access_token: string; refresh_token: string };

type UserDto = {
  id: string;
  email: string | null;
  telegram_username: string | null;
  created_at: string;
};

type TelegramStartDto = { bot_url: string; poll_token: string };

type TelegramPollDto = {
  status: "pending" | "confirmed" | "expired";
  tokens: TokenResponseDto | null;
};

export type User = {
  id: string;
  email: string | null;
  telegramUsername: string | null;
  createdAt: string;
};

export type TelegramPoll =
  { status: "pending" | "expired" } | { status: "confirmed"; tokens: Tokens };

export type Tokens = { accessToken: string; refreshToken: string };

const toTokens = (dto: TokenResponseDto): Tokens => ({
  accessToken: dto.access_token,
  refreshToken: dto.refresh_token,
});

export const requestMagicLink = (email: string) =>
  api<{ message: string }>("/auth/magic-link", {
    method: "POST",
    body: { email },
    auth: false,
  });

export const verifyMagicLink = async (token: string) =>
  toTokens(
    await api<TokenResponseDto>("/auth/verify", {
      method: "POST",
      body: { token },
      auth: false,
    }),
  );

export const refreshTokens = async (refreshToken: string) =>
  toTokens(
    await api<TokenResponseDto>("/auth/refresh", {
      method: "POST",
      body: { refresh_token: refreshToken },
      auth: false,
    }),
  );

export const logoutRequest = (refreshToken: string) =>
  api<void>("/auth/logout", {
    method: "POST",
    body: { refresh_token: refreshToken },
    auth: false,
  });

export const startTelegramLogin = async () => {
  const dto = await api<TelegramStartDto>("/auth/telegram/start", {
    method: "POST",
    auth: false,
  });
  return { botUrl: dto.bot_url, pollToken: dto.poll_token };
};

export const pollTelegramLogin = async (
  pollToken: string,
): Promise<TelegramPoll> => {
  const dto = await api<TelegramPollDto>("/auth/telegram/poll", {
    method: "POST",
    body: { poll_token: pollToken },
    auth: false,
  });
  if (dto.status === "confirmed" && dto.tokens) {
    return { status: "confirmed", tokens: toTokens(dto.tokens) };
  }
  return { status: dto.status === "confirmed" ? "pending" : dto.status };
};

export const fetchMe = async (): Promise<User> => {
  const dto = await api<UserDto>("/auth/me");
  return {
    id: dto.id,
    email: dto.email,
    telegramUsername: dto.telegram_username,
    createdAt: dto.created_at,
  };
};
