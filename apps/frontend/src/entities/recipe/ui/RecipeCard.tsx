import { Link } from 'react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { RemoteImage } from '@/shared/ui/remote-image'
import type { Recipe } from '../api/recipeApi'
import { formatMinutes } from '../lib/formatMinutes'
import { hostname } from '../lib/hostname'

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const meta = [
    recipe.totalTimeMinutes != null && formatMinutes(recipe.totalTimeMinutes),
    recipe.servings,
    `Ингредиентов: ${recipe.ingredients.length}`,
  ].filter(Boolean)

  return (
    <Card className="relative h-full overflow-hidden pt-0 transition-colors hover:bg-accent/40">
      <RemoteImage
        src={recipe.imageUrl}
        className="aspect-video w-full object-cover"
        fallback={<div className="aspect-video w-full bg-muted" />}
      />
      <CardHeader>
        <CardTitle className="line-clamp-2 text-base">
          {/* «Растянутая ссылка»: псевдоэлемент after накрывает всю карточку (она relative),
              поэтому кликабельна вся карточка, а вложенных <a> нет */}
          <Link to={`/recipes/${recipe.id}`} className="after:absolute after:inset-0">
            {recipe.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-muted-foreground">
        <p>{meta.join(' · ')}</p>
        {/* relative z-10 поднимает ссылку над растянутым слоем, и она остаётся отдельно кликабельной */}
        <a
          href={recipe.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="relative z-10 block truncate underline-offset-4 hover:underline"
        >
          {hostname(recipe.sourceUrl)}
        </a>
      </CardContent>
    </Card>
  )
}
