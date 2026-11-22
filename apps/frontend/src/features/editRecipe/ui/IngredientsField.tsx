import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import type { RecipeFormValues } from "../model/recipeForm";

export function IngredientsField() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<RecipeFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "ingredients",
  });

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Ингредиенты</h2>
      <ul className="space-y-2">
        {fields.map((field, index) => {
          const message = errors.ingredients?.[index]?.raw?.message;
          return (
            <li key={field.id} className="space-y-1">
              <div className="flex gap-2">
                <Input
                  aria-label={`Ингредиент ${index + 1}`}
                  {...register(`ingredients.${index}.raw`)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Удалить ингредиент ${index + 1}`}
                  onClick={() => remove(index)}
                >
                  <Trash2 />
                </Button>
              </div>
              {message && <p className="text-sm text-destructive">{message}</p>}
            </li>
          );
        })}
      </ul>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ raw: "" })}
      >
        <Plus /> Добавить ингредиент
      </Button>
    </section>
  );
}
