import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  MAX_SCALE,
  MIN_SCALE,
  SCALE_PRESETS,
  parseScale,
} from "../model/parseScale";

type Props = {
  value: number;
  onChange: (value: number) => void;
};

const formatScale = (n: number) => String(n).replace(".", ",");

export function ScaleControl({ value, onChange }: Props) {
  // Текст в поле «своё значение» живёт отдельно от value: пока его набирают,
  // он может быть неполным («1,») и не должен сбрасывать выбранный множитель.
  const [draft, setDraft] = useState("");
  const hasDraft = draft.trim() !== "";
  const invalid = hasDraft && parseScale(draft) === null;

  return (
    <div className="space-y-2">
      <div
        role="group"
        aria-label="Во сколько раз изменить количество"
        className="flex flex-wrap items-center gap-2"
      >
        {SCALE_PRESETS.map((preset) => {
          const active = !hasDraft && value === preset;
          return (
            <Button
              key={preset}
              type="button"
              size="sm"
              variant={active ? "default" : "outline"}
              aria-pressed={active}
              onClick={() => {
                setDraft("");
                onChange(preset);
              }}
            >
              ×{formatScale(preset)}
            </Button>
          );
        })}
        <Input
          inputMode="decimal"
          placeholder="Своё"
          aria-label="Своё значение множителя"
          aria-invalid={invalid}
          value={draft}
          className={
            hasDraft && !invalid ? "w-24 border-primary" : "w-24"
          }
          onChange={(e) => {
            const text = e.target.value;
            setDraft(text);
            if (text.trim() === "") {
              onChange(1);
              return;
            }
            const parsed = parseScale(text);
            if (parsed !== null) onChange(parsed);
          }}
        />
      </div>
      {invalid && (
        <p className="text-sm text-destructive">
          Число от {formatScale(MIN_SCALE)} до {MAX_SCALE}
        </p>
      )}
      {value !== 1 && !invalid && (
        <p className="text-sm text-muted-foreground">
          Количества в шагах приготовления не меняются.
        </p>
      )}
    </div>
  );
}
