import { api } from "@/shared/api";

// DTO — это то, что приходит с бэкенда (snake_case). Наружу отдаём camelCase,
// чтобы остальной код не зависел от формата API.
type TokenResponseDto = { access_token: string; refresh_token: string };
type UserDto = { id: string; email: string; created_at: string };

export type Tokens = { accessToken: string; refreshToken: string };
export type User = { id: string; email: string; createdAt: string };

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

export const fetchMe = async (): Promise<User> => {
  const dto = await api<UserDto>("/auth/me");
  return { id: dto.id, email: dto.email, createdAt: dto.created_at };
};
