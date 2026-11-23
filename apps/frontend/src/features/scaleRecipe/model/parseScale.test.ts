import { describe, expect, it } from "vitest";
import { parseScale } from "./parseScale";

describe("parseScale", () => {
  it.each([
    ["2", 2],
    [" 1,5 ", 1.5],
    ["0.5", 0.5],
    ["0,1", 0.1],
    ["100", 100],
  ])("%s → %s", (text, expected) => {
    expect(parseScale(text)).toBe(expected);
  });

  it.each(["", "abc", "0", "0,05", "101", "-2", "1e2", "1,2,3", "2x"])(
    "%j → null",
    (text) => {
      expect(parseScale(text)).toBeNull();
    },
  );
});
