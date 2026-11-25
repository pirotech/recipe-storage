import { useState } from "react";
import { ApiError } from "@/shared/api";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { useUpdateNotes } from "../model/useUpdateNotes";

const MAX_LENGTH = 10_000;

type Props = {
  recipeId: string;
  notes: string | null;
};

export function RecipeNotes({ recipeId, notes }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const { mutate, isPending, error, reset } = useUpdateNotes(recipeId);

  const startEditing = () => {
    setDraft(notes ?? "");
    setEditing(true);
  };

  const cancel = () => {
    reset();
    setEditing(false);
  };

  const save = () => {
    mutate(draft, { onSuccess: () => setEditing(false) });
  };

  const errorMessage =
    error instanceof ApiError && error.status === 404
      ? "Рецепт не найден: возможно, его удалили на другом устройстве."
      : error?.message;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Заметки</h2>
        {!editing && (
          <Button variant="outline" size="sm" onClick={startEditing}>
            {notes ? "Изменить" : "Добавить"}
          </Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={MAX_LENGTH}
            rows={5}
            autoFocus
            placeholder="Что поменять в следующий раз, чем заменить ингредиент…"
            aria-label="Заметки к рецепту"
          />
          {errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <div className="flex gap-3">
            <Button
              onClick={save}
              disabled={isPending || draft === (notes ?? "")}
            >
              {isPending ? "Сохраняем…" : "Сохранить"}
            </Button>
            <Button variant="outline" onClick={cancel} disabled={isPending}>
              Отмена
            </Button>
          </div>
        </div>
      ) : notes ? (
        // whitespace-pre-wrap: переносы строк из заметки сохраняются
        <p className="whitespace-pre-wrap break-words">{notes}</p>
      ) : (
        <p className="text-muted-foreground">Заметок пока нет</p>
      )}
    </section>
  );
}
