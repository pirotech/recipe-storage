import { AMOUNT_SOURCE, formatNumber, parseAmount } from "./amount";

const FIRST_AMOUNT = new RegExp(
  `(?<![\\p{L}\\d])(${AMOUNT_SOURCE})(?![\\p{L}\\d]|[.,]\\d)`,
  "iu",
);
const PORTION_WORD = /^(\s*)(порци\p{L}*)/iu;

function portionWord(n: number): string {
  if (!Number.isInteger(n)) return "порции";
  const mod100 = n % 100;
  const mod10 = n % 10;
  if (mod100 >= 11 && mod100 <= 14) return "порций";
  if (mod10 === 1) return "порция";
  if (mod10 >= 2 && mod10 <= 4) return "порции";
  return "порций";
}

/**
 * Пересчитывает первое число в строке порций («4 порции», «4-6 порций», «Выход: 6 шт.»).
 * Если числа нет или множитель 1, возвращает строку как есть. Слово «порция» ставит в
 * правильную форму («6 порций», а не «6 порции»).
 */
export function scaleServings(servings: string, factor: number): string {
  if (factor === 1) return servings;
  const match = FIRST_AMOUNT.exec(servings);
  if (!match) return servings;
  const amount = parseAmount(match[1]);
  if (!amount) return servings;

  const low = formatNumber(amount.low * factor, "household");
  const high =
    amount.high === null
      ? null
      : formatNumber(amount.high * factor, "household");
  const scaled = high === null ? low : `${low}${amount.separator}${high}`;

  const start = match.index;
  let tail = servings.slice(start + match[1].length);

  const word = PORTION_WORD.exec(tail);
  if (word) {
    const last = Math.round((amount.high ?? amount.low) * factor * 100) / 100;
    let form = portionWord(last);
    if (/^\p{Lu}/u.test(word[2])) form = form[0].toUpperCase() + form.slice(1);
    tail = word[1] + form + tail.slice(word[0].length);
  }
  return servings.slice(0, start) + scaled + tail;
}
