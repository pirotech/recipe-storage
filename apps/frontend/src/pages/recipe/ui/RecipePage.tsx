import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  RecipeDetails,
  canScaleRecipe,
  useRecipe,
  type Recipe,
} from "@/entities/recipe";
import { DeleteRecipeButton } from "@/features/deleteRecipe";
import { ScaleControl } from "@/features/scaleRecipe";
import { ApiError } from "@/shared/api";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Skeleton } from "@/shared/ui/skeleton";
import { buttonVariants } from "@/shared/ui/button";

const backLink = (
  <Link
    to="/"
    className="text-sm text-muted-foreground underline-offset-4 hover:underline"
  >
    ← Все рецепты
  </Link>
);

function RecipeView({ recipe }: { recipe: Recipe }) {
  const navigate = useNavigate();
  const [scale, setScale] = useState(1);
  // Выбор количества показываем, только если все строки с числами удалось разобрать
  const scalable = useMemo(() => canScaleRecipe(recipe), [recipe]);

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        {backLink}
        <Link
          to={`/recipes/${recipe.id}/edit`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Редактировать
        </Link>
      </div>
      <RecipeDetails
        recipe={recipe}
        // Если после правки рецепт перестал пересчитываться, возвращаем исходные количества
        scale={scalable ? scale : 1}
        scaleControl={
          scalable ? <ScaleControl value={scale} onChange={setScale} /> : null
        }
      />
      <div className="border-t pt-6">
        <DeleteRecipeButton
          recipeId={recipe.id}
          recipeTitle={recipe.title}
          // replace: удалённая страница уходит из истории, и кнопка «назад» не вернёт на неё
          onDeleted={() => navigate("/", { replace: true })}
        />
      </div>
    </article>
  );
}

export function RecipePage() {
  const { id = "" } = useParams();
  const { data: recipe, isPending, error } = useRecipe(id);

  // 404 — нет такого рецепта, 422 — в адресе не UUID (например, /recipes/123)
  if (
    error instanceof ApiError &&
    (error.status === 404 || error.status === 422)
  ) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        {backLink}
        <p className="py-12 text-center text-muted-foreground">
          Рецепт не найден.
        </p>
      </div>
    );
  }

  // Сначала проверяем data, а не error: если рецепт взят из кэша, а фоновое обновление
  // упало (например, пропала сеть), пользователь всё равно должен видеть рецепт
  if (recipe) {
    // key: при переходе на другой рецепт выбранный множитель не переносится
    return <RecipeView key={recipe.id} recipe={recipe} />;
  }

  if (isPending) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="aspect-video w-full" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {backLink}
      <Alert variant="destructive">
        <AlertDescription>
          {error?.message ?? "Не удалось загрузить рецепт"}
        </AlertDescription>
      </Alert>
    </div>
  );
}
