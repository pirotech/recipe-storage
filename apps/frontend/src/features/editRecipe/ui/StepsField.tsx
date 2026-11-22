import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import type { RecipeFormValues } from "../model/recipeForm";

export function StepsField() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<RecipeFormValues>();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "steps",
  });

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Приготовление</h2>
      <ol className="space-y-4">
        {fields.map((field, index) => {
          const message = errors.steps?.[index]?.text?.message;
          return (
            <li key={field.id} className="space-y-1">
              <div className="flex gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {index + 1}
                </span>
                <Textarea
                  rows={3}
                  aria-label={`Шаг ${index + 1}`}
                  {...register(`steps.${index}.text`)}
                />
                {/* Картинку шага не редактируем, но она должна доехать до PATCH вместе с шагом */}
                <input type="hidden" {...register(`steps.${index}.imageUrl`)} />
                <div className="flex flex-col">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Поднять шаг ${index + 1}`}
                    disabled={index === 0}
                    onClick={() => move(index, index - 1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Опустить шаг ${index + 1}`}
                    disabled={index === fields.length - 1}
                    onClick={() => move(index, index + 1)}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Удалить шаг ${index + 1}`}
                    onClick={() => remove(index)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
              {message && (
                <p className="pl-9 text-sm text-destructive">{message}</p>
              )}
            </li>
          );
        })}
      </ol>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ text: "", imageUrl: "" })}
      >
        <Plus /> Добавить шаг
      </Button>
    </section>
  );
}
