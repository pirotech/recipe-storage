import { useState } from "react";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { EmailLoginForm } from "./EmailLoginForm";
import { TelegramLogin } from "./TelegramLogin";

type Method = "telegram" | "email";

export function LoginForm() {
  const [method, setMethod] = useState<Method>("telegram");

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Вход в Recipes</CardTitle>
        <CardDescription>
          Пароль не нужен. Выберите, как войти или зарегистрироваться.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={method === "telegram" ? "default" : "outline"}
            onClick={() => setMethod("telegram")}
          >
            Telegram
          </Button>
          <Button
            type="button"
            variant={method === "email" ? "default" : "outline"}
            onClick={() => setMethod("email")}
          >
            Email
          </Button>
        </div>
        {method === "telegram" ? <TelegramLogin /> : <EmailLoginForm />}
      </CardContent>
    </Card>
  );
}
