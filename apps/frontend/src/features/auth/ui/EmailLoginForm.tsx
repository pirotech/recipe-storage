import { useState } from "react";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useRequestMagicLink } from "../model/useRequestMagicLink";

export function EmailLoginForm() {
  const [email, setEmail] = useState("");
  const { mutate, isPending, isSuccess, error, reset } = useRequestMagicLink();

  if (isSuccess) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Мы отправили ссылку для входа на {email}. Она действует 15 минут и
          работает один раз.
        </p>
        <Button variant="ghost" onClick={reset}>
          Указать другой email
        </Button>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        mutate(email.trim());
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Отправляем…" : "Получить ссылку"}
      </Button>
    </form>
  );
}
