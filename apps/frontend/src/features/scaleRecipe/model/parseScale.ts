export const SCALE_PRESETS = [0.5, 1, 1.5, 2, 2.5, 3] as const;
export const MIN_SCALE = 0.1;
export const MAX_SCALE = 100;

/** Множитель из текста поля: «2», «1,5», «0.5». null, если это не число из допустимого диапазона. */
export function parseScale(text: string): number | null {
  const trimmed = text.trim();
  if (!/^\d+(?:[.,]\d+)?$/.test(trimmed)) return null;
  const value = Number(trimmed.replace(",", "."));
  return value >= MIN_SCALE && value <= MAX_SCALE ? value : null;
}
