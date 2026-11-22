import { z } from "zod";
import type { Recipe, RecipeUpdate } from "@/entities/recipe";

function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export const recipeFormSchema = z.object({
  title: z.string().trim().min(1, "Введите название"),
  imageUrl: z
    .string()
    .trim()
    .refine((v) => v === "" || isHttpUrl(v), "Нужна ссылка вида https://…"),
  servings: z.string().trim().max(100, "Не больше 100 символов"),
  totalTimeMinutes: z
    .string()
    .trim()
    .regex(/^\d{0,6}$/, "Целое число минут, до 6 цифр"),
  ingredients: z.array(
    z.object({
      raw: z.string().trim().min(1, "Заполните строку или удалите её"),
    }),
  ),
  steps: z.array(
    z.object({
      text: z.string().trim().min(1, "Опишите шаг или удалите его"),
      imageUrl: z.string(), // в форме не редактируется, едет скрытым полем
    }),
  ),
});

export type RecipeFormValues = z.infer<typeof recipeFormSchema>;

export function toFormValues(recipe: Recipe): RecipeFormValues {
  return {
    title: recipe.title,
    imageUrl: recipe.imageUrl ?? "",
    servings: recipe.servings ?? "",
    totalTimeMinutes: recipe.totalTimeMinutes?.toString() ?? "",
    ingredients: recipe.ingredients.map((i) => ({ raw: i.raw })),
    steps: recipe.steps.map((s) => ({
      text: s.text,
      imageUrl: s.imageUrl ?? "",
    })),
  };
}

export function toRecipeUpdate(
  values: RecipeFormValues,
  original: Recipe,
): RecipeUpdate {
  // У ингредиента кроме строки raw есть разобранные name/amount/unit. Править их руками мы не
  // даём, но терять не хотим. Если строка не менялась, возвращаем исходный разбор. Если её
  // изменили, разбор устарел («2 свеклы» → «3 свеклы», а amount всё ещё 2), и честнее его
  // обнулить, чем хранить неверные данные.
  const parsedByRaw = new Map(
    original.ingredients.map((i) => [i.raw.trim(), i]),
  );

  return {
    title: values.title,
    imageUrl: values.imageUrl || null,
    servings: values.servings || null,
    totalTimeMinutes:
      values.totalTimeMinutes === "" ? null : Number(values.totalTimeMinutes),
    ingredients: values.ingredients.map(({ raw }) => {
      const parsed = parsedByRaw.get(raw);
      return parsed
        ? { ...parsed, raw }
        : { raw, name: null, amount: null, unit: null };
    }),
    steps: values.steps.map((s) => ({
      text: s.text,
      imageUrl: s.imageUrl || null,
    })),
  };
}
