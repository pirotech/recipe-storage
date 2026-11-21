import { useState } from 'react'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useRequestMagicLink } from '../model/useRequestMagicLink'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const { mutate, isPending, isSuccess, error, reset } = useRequestMagicLink()

  if (isSuccess) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Проверьте почту</CardTitle>
          <CardDescription>
            Мы отправили ссылку для входа на {email}. Она действует 15 минут и работает один раз.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="ghost" onClick={reset}>
            Указать другой email
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Вход в Recipes</CardTitle>
        <CardDescription>Отправим ссылку для входа на почту. Пароль не нужен.</CardDescription>
      </CardHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          mutate(email.trim())
        }}
      >
        <CardContent className="space-y-4">
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
        </CardContent>
        <CardFooter className="mt-6">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Отправляем…' : 'Получить ссылку'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
