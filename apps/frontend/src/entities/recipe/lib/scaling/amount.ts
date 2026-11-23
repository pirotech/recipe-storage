// Числа в рецептах: «2», «1,5», «1/2», «1 1/2», «½», «1½», а также диапазоны «2-3».

const VULGAR: Record<string, number> = {
  "½": 1 / 2,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "¼": 1 / 4,
  "¾": 3 / 4,
  "⅛": 1 / 8,
};
const VULGAR_CLASS = "[½⅓⅔¼¾⅛]";

// Порядок вариантов важен: сначала самые длинные («1 1/2» раньше «1»).
const SINGLE = [
  `\\d+\\s*${VULGAR_CLASS}`,
  `\\d+\\s+\\d+/\\d+`,
  `\\d+/\\d+`,
  VULGAR_CLASS,
  `\\d+(?:[.,]\\d+)?`,
].join("|");

const RANGE_SEPARATOR = "\\s*[-–—]\\s*";

/** Фрагмент регулярного выражения: число или диапазон. Без групп захвата. */
export const AMOUNT_SOURCE = `(?:${SINGLE})(?:${RANGE_SEPARATOR}(?:${SINGLE}))?`;

export type Amount = {
  low: number;
  /** Верхняя граница диапазона («2-3»), иначе null. */
  high: number | null;
  /** Исходный разделитель диапазона вместе с пробелами, чтобы вернуть его как был. */
  separator: string;
};

function parseSingle(text: string): number {
  const s = text.trim();
  let m = /^(\d+)\s*([½⅓⅔¼¾⅛])$/u.exec(s);
  if (m) return Number(m[1]) + VULGAR[m[2]];
  m = /^(\d+)\s+(\d+)\/(\d+)$/.exec(s);
  if (m) return Number(m[1]) + Number(m[2]) / Number(m[3]);
  m = /^(\d+)\/(\d+)$/.exec(s);
  if (m) return Number(m[1]) / Number(m[2]);
  if (s in VULGAR) return VULGAR[s];
  return Number(s.replace(",", "."));
}

/** Разбирает текст, найденный по AMOUNT_SOURCE. null, если число некорректно («1/0»). */
export function parseAmount(text: string): Amount | null {
  const range = /^(.+?)(\s*[-–—]\s*)(.+)$/u.exec(text.trim());
  const low = parseSingle(range ? range[1] : text);
  const high = range ? parseSingle(range[3]) : null;
  if (!Number.isFinite(low) || (high !== null && !Number.isFinite(high))) {
    return null;
  }
  return { low, high, separator: range ? range[2] : "" };
}

/**
 * metric: граммы, литры и т. п. Показываем десятичным числом.
 * household: ложки, штуки, стаканы. Привычнее дроби: «1½ ст. л.», а не «1,5».
 */
export type AmountStyle = "metric" | "household";

const FRACTIONS: [number, string][] = [
  [0, ""],
  [1 / 4, "¼"],
  [1 / 3, "⅓"],
  [1 / 2, "½"],
  [2 / 3, "⅔"],
  [3 / 4, "¾"],
  [1, ""],
];
const FRACTION_TOLERANCE = 0.03;

function toFraction(value: number): string | null {
  const whole = Math.floor(value);
  const rest = value - whole;
  for (const [target, symbol] of FRACTIONS) {
    if (Math.abs(rest - target) >= FRACTION_TOLERANCE) continue;
    const total = target === 1 ? whole + 1 : whole;
    if (total === 0 && symbol === "") return null; // слишком мало, пусть покажет десятичное
    return `${total > 0 ? total : ""}${symbol}`;
  }
  return null;
}

function toDecimal(value: number): string {
  const digits = value >= 10 ? 0 : value >= 1 ? 1 : 2;
  let s = value.toFixed(digits);
  if (s.includes(".")) s = s.replace(/\.?0+$/, "");
  if (s === "0" || s === "") s = value.toPrecision(1); // совсем малые значения не округляем до нуля
  return s.replace(".", ",");
}

export function formatNumber(value: number, style: AmountStyle): string {
  if (style === "household") {
    const fraction = toFraction(value);
    if (fraction !== null) return fraction;
  }
  return toDecimal(value);
}

export function formatAmount(
  amount: Amount,
  factor: number,
  style: AmountStyle,
): string {
  const low = formatNumber(amount.low * factor, style);
  if (amount.high === null) return low;
  return `${low}${amount.separator}${formatNumber(amount.high * factor, style)}`;
}
