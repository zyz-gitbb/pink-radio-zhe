import { describe, it, expect } from "vitest";
import { formatTime } from "../utils";

describe("formatTime utils", () => {
  it("should format milliseconds into mm:ss correctly", () => {
    expect(formatTime(0)).toBe("00:00");
    expect(formatTime(9000)).toBe("00:09");
    expect(formatTime(60000)).toBe("01:00");
    expect(formatTime(125000)).toBe("02:05");
    expect(formatTime(3599000)).toBe("59:59");
  });

  it("should handle NaN or negative values gracefully", () => {
    // 假设 formatTime 目前实现是 NaN 返回 '00:00'
    expect(formatTime(NaN)).toBe("00:00");
    expect(formatTime(-1)).toBe("00:00");
  });
});
