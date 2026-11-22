import { Link, useNavigate, useParams } from "react-router";
import { useRecipe } from "@/entities/recipe";
import { EditRecipeForm } from "@/features/editRecipe";
import { ApiError } from "@/shared/api";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Skeleton } from "@/shared/ui/skeleton";

export function RecipeEditPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data: recipe, isPending, error } = useRecipe(id);

  const recipePath = `/recipes/${id}`;

  // Те же проверки, что и на RecipePage, и в том же порядке: сначала особые ошибки,
  // потом данные, потом загрузка. Дублирование оставляем сознательно и вынесем,
  // когда появится третья страница с тем же кодом.
  if (
    error instanceof ApiError &&
    (error.status === 404 || error.status === 422)
  ) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Link
          to="/"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← Все рецепты
        </Link>
        <p className="py-12 text-center text-muted-foreground">
          Рецепт не найден.
        </p>
      </div>
    );
  }

  if (recipe) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          to={recipePath}
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← К рецепту
        </Link>
        <h1 className="text-2xl font-semibold">Редактирование</h1>
        <EditRecipeForm
          recipe={recipe}
          // replace: после сохранения кнопка «назад» не должна возвращать в форму
          onSaved={() => navigate(recipePath, { replace: true })}
          onCancel={() => navigate(recipePath)}
        />
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Alert variant="destructive">
        <AlertDescription>
          {error?.message ?? "Не удалось загрузить рецепт"}
        </AlertDescription>
      </Alert>
    </div>
  );
}
