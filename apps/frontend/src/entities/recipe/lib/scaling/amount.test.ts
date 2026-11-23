import { describe, expect, it } from "vitest";
import { formatAmount, formatNumber, parseAmount } from "./amount";

describe("parseAmount", () => {
  it.each([
    ["2", 2],
    ["1,5", 1.5],
    ["0.25", 0.25],
    ["1/2", 0.5],
    ["1 1/2", 1.5],
    ["½", 0.5],
    ["1½", 1.5],
    ["1 ½", 1.5],
  ])("%s → %s", (text, low) => {
    expect(parseAmount(text)).toEqual({ low, high: null, separator: "" });
  });

  it("разбирает диапазон и запоминает разделитель", () => {
    expect(parseAmount("2-3")).toEqual({ low: 2, high: 3, separator: "-" });
    expect(parseAmount("1 – 1½")).toEqual({
      low: 1,
      high: 1.5,
      separator: " – ",
    });
  });

  it("возвращает null для деления на ноль", () => {
    expect(parseAmount("1/0")).toBeNull();
  });
});

describe("formatNumber", () => {
  it.each([
    [1.5, "metric", "1,5"],
    [3, "metric", "3"],
    [225, "metric", "225"],
    [49.5, "metric", "50"],
    [0.375, "metric", "0,38"],
    [1.5, "household", "1½"],
    [0.5, "household", "½"],
    [2.25, "household", "2¼"],
    [0.75, "household", "¾"],
    [1 / 3, "household", "⅓"],
    [2, "household", "2"],
    [2.99, "household", "3"],
    [2.4, "household", "2,4"],
    [12.5, "household", "12½"],
  ] as const)("%s (%s) → %s", (value, style, expected) => {
    expect(formatNumber(value, style)).toBe(expected);
  });
});

describe("formatAmount", () => {
  it("умножает обе границы диапазона", () => {
    expect(
      formatAmount({ low: 2, high: 3, separator: "-" }, 2, "household"),
    ).toBe("4-6");
  });
});
