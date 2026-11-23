import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { ApiError } from "@/shared/api";
import type { Recipe } from "@/entities/recipe";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  recipeFormSchema,
  toFormValues,
  toRecipeUpdate,
  type RecipeFormValues,
} from "../model/recipeForm";
import { useUpdateRecipe } from "../model/useUpdateRecipe";
import { IngredientsField } from "./IngredientsField";
import { StepsField } from "./StepsField";

type Props = {
  recipe: Recipe;
  onSaved: () => void;
  onCancel: () => void;
};

export function EditRecipeForm({ recipe, onSaved, onCancel }: Props) {
  // defaultValues читаются ОДИН раз, при первом рендере. Форма — локальная копия:
  // если в фоне придут свежие данные, набранный текст не затрётся.
  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: toFormValues(recipe),
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = form;

  const { mutate, isPending, error } = useUpdateRecipe(recipe.id);

  const onSubmit = handleSubmit((values) => {
    mutate(toRecipeUpdate(values), { onSuccess: onSaved });
  });

  const errorMessage =
    error instanceof ApiError && error.status === 404
      ? "Рецепт не найден: возможно, его удалили на другом устройстве."
      : error?.message;

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-8" noValidate>
        <section className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Название</Label>
            <Input id="title" {...register("title")} />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Ссылка на картинку</Label>
            <Input
              id="imageUrl"
              inputMode="url"
              placeholder="https://…"
              {...register("imageUrl")}
            />
            {errors.imageUrl && (
              <p className="text-sm text-destructive">
                {errors.imageUrl.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="servings">Порции</Label>
              <Input
                id="servings"
                placeholder="например, 4 порции"
                {...register("servings")}
              />
              {errors.servings && (
                <p className="text-sm text-destructive">
                  {errors.servings.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Время, минут</Label>
              <Input
                id="time"
                inputMode="numeric"
                {...register("totalTimeMinutes")}
              />
              {errors.totalTimeMinutes && (
                <p className="text-sm text-destructive">
                  {errors.totalTimeMinutes.message}
                </p>
              )}
            </div>
          </div>
        </section>

        <IngredientsField />
        <StepsField />

        {errorMessage && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3 border-t pt-6">
          <Button type="submit" disabled={isPending || !isDirty}>
            {isPending ? "Сохраняем…" : "Сохранить"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={onCancel}
          >
            Отмена
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
