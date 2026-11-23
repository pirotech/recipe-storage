import {
  AMOUNT_SOURCE,
  formatAmount,
  parseAmount,
  type Amount,
  type AmountStyle,
} from "./amount";

/**
 * Единицы измерения, после которых число считается количеством.
 * Для других языков достаточно дописать сюда новые варианты.
 */
const UNITS: { pattern: string; style: AmountStyle }[] = [
  { pattern: "кг\\.?|килограмм\\p{L}*", style: "metric" },
  { pattern: "г\\.?|гр\\.?|грамм\\p{L}*", style: "metric" },
  { pattern: "мл\\.?|миллилитр\\p{L}*", style: "metric" },
  { pattern: "л\\.?|литр\\p{L}*", style: "metric" },
  {
    pattern:
      "ст\\.?\\s*л\\.?|ст\\.?\\s*ложк\\p{L}*|столов\\p{L}*\\s+ложк\\p{L}*",
    style: "household",
  },
  {
    pattern:
      "ч\\.?\\s*л\\.?|ч\\.?\\s*ложк\\p{L}*|чайн\\p{L}*\\s+ложк\\p{L}*",
    style: "household",
  },
  {
    pattern:
      "стакан\\p{L}*|шт\\.?|штук\\p{L}*|щепот\\p{L}*|зубч\\p{L}*|пучк\\p{L}*|пучок|" +
      "банк\\p{L}*|пакет\\p{L}*|пачк\\p{L}*|кус(?:о|к)\\p{L}*|ломтик\\p{L}*|" +
      "долек|долька|дольк\\p{L}*|веточк\\p{L}*|лист(?:а|ов|ик\\p{L}*)|головк\\p{L}*|" +
      "кочан\\p{L}*|капл\\p{L}*|горст\\p{L}*|упаковк\\p{L}*|бутылк\\p{L}*|кубик\\p{L}*|" +
      "пластин\\p{L}*",
    style: "household",
  },
];

const WITH_UNIT = new RegExp(
  `(?<![\\p{L}\\d])(${AMOUNT_SOURCE})(\\s*)(${UNITS.map((u) => `(${u.pattern})`).join("|")})(?!\\p{L})`,
  "giu",
);

// Число без единицы считаем количеством только в начале строки («2 яйца») или после
// разделителя («Лук - 1 средняя», «Мука: 200»). Иначе «Мука 1 сорта» превратится
// в «Мука 2 сорта».
const BARE = new RegExp(
  `(?:^\\s*|\\s[-–—]\\s*|:\\s*)(${AMOUNT_SOURCE})(?![\\p{L}\\d%°]|[.,]\\d)`,
  "giu",
);

// Количество словами. Мы не умеем его пересчитывать, поэтому такая строка «неизвестная».
const WORD_QUANTITY = new RegExp(
  "(?<!\\p{L})(?:пол|полстакана|полтора|полторы|половин\\p{L}*|четверть|пара|пару|пары|" +
    "несколько|один|одна|одно|одну|два|две|три|четыре|пять|шесть|семь|восемь|девять|десять)" +
    "(?!\\p{L})",
  "iu",
);

export type Quantity = {
  /** Позиции числа в исходной строке. Единица измерения остаётся нетронутой. */
  start: number;
  end: number;
  amount: Amount;
  style: AmountStyle;
};

export type ParsedIngredient =
  /** Нашли количества и ничего не осталось неразобранным: можно пересчитывать. */
  | { kind: "scalable"; raw: string; quantities: Quantity[] }
  /** Чисел нет вовсе («соль по вкусу»): пересчитывать нечего, строка остаётся как есть. */
  | { kind: "static"; raw: string }
  /** Числа есть, а разобрать до конца не удалось: пересчёт дал бы неверный результат. */
  | { kind: "unknown"; raw: string };

function unitStyle(groups: readonly (string | undefined)[]): AmountStyle {
  // Группы единиц идут после трёх групп: число, пробелы, вся единица.
  const index = groups.slice(4).findIndex((g) => g !== undefined);
  return UNITS[index]?.style ?? "household";
}

function overlaps(quantities: Quantity[], start: number, end: number): boolean {
  return quantities.some((q) => start < q.end && end > q.start);
}

/** Есть ли в строке число, которое не вошло ни в одно количество и не выглядит безобидным. */
function hasStrayNumber(raw: string, quantities: Quantity[]): boolean {
  for (const m of raw.matchAll(/\d+|[½⅓⅔¼¾⅛]/gu)) {
    const start = m.index;
    const end = start + m[0].length;
    if (overlaps(quantities, start, end)) continue;
    const before = raw.slice(0, start);
    const after = raw.slice(end);
    if (/\p{L}$/u.test(before)) continue; // «С1», «B12»
    if (/\p{L}-$/u.test(before)) continue; // «Омега-3»
    if (/^\s*[%°]/u.test(after)) continue; // «20%», «180°»
    if (/^\s*сорт/iu.test(after)) continue; // «1 сорта»
    return true;
  }
  return false;
}

export function parseIngredient(raw: string): ParsedIngredient {
  const quantities: Quantity[] = [];

  for (const m of raw.matchAll(WITH_UNIT)) {
    const amount = parseAmount(m[1]);
    if (!amount) return { kind: "unknown", raw };
    quantities.push({
      start: m.index,
      end: m.index + m[1].length,
      amount,
      style: unitStyle(m),
    });
  }

  for (const m of raw.matchAll(BARE)) {
    const end = m.index + m[0].length;
    const start = end - m[1].length;
    if (overlaps(quantities, start, end)) continue;
    const amount = parseAmount(m[1]);
    if (!amount) return { kind: "unknown", raw };
    quantities.push({ start, end, amount, style: "household" });
  }

  quantities.sort((a, b) => a.start - b.start);

  if (WORD_QUANTITY.test(raw) || hasStrayNumber(raw, quantities)) {
    return { kind: "unknown", raw };
  }
  return quantities.length > 0
    ? { kind: "scalable", raw, quantities }
    : { kind: "static", raw };
}

/** Строка ингредиента в `factor` раз больше. Без изменений, если пересчитать нельзя. */
export function scaleIngredient(
  parsed: ParsedIngredient,
  factor: number,
): string {
  if (parsed.kind !== "scalable" || factor === 1) return parsed.raw;
  let result = parsed.raw;
  // С конца к началу, чтобы замена не сдвигала позиции остальных чисел.
  for (const q of [...parsed.quantities].reverse()) {
    result =
      result.slice(0, q.start) +
      formatAmount(q.amount, factor, q.style) +
      result.slice(q.end);
  }
  return result;
}

/**
 * Можно ли показывать выбор количества: есть что пересчитывать и нет ни одной строки,
 * которую пересчитать нельзя. Иначе часть ингредиентов тихо осталась бы прежней.
 */
export function canScale(ingredients: ParsedIngredient[]): boolean {
  return (
    ingredients.some((i) => i.kind === "scalable") &&
    ingredients.every((i) => i.kind !== "unknown")
  );
}
