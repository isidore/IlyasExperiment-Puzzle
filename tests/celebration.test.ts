import { describe, expect, it } from "vitest";
import { formatTime } from "../src/celebration";

describe("formatTime", () => {
  it("shows minutes and zero-padded seconds", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(7)).toBe("0:07");
    expect(formatTime(167)).toBe("2:47");
    expect(formatTime(600)).toBe("10:00");
  });

  it("rounds to whole seconds", () => {
    expect(formatTime(59.6)).toBe("1:00");
  });
});
