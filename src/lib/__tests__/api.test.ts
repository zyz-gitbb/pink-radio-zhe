import { describe, it, expect } from "vitest";
import { normalizeSong, ApiError } from "../api";

describe("normalizeSong", () => {
  it("should handle community API format (ar/al/dt)", () => {
    const raw = {
      id: 123,
      name: "Test Song",
      dt: 180000,
      ar: [{ id: 1, name: "Artist" }],
      al: { id: 1, name: "Album", picUrl: "https://example.com/cover.jpg" },
    };
    const result = normalizeSong(raw);

    expect(result.id).toBe(123);
    expect(result.name).toBe("Test Song");
    expect(result.duration).toBe(180000);
    expect(result.ar).toEqual([{ id: 1, name: "Artist" }]);
    expect(result.al).toEqual({ id: 1, name: "Album", picUrl: "https://example.com/cover.jpg" });
  });

  it("should handle official API format (artists/album/duration)", () => {
    const raw = {
      id: 456,
      name: "Official Song",
      duration: 240000,
      artists: [{ id: 2, name: "Official Artist" }],
      album: { id: 2, name: "Official Album", picUrl: "https://example.com/official.jpg" },
    };
    const result = normalizeSong(raw);

    expect(result.duration).toBe(240000);
    expect(result.ar).toEqual([{ id: 2, name: "Official Artist" }]);
    expect(result.al).toEqual({ id: 2, name: "Official Album", picUrl: "https://example.com/official.jpg" });
  });

  it("should prefer duration over dt, ar over artists, al over album when both exist", () => {
    const raw = {
      id: 789,
      name: "Mixed",
      dt: 100000,
      duration: 200000,
      ar: [{ id: 1, name: "Short Artist" }],
      artists: [{ id: 2, name: "Long Artist" }],
      al: { id: 1, name: "Short Album", picUrl: "a" },
      album: { id: 2, name: "Long Album", picUrl: "b" },
    };
    const result = normalizeSong(raw);

    // `||` chain: s.duration || s.dt — first truthy wins
    expect(result.duration).toBe(200000); // duration wins (first in || chain)
    expect(result.ar).toEqual([{ id: 1, name: "Short Artist" }]); // ar wins
    expect(result.al?.name).toBe("Short Album"); // al wins
  });

  it("should default duration to 0 when missing", () => {
    const raw = { id: 1, name: "No Duration" };
    const result = normalizeSong(raw);
    expect(result.duration).toBe(0);
  });

  it("should default ar to empty array when missing", () => {
    const raw = { id: 1, name: "No Artists" };
    const result = normalizeSong(raw);
    expect(result.ar).toEqual([]);
  });

  it("should default al to undefined when missing", () => {
    const raw = { id: 1, name: "No Album" };
    const result = normalizeSong(raw);
    expect(result.al).toBeUndefined();
  });

  it("should use top-level picUrl as album picUrl fallback", () => {
    const raw = {
      id: 1,
      name: "Song",
      picUrl: "https://p1.music.126.net/cover.jpg",
      album: { id: 1, name: "Album" },
    };
    const result = normalizeSong(raw);
    expect(result.al?.picUrl).toBe("https://p1.music.126.net/cover.jpg");
  });

  it("should prefer album.picUrl over top-level picUrl", () => {
    const raw = {
      id: 1,
      name: "Song",
      picUrl: "https://p1.music.126.net/top-level.jpg",
      album: { id: 1, name: "Album", picUrl: "https://p1.music.126.net/album.jpg" },
    };
    const result = normalizeSong(raw);
    expect(result.al?.picUrl).toBe("https://p1.music.126.net/album.jpg");
  });

  it("should create album object from top-level picUrl when no album exists", () => {
    const raw = {
      id: 1,
      name: "Song",
      picUrl: "https://p1.music.126.net/cover.jpg",
    };
    const result = normalizeSong(raw);
    expect(result.al).toEqual({ id: 0, name: "", picUrl: "https://p1.music.126.net/cover.jpg" });
  });

  it("should preserve extra fields", () => {
    const raw = {
      id: 1,
      name: "Song",
      dt: 100000,
      ar: [],
      al: undefined,
      someExtraField: "preserved",
    };
    const result = normalizeSong(raw);
    expect((result as any).someExtraField).toBe("preserved");
  });
});

describe("ApiError", () => {
  it("should create error with correct properties", () => {
    const error = new ApiError(429, "Too Many Requests", true);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(429);
    expect(error.message).toBe("Too Many Requests");
    expect(error.retryable).toBe(true);
    expect(error.name).toBe("ApiError");
  });

  it("should have a stack trace", () => {
    const error = new ApiError(500, "Server Error", false);
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain("ApiError");
  });

  it("should work with non-retryable errors", () => {
    const error = new ApiError(404, "Not Found", false);
    expect(error.retryable).toBe(false);
  });
});
