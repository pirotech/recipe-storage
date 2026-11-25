type Forms = readonly [one: string, few: string, many: string];

// Формы: 1 / 2–4 / 5+. «1 столовую ложку» — винительный, как в инструкции «добавьте 1 ст. л.»
const UNITS: Record<string, Forms> = {
  мин: ["минута", "минуты", "минут"],
  сек: ["секунда", "секунды", "секунд"],
  ч: ["час", "часа", "часов"],
  кг: ["килограмм", "килограмма", "килограммов"],
  г: ["грамм", "грамма", "граммов"],
  л: ["литр", "литра", "литров"],
  мл: ["миллилитр", "миллилитра", "миллилитров"],
  шт: ["штука", "штуки", "штук"],
};
const SPOONS: Record<string, Forms> = {
  ст: ["столовую ложку", "столовые ложки", "столовых ложек"],
  ч: ["чайную ложку", "чайные ложки", "чайных ложек"],
};
const DEGREES: Forms = ["градус", "градуса", "градусов"];
const PERCENT: Forms = ["процент", "процента", "процентов"];

const NUM = String.raw`(\d+(?:[.,]\d+)?(?:/\d+)?)`;
// \b не работает с кириллицей, поэтому «после аббревиатуры не должно идти буквы»
const END = String.raw`(?![\p{L}])`;

const SPOON_RE = new RegExp(`${NUM}\\s*(ст|ч)\\.?\\s*л\\.?${END}`, "giu");
const SPOON_BARE_RE = new RegExp(
  `(?<![\\p{L}])(ст|ч)\\.?\\s*л\\.${END}`,
  "giu",
);
const UNIT_RE = new RegExp(
  `${NUM}\\s*(${Object.keys(UNITS).join("|")})\\.?${END}`,
  "giu",
);
const DEGREE_RE = new RegExp(`${NUM}\\s*°\\s*([CСcс])?${END}`, "gu");
const PERCENT_RE = new RegExp(`${NUM}\\s*%`, "g");
const RANGE_RE = /(\d)\s*[-–—]\s*(\d)/g;

function plural(num: string, [one, few, many]: Forms): string {
  // Дроби и десятичные: «1,5 часа», «1/2 литра» — форма как у 2–4
  if (!/^\d+$/.test(num)) return few;
  const n = Number(num);
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

/** Раскрывает сокращения, которые синтезатор речи читает по буквам или неверно. */
export function normalizeForSpeech(text: string): string {
  return (
    text
      .replace(RANGE_RE, "$1 или $2")
      // Ложки раньше единиц: иначе «ч.» из «ч. л.» примется за часы
      .replace(
        SPOON_RE,
        (_, n: string, kind: string) =>
          `${n} ${plural(n, SPOONS[kind.toLowerCase()])}`,
      )
      .replace(SPOON_BARE_RE, (_, kind: string) =>
        kind.toLowerCase() === "ст" ? "столовая ложка" : "чайная ложка",
      )
      .replace(
        DEGREE_RE,
        (_, n: string, c?: string) =>
          `${n} ${plural(n, DEGREES)}${c ? " Цельсия" : ""}`,
      )
      .replace(
        UNIT_RE,
        (_, n: string, unit: string) =>
          `${n} ${plural(n, UNITS[unit.toLowerCase()])}`,
      )
      .replace(PERCENT_RE, (_, n: string) => `${n} ${plural(n, PERCENT)}`)
      .replace(/\s+/g, " ")
      .trim()
  );
}

/** Делит на предложения: длинные реплики Chrome обрывает примерно на 15 секундах. */
export function splitSentences(text: string): string[] {
  // Точка внутри числа («1.5») не делит: после неё нет пробела
  return text.split(/(?<=[.!?…])\s+/).filter(Boolean);
}
