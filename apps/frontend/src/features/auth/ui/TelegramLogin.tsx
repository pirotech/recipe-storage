import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button, buttonVariants } from "@/shared/ui/button";
import { useTelegramLogin } from "../model/useTelegramLogin";

export function TelegramLogin() {
  const { start, status, reset } = useTelegramLogin();

  if (start.data && status === "expired") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Время вышло или вход уже использован.
        </p>
        <Button className="w-full" onClick={reset}>
          Попробовать снова
        </Button>
      </div>
    );
  }

  if (start.data) {
    return (
      <div className="space-y-4">
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Откройте бота и нажмите Start.</li>
          <li>В чате нажмите «Подтвердить».</li>
          <li>Вернитесь сюда, страница обновится сама.</li>
        </ol>
        <a
          href={start.data.botUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ className: "w-full" })}
        >
          Открыть Telegram
        </a>
        <Button variant="ghost" className="w-full" onClick={reset}>
          Отмена
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Бот Telegram подтвердит вход. Почта не нужна.
      </p>
      {start.error && (
        <Alert variant="destructive">
          <AlertDescription>{start.error.message}</AlertDescription>
        </Alert>
      )}
      <Button
        className="w-full"
        disabled={start.isPending}
        onClick={() => start.mutate()}
      >
        {start.isPending ? "Готовим вход…" : "Войти через Telegram"}
      </Button>
    </div>
  );
}
