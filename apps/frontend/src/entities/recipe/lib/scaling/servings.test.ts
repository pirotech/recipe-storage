import { describe, expect, it } from "vitest";
import { scaleServings } from "./servings";

describe("scaleServings", () => {
  it.each([
    ["4 порции", 2, "8 порций"],
    ["4 порции", 1.5, "6 порций"],
    ["1 порция", 2, "2 порции"],
    ["2 порции", 2.5, "5 порций"],
    ["10 порций", 2.5, "25 порций"],
    ["10 порций", 1.1, "11 порций"],
    ["3 порции", 0.5, "1½ порции"],
    ["4-6 порций", 2, "8-12 порций"],
    ["Порции: 4", 2.5, "Порции: 10"],
    ["Порций: 2", 3, "Порций: 6"],
    ["6 шт.", 0.5, "3 шт."],
    ["Выход: 500 г", 2, "Выход: 1000 г"],
    ["4 servings", 2, "8 servings"],
  ])("%s ×%s → %s", (raw, factor, expected) => {
    expect(scaleServings(raw, factor)).toBe(expected);
  });

  it("возвращает строку как есть, если множитель 1 или числа нет", () => {
    expect(scaleServings("4 порции", 1)).toBe("4 порции");
    expect(scaleServings("На компанию", 2)).toBe("На компанию");
    expect(scaleServings("", 2)).toBe("");
  });
});
