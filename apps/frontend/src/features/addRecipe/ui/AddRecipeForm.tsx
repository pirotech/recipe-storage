import { useState } from 'react'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { useAddRecipe } from '../model/useAddRecipe'

export function AddRecipeForm() {
  const [url, setUrl] = useState('')
  const { mutate, reset, isPending, isIdle, data, error } = useAddRecipe()

  return (
    <div className="space-y-3">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          mutate(url.trim(), { onSuccess: () => setUrl('') })
        }}
      >
        <Input
          type="url"
          inputMode="url"
          required
          aria-label="Ссылка на рецепт"
          placeholder="Вставьте ссылку на рецепт https://…"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value)
            if (!isIdle && !isPending) reset() // убираем старое сообщение, когда пользователь печатает
          }}
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Импортируем…' : 'Добавить'}
        </Button>
      </form>

      {isPending && (
        <p className="text-sm text-muted-foreground">
          Загружаем страницу и разбираем рецепт, это может занять несколько секунд.
        </p>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}
      {data && (
        <p className="text-sm text-muted-foreground">
          {data.created
            ? `Добавлено: ${data.recipe.title}`
            : `Этот рецепт уже в вашей коллекции: ${data.recipe.title}`}
        </p>
      )}
    </div>
  )
}
