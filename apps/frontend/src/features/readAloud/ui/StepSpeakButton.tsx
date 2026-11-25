import { Square, Volume2 } from "lucide-react";
import { Button } from "@/shared/ui/button";

type Props = { active: boolean; onClick: () => void };

export function StepSpeakButton({ active, onClick }: Props) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-pressed={active}
      aria-label={active ? "Остановить чтение" : "Прочитать шаг вслух"}
      onClick={onClick}
    >
      {active ? <Square /> : <Volume2 />}
    </Button>
  );
}
