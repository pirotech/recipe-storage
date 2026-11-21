import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import type { Recipe } from '../api/recipeApi'
import { formatMinutes } from '../lib/formatMinutes'

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  // Картинка живёт на чужом сайте и может не загрузиться: показываем заглушку
  const [imageFailed, setImageFailed] = useState(false)

  const meta = [
    recipe.totalTimeMinutes != null && formatMinutes(recipe.totalTimeMinutes),
    recipe.servings,
    `Ингредиентов: ${recipe.ingredients.length}`,
  ].filter(Boolean)

  return (
    <Card className="h-full overflow-hidden pt-0">
      {recipe.imageUrl && !imageFailed ? (
        <img
          src={recipe.imageUrl}
          alt=""
          loading="lazy"
          // Часть сайтов блокирует картинки по заголовку Referer (защита от хотлинка)
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
          className="aspect-video w-full object-cover"
        />
      ) : (
        <div className="aspect-video w-full bg-muted" />
      )}
      <CardHeader>
        <CardTitle className="line-clamp-2 text-base">{recipe.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-muted-foreground">
        <p>{meta.join(' · ')}</p>
        <a
          href={recipe.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="block truncate underline-offset-4 hover:underline"
        >
          {hostname(recipe.sourceUrl)}
        </a>
      </CardContent>
    </Card>
  )
}
