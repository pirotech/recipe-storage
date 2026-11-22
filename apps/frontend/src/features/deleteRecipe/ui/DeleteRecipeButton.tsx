import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog'
import { Button } from '@/shared/ui/button'
import { useDeleteRecipe } from '../model/useDeleteRecipe'

type Props = {
  recipeId: string
  recipeTitle: string
  // Фича не знает про роутер: куда идти после удаления, решает страница
  onDeleted: () => void
}

export function DeleteRecipeButton({ recipeId, recipeTitle, onDeleted }: Props) {
  const [open, setOpen] = useState(false)
  const { mutate, isPending, error, reset } = useDeleteRecipe()

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Удалить рецепт
      </Button>

      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          if (isPending) return // во время запроса диалог не закрываем
          setOpen(next)
          if (!next) reset() // старая ошибка не должна показываться при следующем открытии
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить рецепт?</AlertDialogTitle>
            <AlertDialogDescription>
              «{recipeTitle}» будет удалён без возможности восстановления.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <p className="text-sm text-destructive">{error.message}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Отмена</AlertDialogCancel>
            {/* Обычная кнопка, а не AlertDialogAction: та закрывает диалог по клику,
                а нам нужно держать его открытым на время запроса и при ошибке */}
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => mutate(recipeId, { onSuccess: onDeleted })}
            >
              {isPending ? 'Удаляем…' : 'Удалить'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
