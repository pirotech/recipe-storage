import { RemoteImage } from '@/shared/ui/remote-image'
import type { Recipe } from '../api/recipeApi'
import { formatDate } from '../lib/formatDate'
import { formatMinutes } from '../lib/formatMinutes'
import { hostname } from '../lib/hostname'

export function RecipeDetails({ recipe }: { recipe: Recipe }) {
  const meta = [
    recipe.totalTimeMinutes != null && formatMinutes(recipe.totalTimeMinutes),
    recipe.servings,
    `Добавлен ${formatDate(recipe.createdAt)}`,
  ].filter(Boolean)

  return (
    <div className="space-y-8">
      <RemoteImage
        src={recipe.imageUrl}
        className="aspect-video w-full rounded-xl object-cover"
      />

      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{recipe.title}</h1>
        <p className="text-sm text-muted-foreground">{meta.join(' · ')}</p>
        <a
          href={recipe.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Источник: {hostname(recipe.sourceUrl)}
        </a>
      </header>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Ингредиенты</h2>
        {recipe.ingredients.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5">
            {/* Индекс как key допустим: список не переставляется и не редактируется на лету */}
            {recipe.ingredients.map((ingredient, i) => (
              <li key={i}>{ingredient.raw}</li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">Не указаны</p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Приготовление</h2>
        {recipe.steps.length > 0 ? (
          <ol className="space-y-5">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {i + 1}
                </span>
                <div className="space-y-3">
                  <p>{step.text}</p>
                  <RemoteImage src={step.imageUrl} className="rounded-lg" />
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-muted-foreground">Не указано</p>
        )}
      </section>
    </div>
  )
}
