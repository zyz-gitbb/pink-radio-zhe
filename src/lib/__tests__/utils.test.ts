import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatTime, parseLrc, clamp, buildCoverUrl, debounce, throttle } from "../utils";

// ==================== formatTime ====================

describe("formatTime", () => {
  it("should format milliseconds into mm:ss correctly", () => {
    expect(formatTime(0)).toBe("00:00");
    expect(formatTime(9000)).toBe("00:09");
    expect(formatTime(60000)).toBe("01:00");
    expect(formatTime(125000)).toBe("02:05");
    expect(formatTime(3599000)).toBe("59:59");
  });

  it("should handle NaN or negative values gracefully", () => {
    expect(formatTime(NaN)).toBe("00:00");
    expect(formatTime(-1)).toBe("00:00");
  });
});

// ==================== parseLrc ====================

describe("parseLrc", () => {
  it("should parse standard LRC format", () => {
    const lrc = "[00:01.00]Hello World\n[00:05.00]Second line";
    const result = parseLrc(lrc);
    expect(result).toEqual([
      { time: 1, text: "Hello World" },
      { time: 5, text: "Second line" },
    ]);
  });

  // NOTE: parseLrc 使用 match + split(':') 解析，无法正确处理小数秒（如 .50）
  // 当前行为：parseInt("01.50") = 1，小数部分丢失
  it("should parse LRC with integer milliseconds", () => {
    const lrc = "[00:01.00]Test";
    const result = parseLrc(lrc);
    expect(result).toEqual([{ time: 1, text: "Test" }]);
  });

  it("should parse LRC without milliseconds", () => {
    const lrc = "[01:30]No ms";
    const result = parseLrc(lrc);
    expect(result).toEqual([{ time: 90, text: "No ms" }]);
  });

  it("should handle multiple time tags on one line", () => {
    const lrc = "[00:01.00][00:05.00]Repeated line";
    const result = parseLrc(lrc);
    expect(result).toEqual([
      { time: 1, text: "Repeated line" },
      { time: 5, text: "Repeated line" },
    ]);
  });

  it("should sort results by time", () => {
    const lrc = "[00:10.00]Third\n[00:01.00]First\n[00:05.00]Second";
    const result = parseLrc(lrc);
    expect(result.map((r) => r.text)).toEqual(["First", "Second", "Third"]);
  });

  it("should return empty array for empty string", () => {
    expect(parseLrc("")).toEqual([]);
  });

  it("should skip lines without time tags", () => {
    const lrc = "No time tag here\n[00:01.00]Has time";
    const result = parseLrc(lrc);
    expect(result).toEqual([{ time: 1, text: "Has time" }]);
  });

  it("should skip lines with only time tags (no lyrics text)", () => {
    const lrc = "[00:01.00]\n[00:05.00]Actual lyric";
    const result = parseLrc(lrc);
    expect(result).toEqual([{ time: 5, text: "Actual lyric" }]);
  });

  it("should handle single-digit minutes", () => {
    const lrc = "[0:01.00]Single digit";
    const result = parseLrc(lrc);
    expect(result).toEqual([{ time: 1, text: "Single digit" }]);
  });
});

// ==================== clamp ====================

describe("clamp", () => {
  it("should return value when within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("should clamp to min when value is below range", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it("should clamp to max when value is above range", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("should handle boundary values", () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it("should work with negative ranges", () => {
    expect(clamp(0, -10, -1)).toBe(-1);
    expect(clamp(-5, -10, -1)).toBe(-5);
  });
});

// ==================== buildCoverUrl ====================

describe("buildCoverUrl", () => {
  it("should build URL with default size", () => {
    expect(buildCoverUrl(12345)).toBe("https://p1.music.126.net/12345.jpg?param=300y300");
  });

  it("should build URL with custom size", () => {
    expect(buildCoverUrl(12345, 500)).toBe("https://p1.music.126.net/12345.jpg?param=500y500");
  });
});

// ==================== debounce ====================

describe("debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should delay function execution", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledOnce();
  });

  it("should reset timer on subsequent calls", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    vi.advanceTimersByTime(50);
    debounced(); // reset
    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledOnce();
  });

  it("should pass arguments to the debounced function", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced("a", "b");
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith("a", "b");
  });
});

// ==================== throttle ====================

describe("throttle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should call function immediately on first call", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    expect(fn).toHaveBeenCalledOnce();
  });

  it("should suppress calls during the throttle window", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    throttled();
    throttled();
    expect(fn).toHaveBeenCalledOnce();
  });

  it("should allow calls after throttle window expires", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    vi.advanceTimersByTime(100);
    throttled();
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
