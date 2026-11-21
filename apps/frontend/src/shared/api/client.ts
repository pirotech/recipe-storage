export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

type AuthAdapter = {
  getAccessToken: () => string | null;
  refresh: () => Promise<string | null>;
};
let authAdapter: AuthAdapter | null = null;
export function setAuthAdapter(adapter: AuthAdapter) {
  authAdapter = adapter;
}

const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:8000/api";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
};

async function send(
  path: string,
  options: RequestOptions,
  token: string | null,
) {
  const headers = new Headers();
  if (options.body !== undefined)
    headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  try {
    return await fetch(BASE_URL + path, {
      method: options.method ?? "GET",
      headers,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    // fetch бросает исключение только при сетевой ошибке, а не при 4xx/5xx
    throw new ApiError(0, "Нет соединения с сервером", "network_error");
  }
}

async function toApiError(res: Response): Promise<ApiError> {
  let message = "Что-то пошло не так";
  let code: string | undefined;
  try {
    const detail = (await res.json())?.detail;
    if (typeof detail === "string") message = detail;
    else if (Array.isArray(detail))
      message = "Проверьте введённые данные"; // 422
    else if (detail && typeof detail === "object") {
      message = detail.message ?? message;
      code = detail.code;
    }
  } catch {
    // тело не JSON — оставляем сообщение по умолчанию
  }
  return new ApiError(res.status, message, code);
}

export async function api<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const useAuth = options.auth ?? true;

  let res = await send(
    path,
    options,
    useAuth ? (authAdapter?.getAccessToken() ?? null) : null,
  );

  // Access-токен протух: обновляем и повторяем запрос ровно один раз
  if (res.status === 401 && useAuth && authAdapter) {
    const newToken = await authAdapter.refresh();
    if (newToken) res = await send(path, options, newToken);
  }

  if (!res.ok) throw await toApiError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
