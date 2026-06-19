import { describe, it, expect } from "vitest";
import { playerReducer } from "../player-context";
import type { PlayerState, Song } from "@/types";

// 测试用歌曲数据
const songA: Song = { id: 1, name: "Song A", duration: 180000, ar: [{ id: 1, name: "Artist A" }], al: { id: 1, name: "Album A", picUrl: "" } };
const songB: Song = { id: 2, name: "Song B", duration: 240000, ar: [{ id: 2, name: "Artist B" }], al: { id: 2, name: "Album B", picUrl: "" } };
const songC: Song = { id: 3, name: "Song C", duration: 200000, ar: [{ id: 3, name: "Artist C" }], al: { id: 3, name: "Album C", picUrl: "" } };
const songD: Song = { id: 4, name: "Song D", duration: 160000, ar: [], al: undefined };

function makeState(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    currentSong: null,
    isPlaying: false,
    volume: 80,
    progress: 0,
    duration: 0,
    playMode: "sequential",
    playlist: [],
    currentIndex: -1,
    priorityQueue: [],
    ...overrides,
  };
}

describe("playerReducer", () => {
  // ==================== PLAY_SONG ====================
  describe("PLAY_SONG", () => {
    it("should add a new song to the playlist and start playing", () => {
      const state = makeState();
      const result = playerReducer(state, { type: "PLAY_SONG", song: songA });

      expect(result.currentSong).toBe(songA);
      expect(result.isPlaying).toBe(true);
      expect(result.playlist).toEqual([songA]);
      expect(result.currentIndex).toBe(0);
      expect(result.progress).toBe(0);
    });

    it("should jump to existing song if already in playlist", () => {
      const state = makeState({ playlist: [songA, songB, songC], currentIndex: 0, currentSong: songA });
      const result = playerReducer(state, { type: "PLAY_SONG", song: songC });

      expect(result.currentSong).toBe(songC);
      expect(result.currentIndex).toBe(2);
      expect(result.playlist).toEqual([songA, songB, songC]); // no duplicate
      expect(result.isPlaying).toBe(true);
      expect(result.progress).toBe(0);
    });

    it("should append song if not in playlist", () => {
      const state = makeState({ playlist: [songA], currentIndex: 0, currentSong: songA });
      const result = playerReducer(state, { type: "PLAY_SONG", song: songB });

      expect(result.currentSong).toBe(songB);
      expect(result.playlist).toEqual([songA, songB]);
      expect(result.currentIndex).toBe(1);
    });
  });

  // ==================== SET_PLAYLIST ====================
  describe("SET_PLAYLIST", () => {
    it("should set playlist and start from first song by default", () => {
      const state = makeState();
      const result = playerReducer(state, { type: "SET_PLAYLIST", songs: [songA, songB] });

      expect(result.playlist).toEqual([songA, songB]);
      expect(result.currentSong).toBe(songA);
      expect(result.currentIndex).toBe(0);
      expect(result.isPlaying).toBe(true);
      expect(result.progress).toBe(0);
    });

    it("should start from specified index", () => {
      const state = makeState();
      const result = playerReducer(state, { type: "SET_PLAYLIST", songs: [songA, songB], startIndex: 1 });

      expect(result.currentSong).toBe(songB);
      expect(result.currentIndex).toBe(1);
    });

    it("should handle empty playlist", () => {
      const state = makeState({ playlist: [songA], currentSong: songA });
      const result = playerReducer(state, { type: "SET_PLAYLIST", songs: [] });

      expect(result.playlist).toEqual([]);
      expect(result.currentSong).toBeNull();
      expect(result.currentIndex).toBe(0);
      expect(result.isPlaying).toBe(false);
    });
  });

  // ==================== TOGGLE_PLAY / PAUSE / PLAY ====================
  describe("TOGGLE_PLAY", () => {
    it("should toggle from paused to playing", () => {
      const state = makeState({ isPlaying: false });
      expect(playerReducer(state, { type: "TOGGLE_PLAY" }).isPlaying).toBe(true);
    });

    it("should toggle from playing to paused", () => {
      const state = makeState({ isPlaying: true });
      expect(playerReducer(state, { type: "TOGGLE_PLAY" }).isPlaying).toBe(false);
    });
  });

  describe("PAUSE", () => {
    it("should set isPlaying to false", () => {
      const state = makeState({ isPlaying: true });
      expect(playerReducer(state, { type: "PAUSE" }).isPlaying).toBe(false);
    });
  });

  describe("PLAY", () => {
    it("should set isPlaying to true", () => {
      const state = makeState({ isPlaying: false });
      expect(playerReducer(state, { type: "PLAY" }).isPlaying).toBe(true);
    });
  });

  // ==================== NEXT ====================
  describe("NEXT", () => {
    it("should go to next song in sequential mode", () => {
      const state = makeState({
        playlist: [songA, songB, songC],
        currentIndex: 0,
        currentSong: songA,
        playMode: "sequential",
      });
      const result = playerReducer(state, { type: "NEXT" });

      expect(result.currentSong).toBe(songB);
      expect(result.currentIndex).toBe(1);
      expect(result.isPlaying).toBe(true);
      expect(result.progress).toBe(0);
    });

    it("should wrap around at the end of playlist", () => {
      const state = makeState({
        playlist: [songA, songB, songC],
        currentIndex: 2,
        currentSong: songC,
        playMode: "sequential",
      });
      const result = playerReducer(state, { type: "NEXT" });

      expect(result.currentSong).toBe(songA);
      expect(result.currentIndex).toBe(0);
    });

    it("should return current state when playlist is empty", () => {
      const state = makeState();
      const result = playerReducer(state, { type: "NEXT" });
      expect(result).toBe(state);
    });

    it("should prioritize priority queue over normal playback", () => {
      const state = makeState({
        playlist: [songA, songB],
        currentIndex: 0,
        currentSong: songA,
        priorityQueue: [songC],
      });
      const result = playerReducer(state, { type: "NEXT" });

      expect(result.currentSong).toBe(songC);
      expect(result.priorityQueue).toEqual([]);
      // songC should be inserted after current index
      expect(result.playlist[result.currentIndex]).toBe(songC);
    });

    it("should handle multiple songs in priority queue", () => {
      const state = makeState({
        playlist: [songA, songB],
        currentIndex: 0,
        currentSong: songA,
        priorityQueue: [songC, songD],
      });
      const result = playerReducer(state, { type: "NEXT" });

      expect(result.currentSong).toBe(songC);
      expect(result.priorityQueue).toEqual([songD]);
    });

    it("should repeat current song in repeat-one mode", () => {
      const state = makeState({
        playlist: [songA, songB, songC],
        currentIndex: 1,
        currentSong: songB,
        playMode: "repeat-one",
      });
      const result = playerReducer(state, { type: "NEXT" });

      expect(result.currentSong).toBe(songB); // same song
      expect(result.currentIndex).toBe(1); // same index
      expect(result.playlist).toEqual([songA, songB, songC]); // playlist unchanged
      expect(result.isPlaying).toBe(true);
      expect(result.progress).toBe(0); // progress reset
    });
  });

  // ==================== PREV ====================
  describe("PREV", () => {
    it("should go to previous song in sequential mode", () => {
      const state = makeState({
        playlist: [songA, songB, songC],
        currentIndex: 2,
        currentSong: songC,
        playMode: "sequential",
      });
      const result = playerReducer(state, { type: "PREV" });

      expect(result.currentSong).toBe(songB);
      expect(result.currentIndex).toBe(1);
    });

    it("should wrap to last song when at the beginning", () => {
      const state = makeState({
        playlist: [songA, songB, songC],
        currentIndex: 0,
        currentSong: songA,
        playMode: "sequential",
      });
      const result = playerReducer(state, { type: "PREV" });

      expect(result.currentSong).toBe(songC);
      expect(result.currentIndex).toBe(2);
    });

    it("should return current state when playlist is empty", () => {
      const state = makeState();
      const result = playerReducer(state, { type: "PREV" });
      expect(result).toBe(state);
    });
  });

  // ==================== PLAY_NEXT ====================
  describe("PLAY_NEXT", () => {
    it("should add song to priority queue", () => {
      const state = makeState({ playlist: [songA], priorityQueue: [] });
      const result = playerReducer(state, { type: "PLAY_NEXT", song: songB });

      expect(result.priorityQueue).toEqual([songB]);
    });

    it("should append to existing priority queue", () => {
      const state = makeState({ priorityQueue: [songB] });
      const result = playerReducer(state, { type: "PLAY_NEXT", song: songC });

      expect(result.priorityQueue).toEqual([songB, songC]);
    });
  });

  // ==================== SET_VOLUME / SET_PROGRESS / SET_DURATION ====================
  describe("SET_VOLUME", () => {
    it("should set volume", () => {
      const state = makeState({ volume: 80 });
      expect(playerReducer(state, { type: "SET_VOLUME", volume: 50 }).volume).toBe(50);
    });

    it("should allow volume of 0", () => {
      const state = makeState({ volume: 80 });
      expect(playerReducer(state, { type: "SET_VOLUME", volume: 0 }).volume).toBe(0);
    });
  });

  describe("SET_PROGRESS", () => {
    it("should set progress", () => {
      const state = makeState({ progress: 0 });
      expect(playerReducer(state, { type: "SET_PROGRESS", progress: 42.5 }).progress).toBe(42.5);
    });
  });

  describe("SET_DURATION", () => {
    it("should set duration", () => {
      const state = makeState({ duration: 0 });
      expect(playerReducer(state, { type: "SET_DURATION", duration: 180 }).duration).toBe(180);
    });
  });

  // ==================== SET_PLAY_MODE ====================
  describe("SET_PLAY_MODE", () => {
    it("should switch to random mode", () => {
      const state = makeState({ playMode: "sequential" });
      expect(playerReducer(state, { type: "SET_PLAY_MODE", mode: "random" }).playMode).toBe("random");
    });

    it("should switch to sequential mode", () => {
      const state = makeState({ playMode: "random" });
      expect(playerReducer(state, { type: "SET_PLAY_MODE", mode: "sequential" }).playMode).toBe("sequential");
    });
  });

  // ==================== REMOVE_SONG ====================
  describe("REMOVE_SONG", () => {
    it("should remove a non-current song", () => {
      const state = makeState({
        playlist: [songA, songB, songC],
        currentIndex: 0,
        currentSong: songA,
      });
      const result = playerReducer(state, { type: "REMOVE_SONG", index: 1 });

      expect(result.playlist).toEqual([songA, songC]);
      expect(result.currentIndex).toBe(0);
      expect(result.currentSong).toBe(songA);
    });

    it("should adjust index when removing a song before current", () => {
      const state = makeState({
        playlist: [songA, songB, songC],
        currentIndex: 2,
        currentSong: songC,
      });
      const result = playerReducer(state, { type: "REMOVE_SONG", index: 0 });

      expect(result.playlist).toEqual([songB, songC]);
      expect(result.currentIndex).toBe(1);
      expect(result.currentSong).toBe(songC);
    });

    it("should handle removing the current song", () => {
      const state = makeState({
        playlist: [songA, songB, songC],
        currentIndex: 1,
        currentSong: songB,
      });
      const result = playerReducer(state, { type: "REMOVE_SONG", index: 1 });

      expect(result.playlist).toEqual([songA, songC]);
      expect(result.currentIndex).toBe(1);
      expect(result.currentSong).toBe(songC);
      expect(result.progress).toBe(0);
    });

    it("should handle removing the last song in playlist", () => {
      const state = makeState({
        playlist: [songA, songB, songC],
        currentIndex: 2,
        currentSong: songC,
      });
      const result = playerReducer(state, { type: "REMOVE_SONG", index: 2 });

      expect(result.playlist).toEqual([songA, songB]);
      expect(result.currentIndex).toBe(1);
      expect(result.currentSong).toBe(songB);
    });

    it("should handle removing the only song", () => {
      const state = makeState({
        playlist: [songA],
        currentIndex: 0,
        currentSong: songA,
      });
      const result = playerReducer(state, { type: "REMOVE_SONG", index: 0 });

      expect(result.playlist).toEqual([]);
      expect(result.currentIndex).toBe(-1);
      expect(result.currentSong).toBeNull();
    });
  });

  // ==================== REORDER_PLAYLIST ====================
  describe("REORDER_PLAYLIST", () => {
    it("should reorder songs in the playlist", () => {
      const state = makeState({
        playlist: [songA, songB, songC],
        currentIndex: 0,
        currentSong: songA,
      });
      const result = playerReducer(state, {
        type: "REORDER_PLAYLIST",
        fromIndex: 0,
        toIndex: 2,
      });

      expect(result.playlist.map((s) => s.id)).toEqual([2, 3, 1]);
      expect(result.currentIndex).toBe(2); // current song moved with its index
      expect(result.currentSong).toBe(songA);
    });

    it("should update currentIndex when current song is moved", () => {
      const state = makeState({
        playlist: [songA, songB, songC],
        currentIndex: 1,
        currentSong: songB,
      });
      const result = playerReducer(state, {
        type: "REORDER_PLAYLIST",
        fromIndex: 1,
        toIndex: 0,
      });

      expect(result.playlist.map((s) => s.id)).toEqual([2, 1, 3]);
      expect(result.currentIndex).toBe(0);
      expect(result.currentSong).toBe(songB);
    });

    it("should adjust currentIndex when a song before current is moved after it", () => {
      const state = makeState({
        playlist: [songA, songB, songC],
        currentIndex: 2,
        currentSong: songC,
      });
      const result = playerReducer(state, {
        type: "REORDER_PLAYLIST",
        fromIndex: 0,
        toIndex: 2,
      });

      expect(result.playlist.map((s) => s.id)).toEqual([2, 3, 1]);
      expect(result.currentIndex).toBe(1); // shifted left by 1
    });

    it("should adjust currentIndex when a song after current is moved before it", () => {
      const state = makeState({
        playlist: [songA, songB, songC],
        currentIndex: 0,
        currentSong: songA,
      });
      const result = playerReducer(state, {
        type: "REORDER_PLAYLIST",
        fromIndex: 2,
        toIndex: 0,
      });

      expect(result.playlist.map((s) => s.id)).toEqual([3, 1, 2]);
      expect(result.currentIndex).toBe(1); // shifted right by 1
    });

    it("should return same state for same index", () => {
      const state = makeState({
        playlist: [songA, songB],
        currentIndex: 0,
      });
      const result = playerReducer(state, {
        type: "REORDER_PLAYLIST",
        fromIndex: 1,
        toIndex: 1,
      });
      expect(result).toBe(state);
    });

    it("should return same state for out of bounds indices", () => {
      const state = makeState({ playlist: [songA, songB] });
      expect(playerReducer(state, { type: "REORDER_PLAYLIST", fromIndex: -1, toIndex: 0 })).toBe(state);
      expect(playerReducer(state, { type: "REORDER_PLAYLIST", fromIndex: 0, toIndex: 5 })).toBe(state);
    });
  });

  // ==================== HYDRATE_STATE ====================
  describe("HYDRATE_STATE", () => {
    it("should merge saved state and force isPlaying to false", () => {
      const state = makeState();
      const saved = {
        currentSong: songA,
        playlist: [songA, songB],
        currentIndex: 1,
        volume: 60,
        playMode: "random" as const,
      };
      const result = playerReducer(state, { type: "HYDRATE_STATE", state: saved });

      expect(result.currentSong).toBe(songA);
      expect(result.playlist).toEqual([songA, songB]);
      expect(result.currentIndex).toBe(1);
      expect(result.volume).toBe(60);
      expect(result.playMode).toBe("random");
      expect(result.isPlaying).toBe(false); // always false on hydrate
    });

    it("should preserve existing fields not in saved state", () => {
      const state = makeState({ volume: 50, progress: 42 });
      const result = playerReducer(state, { type: "HYDRATE_STATE", state: { currentSong: songA } });

      expect(result.currentSong).toBe(songA);
      expect(result.volume).toBe(50); // preserved
      expect(result.progress).toBe(42); // preserved
    });
  });
});
