import { RecipeCard, useRecipes } from '@/entities/recipe'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

const gridClass = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'

export function RecipeList() {
  const { data, isPending, isError, error, refetch, isRefetching } = useRecipes()

  if (isPending) {
    return (
      <div className={gridClass}>
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex items-center justify-between gap-4">
          {error.message}
          <Button variant="outline" size="sm" disabled={isRefetching} onClick={() => refetch()}>
            Повторить
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (data.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        Пока ничего нет. Вставьте ссылку на рецепт в поле выше.
      </p>
    )
  }

  return (
    <ul className={gridClass}>
      {data.map((recipe) => (
        <li key={recipe.id}>
          <RecipeCard recipe={recipe} />
        </li>
      ))}
    </ul>
  )
}
