import { describe, it, expect } from "vitest";
import {
  getSongArtists,
  getSongAlbum,
  getSongCoverUrl,
  getSongArtistNames,
  getSongAlbumName,
} from "../index";
import type { Song } from "../index";

describe("getSongArtists", () => {
  it("should return ar when present", () => {
    const song: Song = {
      id: 1,
      name: "Test",
      duration: 0,
      ar: [{ id: 1, name: "A1" }],
      artists: [{ id: 2, name: "A2" }],
    };
    expect(getSongArtists(song)).toEqual([{ id: 1, name: "A1" }]);
  });

  it("should fallback to artists when ar is missing", () => {
    const song: Song = {
      id: 1,
      name: "Test",
      duration: 0,
      artists: [{ id: 2, name: "A2" }],
    };
    expect(getSongArtists(song)).toEqual([{ id: 2, name: "A2" }]);
  });

  it("should return empty array when neither exists", () => {
    const song: Song = { id: 1, name: "Test", duration: 0 };
    expect(getSongArtists(song)).toEqual([]);
  });
});

describe("getSongAlbum", () => {
  it("should return al when present", () => {
    const song: Song = {
      id: 1,
      name: "Test",
      duration: 0,
      al: { id: 1, name: "Album A", picUrl: "a.jpg" },
      album: { id: 2, name: "Album B", picUrl: "b.jpg" },
    };
    expect(getSongAlbum(song)?.name).toBe("Album A");
  });

  it("should fallback to album when al is missing", () => {
    const song: Song = {
      id: 1,
      name: "Test",
      duration: 0,
      album: { id: 2, name: "Album B", picUrl: "b.jpg" },
    };
    expect(getSongAlbum(song)?.name).toBe("Album B");
  });

  it("should return undefined when neither exists", () => {
    const song: Song = { id: 1, name: "Test", duration: 0 };
    expect(getSongAlbum(song)).toBeUndefined();
  });
});

describe("getSongCoverUrl", () => {
  it("should return al.picUrl when present", () => {
    const song: Song = {
      id: 1,
      name: "Test",
      duration: 0,
      al: { id: 1, name: "", picUrl: "https://cdn.com/cover.jpg" },
    };
    expect(getSongCoverUrl(song)).toBe("https://cdn.com/cover.jpg");
  });

  it("should fallback to album.picUrl", () => {
    const song: Song = {
      id: 1,
      name: "Test",
      duration: 0,
      album: { id: 1, name: "", picUrl: "https://cdn.com/album.jpg" },
    };
    expect(getSongCoverUrl(song)).toBe("https://cdn.com/album.jpg");
  });

  it("should fallback to coverUrl field", () => {
    const song: Song = {
      id: 1,
      name: "Test",
      duration: 0,
      coverUrl: "https://cdn.com/fallback.jpg",
    };
    expect(getSongCoverUrl(song)).toBe("https://cdn.com/fallback.jpg");
  });

  it("should return default cover when nothing is available", () => {
    const song: Song = { id: 1, name: "Test", duration: 0 };
    expect(getSongCoverUrl(song)).toBe("/default-cover.svg");
  });
});

describe("getSongArtistNames", () => {
  it("should join multiple artist names with comma", () => {
    const song: Song = {
      id: 1,
      name: "Test",
      duration: 0,
      ar: [
        { id: 1, name: "Artist A" },
        { id: 2, name: "Artist B" },
      ],
    };
    expect(getSongArtistNames(song)).toBe("Artist A, Artist B");
  });

  it("should return single artist name", () => {
    const song: Song = {
      id: 1,
      name: "Test",
      duration: 0,
      ar: [{ id: 1, name: "Solo" }],
    };
    expect(getSongArtistNames(song)).toBe("Solo");
  });

  it("should return fallback text when no artists", () => {
    const song: Song = { id: 1, name: "Test", duration: 0 };
    expect(getSongArtistNames(song)).toBe("未知艺术家");
  });
});

describe("getSongAlbumName", () => {
  it("should return album name when available", () => {
    const song: Song = {
      id: 1,
      name: "Test",
      duration: 0,
      al: { id: 1, name: "My Album", picUrl: "" },
    };
    expect(getSongAlbumName(song)).toBe("My Album");
  });

  it("should return fallback text when no album", () => {
    const song: Song = { id: 1, name: "Test", duration: 0 };
    expect(getSongAlbumName(song)).toBe("未知专辑");
  });
});
