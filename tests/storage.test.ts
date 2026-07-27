import { describe, expect, it, vi } from "vitest";
import { LEGACY_STORAGE_PREFIX, PREVIOUS_STORAGE_PREFIX, STORAGE_PREFIX } from "../src/game/systems/ProductIdentitySystem";
import {
  StorageSystem,
  type StorageLike,
  type TokenLogSentenceObservation
} from "../src/game/systems/StorageSystem";

const RECENT_TOKEN_LOG_KEY = `${STORAGE_PREFIX}.recent-token-log`;
const HAPTIC_PREFERENCE_KEY = `${STORAGE_PREFIX}.haptics-preference`;
const HIGH_SCORE_KEY = `${STORAGE_PREFIX}.high-score`;
const PREVIOUS_HIGH_SCORE_KEY = `${PREVIOUS_STORAGE_PREFIX}.high-score`;
const LEGACY_HIGH_SCORE_KEY = `${LEGACY_STORAGE_PREFIX}.high-score`;
const HIGH_SCORE_KEYS = [HIGH_SCORE_KEY, PREVIOUS_HIGH_SCORE_KEY, LEGACY_HIGH_SCORE_KEY];
const MUTED_KEY = `${STORAGE_PREFIX}.muted`;
const TRAINING_PROGRESS_KEY = `${STORAGE_PREFIX}.training-progress`;
const TUTORIAL_QUALIFICATION_KEY = `${STORAGE_PREFIX}.tutorial-qualification`;

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

class ThrowingStorage implements StorageLike {
  getItem(): string | null {
    throw new Error("storage unavailable");
  }

  setItem(): void {
    throw new Error("storage unavailable");
  }
}

class WriteThrowingStorage implements StorageLike {
  private readonly values: Map<string, string>;

  constructor(entries: Iterable<readonly [string, string]> = []) {
    this.values = new Map(entries);
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(): void {
    throw new Error("storage write unavailable");
  }

  removeItem(_key: string): void {
    throw new Error("storage write unavailable");
  }
}

function sentenceObservation(
  text: string,
  successful = true,
  fixtureId = "simple_001",
  tokenId = 100
): TokenLogSentenceObservation {
  return {
    fixtureId,
    text,
    successful,
    tokenStrings: [text],
    tokenIds: [tokenId]
  };
}

describe("StorageSystem", () => {
  it("saves and loads a high score", () => {
    const storage = new StorageSystem(new MemoryStorage());
    const candidate = {
      rounds: 8,
      balance: 4.25,
      accuracy: 0.72,
      rank: "Prompt Intake Associate"
    };

    const result = storage.saveHighScore(candidate);

    expect(result).toEqual({
      status: "saved",
      achieved: { ...candidate, updatedAt: expect.any(String) },
      persisted: { ...candidate, updatedAt: expect.any(String) }
    });
    expect(result.persisted).toEqual(result.achieved);
    expect(storage.loadHighScore()).toEqual(result.achieved);
  });

  it("replaces an existing high score with a better candidate", () => {
    const memory = new MemoryStorage();
    const storage = new StorageSystem(memory);
    storage.saveHighScore({ rounds: 4, balance: 20, accuracy: 1, rank: "Junior Boundary Clerk" });

    const result = storage.saveHighScore({
      rounds: 10,
      balance: 0,
      accuracy: 0.6,
      rank: "BPE Adjacent"
    });

    expect(result.status).toBe("saved");
    expect(result.achieved.rounds).toBe(10);
    expect(result.persisted).toEqual(result.achieved);
    expect(storage.loadHighScore()?.rounds).toBe(10);
  });

  it("keeps an equal or better existing high score without writing", () => {
    const memory = new MemoryStorage();
    const storage = new StorageSystem(memory);
    const existing = storage.saveHighScore({
      rounds: 10,
      balance: 0,
      accuracy: 0.6,
      rank: "BPE Adjacent"
    }).achieved;
    const setItem = vi.spyOn(memory, "setItem");

    const equal = storage.saveHighScore({
      rounds: 10,
      balance: 0,
      accuracy: 0.6,
      rank: "BPE Adjacent"
    });
    const lower = storage.saveHighScore({
      rounds: 4,
      balance: 20,
      accuracy: 1,
      rank: "Junior Boundary Clerk"
    });

    expect(equal).toEqual({ status: "kept", achieved: existing, persisted: existing });
    expect(lower).toEqual({ status: "kept", achieved: existing, persisted: existing });
    expect(setItem).not.toHaveBeenCalled();
    expect(storage.loadHighScore()).toEqual(existing);
  });

  it("replaces stale displayed-rank metadata when the new run is longer", () => {
    const storage = new StorageSystem(new MemoryStorage());
    const higherRank = storage.saveHighScore({
      rounds: 12,
      balance: 0,
      accuracy: 0.75,
      rank: "BPE Adjacent",
      rankScore: 140
    }).persisted;

    const result = storage.saveHighScore({
      rounds: 40,
      balance: 40,
      accuracy: 0.2,
      rank: "Regex Intern",
      rankScore: 500
    });

    expect(higherRank?.rounds).toBe(12);
    expect(result.status).toBe("saved");
    expect(result.persisted?.rounds).toBe(40);
    expect(result.persisted?.rank).toBe("Regex Intern");
  });

  it("drops invalid stored values without throwing", () => {
    const memory = new MemoryStorage();
    memory.setItem("tokenization-training.high-score", "{bad json");
    const storage = new StorageSystem(memory);

    expect(storage.loadHighScore()).toBeNull();
  });

  it("migrates high scores from the previous tokenization-training key", () => {
    const memory = new MemoryStorage();
    const legacyRecord = {
      rounds: 12,
      balance: 18.75,
      accuracy: 0.81,
      rank: "BPE Adjacent",
      updatedAt: "2026-06-06T17:25:31.000Z"
    };
    memory.setItem(`${PREVIOUS_STORAGE_PREFIX}.high-score`, JSON.stringify(legacyRecord));

    const loaded = new StorageSystem(memory).loadHighScore();

    expect(loaded).toEqual(legacyRecord);
    expect(memory.getItem(`${STORAGE_PREFIX}.high-score`)).toBe(JSON.stringify(legacyRecord));
  });

  it("migrates high scores from the original manual-tokenization-training key", () => {
    const memory = new MemoryStorage();
    const legacyRecord = {
      rounds: 7,
      balance: 6.5,
      accuracy: 0.7,
      rank: "Junior Boundary Clerk",
      updatedAt: "2026-06-06T17:25:31.000Z"
    };
    memory.setItem(`${LEGACY_STORAGE_PREFIX}.high-score`, JSON.stringify(legacyRecord));

    const loaded = new StorageSystem(memory).loadHighScore();

    expect(loaded).toEqual(legacyRecord);
    expect(memory.getItem(`${STORAGE_PREFIX}.high-score`)).toBe(JSON.stringify(legacyRecord));
  });

  it("reports an unavailable first high-score write", () => {
    const storage = new StorageSystem(new WriteThrowingStorage());
    const candidate = {
      rounds: 6,
      balance: 2.5,
      accuracy: 0.66,
      rank: "Junior Boundary Clerk"
    };

    const result = storage.saveHighScore(candidate);

    expect(result).toEqual({
      status: "unavailable",
      achieved: { ...candidate, updatedAt: expect.any(String) },
      persisted: null
    });
    expect(storage.loadHighScore()).toBeNull();
  });

  it("reports an unavailable replacement while retaining the prior record", () => {
    const existing = {
      rounds: 4,
      balance: 20,
      accuracy: 1,
      rank: "Junior Boundary Clerk",
      updatedAt: "2026-06-06T17:25:31.000Z"
    };
    const memory = new WriteThrowingStorage([
      [`${STORAGE_PREFIX}.high-score`, JSON.stringify(existing)]
    ]);
    const storage = new StorageSystem(memory);

    const result = storage.saveHighScore({
      rounds: 10,
      balance: 0,
      accuracy: 0.6,
      rank: "BPE Adjacent"
    });

    expect(result.status).toBe("unavailable");
    expect(result.achieved).toMatchObject({ rounds: 10, updatedAt: expect.any(String) });
    expect(result.persisted).toEqual(existing);
    expect(storage.loadHighScore()).toEqual(existing);
  });

  it("reports unavailable without storage and when storage reads and writes throw", () => {
    const candidate = {
      rounds: 6,
      balance: 2.5,
      accuracy: 0.66,
      rank: "Junior Boundary Clerk"
    };
    vi.stubGlobal("localStorage", undefined);

    try {
      expect(new StorageSystem().saveHighScore(candidate)).toMatchObject({
        status: "unavailable",
        achieved: candidate,
        persisted: null
      });
    } finally {
      vi.unstubAllGlobals();
    }

    expect(new StorageSystem(new ThrowingStorage()).saveHighScore(candidate)).toMatchObject({
      status: "unavailable",
      achieved: candidate,
      persisted: null
    });
  });

  it("loads a valid legacy high score when its canonical migration write fails", () => {
    const legacyRecord = {
      rounds: 12,
      balance: 18.75,
      accuracy: 0.81,
      rank: "BPE Adjacent",
      updatedAt: "2026-06-06T17:25:31.000Z"
    };
    const memory = new WriteThrowingStorage([
      [`${PREVIOUS_STORAGE_PREFIX}.high-score`, JSON.stringify(legacyRecord)]
    ]);

    expect(new StorageSystem(memory).loadHighScore()).toEqual(legacyRecord);
    expect(memory.getItem(`${STORAGE_PREFIX}.high-score`)).toBeNull();
  });

  it("persists mute preference", () => {
    const memory = new MemoryStorage();
    const storage = new StorageSystem(memory);

    storage.saveMuted(true);
    expect(storage.loadMuted()).toBe(true);
    storage.saveMuted(false);
    expect(storage.loadMuted()).toBe(false);
  });

  it("persists haptics as an independent versioned preference", () => {
    const memory = new MemoryStorage();
    const storage = new StorageSystem(memory);

    expect(storage.loadHapticPreference()).toEqual({ status: "missing", enabled: null });
    expect(storage.saveHapticPreference(false)).toBe(true);
    expect(memory.getItem(HAPTIC_PREFERENCE_KEY)).toBe(JSON.stringify({ version: 1, enabled: false }));
    expect(storage.loadHapticPreference()).toEqual({ status: "stored", enabled: false });

    storage.saveMuted(true);
    expect(storage.saveHapticPreference(true)).toBe(true);
    expect(storage.loadMuted()).toBe(true);
    expect(storage.loadHapticPreference()).toEqual({ status: "stored", enabled: true });
  });

  it.each([
    ["empty", ""],
    ["invalid JSON", "{bad json"],
    ["an array", JSON.stringify([{ version: 1, enabled: true }])],
    ["an old version", JSON.stringify({ version: 0, enabled: true })],
    ["a non-boolean value", JSON.stringify({ version: 1, enabled: "true" })],
    ["an oversized record", JSON.stringify({ version: 1, enabled: true, padding: "x".repeat(128) })]
  ])("treats %s haptic preference as recoverable", (_label, raw) => {
    const memory = new MemoryStorage();
    memory.setItem(HAPTIC_PREFERENCE_KEY, raw);

    expect(new StorageSystem(memory).loadHapticPreference()).toEqual({
      status: "recoverable",
      enabled: null
    });
  });

  it("reports future haptic schemas without interpreting or rewriting them", () => {
    const memory = new MemoryStorage();
    const raw = JSON.stringify({ version: 2, enabled: true, intensity: "system" });
    memory.setItem(HAPTIC_PREFERENCE_KEY, raw);

    expect(new StorageSystem(memory).loadHapticPreference()).toEqual({
      status: "future",
      enabled: null
    });
    expect(memory.getItem(HAPTIC_PREFERENCE_KEY)).toBe(raw);
  });

  it("fails soft when haptic preference storage is unavailable", () => {
    const readFailure = new StorageSystem(new ThrowingStorage());
    const writeFailure = new StorageSystem(new WriteThrowingStorage());

    expect(readFailure.loadHapticPreference()).toEqual({ status: "unavailable", enabled: null });
    expect(writeFailure.saveHapticPreference(true)).toBe(false);
  });

  it("stores unique sentences in first-seen order and aggregates attempts", () => {
    const memory = new MemoryStorage();
    const storage = new StorageSystem(memory);

    storage.rememberTokenLogSentences([
      sentenceObservation("the cat", true, "simple_001"),
      sentenceObservation("how many dogs", false, "simple_002", 200),
      sentenceObservation("the cat", false, "simple_003", 100)
    ]);

    expect(storage.loadTokenLogSentences()).toEqual([
      {
        id: "simple_001",
        text: "the cat",
        fixtureIds: ["simple_001", "simple_003"],
        attempts: 2,
        successfulAttempts: 1,
        lastSuccessful: false,
        tokenStrings: ["the cat"],
        tokenIds: [100]
      },
      {
        id: "simple_002",
        text: "how many dogs",
        fixtureIds: ["simple_002"],
        attempts: 1,
        successfulAttempts: 0,
        lastSuccessful: false,
        tokenStrings: ["how many dogs"],
        tokenIds: [200]
      }
    ]);
    expect(JSON.parse(memory.getItem(RECENT_TOKEN_LOG_KEY)!).version).toBe(4);
  });

  it("deduplicates matching sentence text across fixture IDs", () => {
    const storage = new StorageSystem(new MemoryStorage());
    storage.rememberTokenLogSentences([
      sentenceObservation("the cat", true, "simple_001", 1820),
      sentenceObservation("the cat", false, "duplicate_001", 1820)
    ]);
    const [sentence] = storage.loadTokenLogSentences();

    expect(sentence).toMatchObject({
      id: "simple_001",
      fixtureIds: ["simple_001", "duplicate_001"],
      attempts: 2,
      successfulAttempts: 1,
      lastSuccessful: false
    });
  });

  it("migrates version-three sentence history and records the next result", () => {
    const memory = new MemoryStorage();
    memory.setItem(RECENT_TOKEN_LOG_KEY, JSON.stringify({
      version: 3,
      sentences: [{
        id: "simple_001",
        text: "the cat",
        fixtureIds: ["simple_001"],
        attempts: 1,
        successfulAttempts: 1,
        tokenStrings: ["the cat"],
        tokenIds: [100]
      }]
    }));
    const storage = new StorageSystem(memory);

    expect(storage.loadTokenLogSentences()[0]).toMatchObject({
      lastSuccessful: true
    });

    storage.rememberTokenLogSentences([
      sentenceObservation("the cat", false, "simple_001", 100)
    ]);

    expect(JSON.parse(memory.getItem(RECENT_TOKEN_LOG_KEY)!)).toMatchObject({
      version: 4,
      sentences: [{
        attempts: 2,
        successfulAttempts: 1,
        lastSuccessful: false
      }]
    });
  });

  it("recovers old schemas and malformed data on the next valid sentence write", () => {
    for (const raw of [
      JSON.stringify({ version: 1, fixtureIds: ["simple_001"] }),
      JSON.stringify({ version: 2, words: [] }),
      "{bad json"
    ]) {
      const memory = new MemoryStorage();
      memory.setItem(RECENT_TOKEN_LOG_KEY, raw);
      const storage = new StorageSystem(memory);

      expect(storage.loadTokenLogSentences()).toEqual([]);
      storage.rememberTokenLogSentences([sentenceObservation("the cat")]);
      expect(JSON.parse(memory.getItem(RECENT_TOKEN_LOG_KEY)!)).toMatchObject({
        version: 4,
        sentences: [{ id: "simple_001", text: "the cat" }]
      });
    }
  });

  it("rejects oversized records before parsing and recovers on the next valid write", () => {
    const oversizedRecord = JSON.stringify({ version: 4, sentences: [], padding: "x".repeat(262144) });
    const memory = new MemoryStorage();
    memory.setItem(RECENT_TOKEN_LOG_KEY, oversizedRecord);
    const storage = new StorageSystem(memory);
    const parse = vi.spyOn(JSON, "parse");

    try {
      expect(storage.loadTokenLogSentences()).toEqual([]);
      expect(parse).not.toHaveBeenCalled();
    } finally {
      parse.mockRestore();
    }

    storage.rememberTokenLogSentences([sentenceObservation("the cat")]);
    expect(JSON.parse(memory.getItem(RECENT_TOKEN_LOG_KEY)!).version).toBe(4);
  });

  it("reads unsupported future versions as empty without overwriting them", () => {
    const memory = new MemoryStorage();
    const futureRecord = JSON.stringify({
      version: 5,
      sentences: [],
      futureMetadata: { retained: true }
    });
    memory.setItem(RECENT_TOKEN_LOG_KEY, futureRecord);
    const storage = new StorageSystem(memory);

    expect(storage.loadTokenLogSentences()).toEqual([]);
    storage.rememberTokenLogSentences([sentenceObservation("the cat")]);
    expect(memory.getItem(RECENT_TOKEN_LOG_KEY)).toBe(futureRecord);
  });

  it("fails soft when Token Log storage is unavailable", () => {
    const readFailure = new StorageSystem(new ThrowingStorage());
    const writeFailure = new StorageSystem(new WriteThrowingStorage());

    expect(readFailure.loadTokenLogSentences()).toEqual([]);
    expect(() => readFailure.rememberTokenLogSentences([sentenceObservation("the cat")])).not.toThrow();
    expect(() => readFailure.clearTokenLog()).not.toThrow();
    expect(() => writeFailure.rememberTokenLogSentences([sentenceObservation("the cat")])).not.toThrow();
    expect(() => writeFailure.clearTokenLog()).not.toThrow();
  });

  it("migrates muted state from legacy keys", () => {
    const previousMemory = new MemoryStorage();
    previousMemory.setItem(`${PREVIOUS_STORAGE_PREFIX}.muted`, "true");
    expect(new StorageSystem(previousMemory).loadMuted()).toBe(true);
    expect(previousMemory.getItem(`${STORAGE_PREFIX}.muted`)).toBe("true");

    const originalMemory = new MemoryStorage();
    originalMemory.setItem(`${LEGACY_STORAGE_PREFIX}.muted`, "true");
    expect(new StorageSystem(originalMemory).loadMuted()).toBe(true);
    expect(originalMemory.getItem(`${STORAGE_PREFIX}.muted`)).toBe("true");
  });

  it("exposes flat QA storage state for dev-only browser/native evidence", () => {
    const memory = new MemoryStorage();
    const previousRecord = {
      rounds: 9,
      balance: 4.25,
      accuracy: 0.75,
      rank: "Junior Boundary Clerk",
      updatedAt: "2026-07-01T00:00:00.000Z"
    };
    memory.setItem(`${PREVIOUS_STORAGE_PREFIX}.high-score`, JSON.stringify(previousRecord));
    memory.setItem(`${LEGACY_STORAGE_PREFIX}.muted`, "true");
    const storage = new StorageSystem(memory);

    expect(storage.loadHighScore()).toEqual(previousRecord);
    expect(storage.loadMuted()).toBe(true);
    expect(storage.qaState()).toMatchObject({
      storageAvailable: true,
      highScoreStorageKey: `${STORAGE_PREFIX}.high-score`,
      mutedStorageKey: `${STORAGE_PREFIX}.muted`,
      highScoreRaw: JSON.stringify(previousRecord),
      mutedRaw: "true",
      highScorePresent: true,
      mutedPresent: true,
      legacyHighScorePresent: true,
      legacyMutedPresent: true
    });
  });

  it("clears saved score and mute state for controlled playtest starts", () => {
    const memory = new MemoryStorage();
    const storage = new StorageSystem(memory);
    storage.saveHighScore({
      rounds: 6,
      balance: 3.2,
      accuracy: 0.75,
      rank: "Junior Boundary Clerk"
    });
    storage.saveMuted(true);
    storage.rememberTokenLogSentences([sentenceObservation("the cat")]);

    storage.clearPlaytestState();

    expect(storage.loadHighScore()).toBeNull();
    expect(storage.loadMuted()).toBe(false);
    expect(storage.loadTokenLogSentences()).toEqual([]);
  });

  it("clears every canonical and legacy high-score key after verified readback", () => {
    const record = {
      rounds: 6,
      balance: 3.2,
      accuracy: 0.75,
      rank: "Junior Boundary Clerk",
      updatedAt: "2026-07-18T12:00:00.000Z"
    };
    const memory = new MemoryStorage();
    HIGH_SCORE_KEYS.forEach((key) => memory.setItem(key, JSON.stringify(record)));

    const result = new StorageSystem(memory).clearHighScore();

    expect(result).toEqual({ status: "cleared", persisted: null });
    HIGH_SCORE_KEYS.forEach((key) => expect(memory.getItem(key)).toBeNull());
  });

  it("reports already-clear only after reading every high-score key before and after", () => {
    const memory = new MemoryStorage();
    const getItem = vi.spyOn(memory, "getItem");

    const result = new StorageSystem(memory).clearHighScore();

    expect(result).toEqual({ status: "already-clear", persisted: null });
    expect(getItem.mock.calls.map(([key]) => key)).toEqual([
      ...HIGH_SCORE_KEYS,
      ...HIGH_SCORE_KEYS
    ]);
  });

  it("reports unavailable when high-score storage does not exist", () => {
    vi.stubGlobal("localStorage", undefined);

    try {
      expect(new StorageSystem().clearHighScore()).toEqual({
        status: "unavailable",
        persisted: null
      });
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("clears every high-score key through setItem when removeItem is unavailable", () => {
    const raw = JSON.stringify({
      rounds: 6,
      balance: 3.2,
      accuracy: 0.75,
      rank: "Junior Boundary Clerk",
      updatedAt: "2026-07-18T12:00:00.000Z"
    });
    const values = new Map(HIGH_SCORE_KEYS.map((key) => [key, raw]));
    const setItem = vi.fn((key: string, value: string) => values.set(key, value));
    const fallbackStorage: StorageLike = {
      getItem: (key) => values.get(key) ?? null,
      setItem
    };

    expect(new StorageSystem(fallbackStorage).clearHighScore()).toEqual({
      status: "cleared",
      persisted: null
    });
    expect(setItem.mock.calls).toEqual(HIGH_SCORE_KEYS.map((key) => [key, ""]));
    HIGH_SCORE_KEYS.forEach((key) => expect(values.get(key)).toBe(""));
  });

  it("reports unavailable with null persisted when write failures leave only invalid residue", () => {
    const storage = new WriteThrowingStorage([[HIGH_SCORE_KEY, "{bad json"]]);
    const removeItem = vi.spyOn(storage, "removeItem");

    expect(new StorageSystem(storage).clearHighScore()).toEqual({
      status: "unavailable",
      persisted: null
    });
    expect(removeItem.mock.calls.map(([key]) => key)).toEqual(HIGH_SCORE_KEYS);
  });

  it("continues after a legacy deletion failure and returns the surviving valid record", () => {
    const record = {
      rounds: 9,
      balance: 4.25,
      accuracy: 0.75,
      rank: "BPE Adjacent",
      updatedAt: "2026-07-18T12:00:00.000Z"
    };
    const raw = JSON.stringify(record);
    const memory = new MemoryStorage();
    HIGH_SCORE_KEYS.forEach((key) => memory.setItem(key, raw));
    const removeItem = vi.spyOn(memory, "removeItem").mockImplementation((key) => {
      if (key === PREVIOUS_HIGH_SCORE_KEY) {
        throw new Error("legacy deletion unavailable");
      }
      MemoryStorage.prototype.removeItem.call(memory, key);
    });

    expect(new StorageSystem(memory).clearHighScore()).toEqual({
      status: "unavailable",
      persisted: record
    });
    expect(removeItem.mock.calls.map(([key]) => key)).toEqual(HIGH_SCORE_KEYS);
    expect(memory.getItem(HIGH_SCORE_KEY)).toBeNull();
    expect(memory.getItem(PREVIOUS_HIGH_SCORE_KEY)).toBe(raw);
    expect(memory.getItem(LEGACY_HIGH_SCORE_KEY)).toBeNull();
  });

  it("reloads and remigrates a surviving legacy rank after a partial fallback clear", () => {
    const record = {
      rounds: 9,
      balance: 4.25,
      accuracy: 0.75,
      rank: "BPE Adjacent",
      updatedAt: "2026-07-18T12:00:00.000Z"
    };
    const raw = JSON.stringify(record);
    const values = new Map(HIGH_SCORE_KEYS.map((key) => [key, raw]));
    const fallbackStorage: StorageLike = {
      getItem: (key) => values.get(key) ?? null,
      setItem(key, value) {
        if (key === PREVIOUS_HIGH_SCORE_KEY && value === "") {
          throw new Error("legacy clear unavailable");
        }
        values.set(key, value);
      }
    };
    const storage = new StorageSystem(fallbackStorage);

    expect(storage.clearHighScore()).toEqual({
      status: "unavailable",
      persisted: record
    });
    expect(values.get(HIGH_SCORE_KEY)).toBe("");
    expect(values.get(PREVIOUS_HIGH_SCORE_KEY)).toBe(raw);

    expect(storage.loadHighScore()).toEqual(record);
    expect(values.get(HIGH_SCORE_KEY)).toBe(raw);
  });

  it("reports unavailable when any readback key cannot be verified", () => {
    const memory = new MemoryStorage();
    memory.setItem(HIGH_SCORE_KEY, JSON.stringify({
      rounds: 6,
      balance: 3.2,
      accuracy: 0.75,
      rank: "Junior Boundary Clerk",
      updatedAt: "2026-07-18T12:00:00.000Z"
    }));
    const originalGetItem = memory.getItem.bind(memory);
    const readCounts = new Map<string, number>();
    const getItem = vi.spyOn(memory, "getItem").mockImplementation((key) => {
      const count = (readCounts.get(key) ?? 0) + 1;
      readCounts.set(key, count);
      if (key === PREVIOUS_HIGH_SCORE_KEY && count === 2) {
        throw new Error("readback unavailable");
      }
      return originalGetItem(key);
    });

    expect(new StorageSystem(memory).clearHighScore()).toEqual({
      status: "unavailable",
      persisted: null
    });
    expect(getItem.mock.calls.map(([key]) => key)).toEqual([
      ...HIGH_SCORE_KEYS,
      ...HIGH_SCORE_KEYS
    ]);
  });

  it("preserves Token Log, mute, and haptic keys when clearing only the high score", () => {
    const memory = new MemoryStorage();
    const storage = new StorageSystem(memory);
    storage.saveHighScore({
      rounds: 6,
      balance: 3.2,
      accuracy: 0.75,
      rank: "Junior Boundary Clerk"
    });
    storage.rememberTokenLogSentences([sentenceObservation("the cat")]);
    storage.saveMuted(true);
    storage.saveHapticPreference(false);
    const preserved = new Map([
      [RECENT_TOKEN_LOG_KEY, memory.getItem(RECENT_TOKEN_LOG_KEY)],
      [MUTED_KEY, memory.getItem(MUTED_KEY)],
      [HAPTIC_PREFERENCE_KEY, memory.getItem(HAPTIC_PREFERENCE_KEY)]
    ]);

    expect(storage.clearHighScore()).toEqual({ status: "cleared", persisted: null });
    preserved.forEach((raw, key) => expect(memory.getItem(key)).toBe(raw));
  });

  it("keeps recent Token Log history when Settings resets only the best rank", () => {
    const memory = new MemoryStorage();
    const storage = new StorageSystem(memory);
    storage.saveHighScore({
      rounds: 6,
      balance: 3.2,
      accuracy: 0.75,
      rank: "Junior Boundary Clerk"
    });
    storage.rememberTokenLogSentences([sentenceObservation("the cat")]);

    storage.clearHighScore();

    expect(storage.loadHighScore()).toBeNull();
    expect(storage.loadTokenLogSentences()).toHaveLength(1);
    expect(storage.loadTokenLogSentences()[0].text).toBe("the cat");

    storage.clearTokenLog();
    expect(storage.loadTokenLogSentences()).toEqual([]);
  });

  it("preserves haptics when resetting best rank and clears it for a playtest reset", () => {
    const memory = new MemoryStorage();
    const storage = new StorageSystem(memory);
    storage.saveHighScore({
      rounds: 6,
      balance: 3.2,
      accuracy: 0.75,
      rank: "Junior Boundary Clerk"
    });
    storage.saveHapticPreference(false);

    storage.clearHighScore();
    expect(storage.loadHapticPreference()).toEqual({ status: "stored", enabled: false });

    storage.clearPlaytestState();
    expect(storage.loadHapticPreference()).toEqual({ status: "missing", enabled: null });
  });

  it("persists training mastery and tutorial qualification independently", () => {
    const memory = new MemoryStorage();
    const storage = new StorageSystem(memory);
    const progress = {
      resolvedCount: 23,
      fixtures: [
        { fixtureId: "simple_001", passed: true, resolvedAt: 1 },
        { fixtureId: "dense_001", passed: false, resolvedAt: 23 }
      ]
    };

    expect(storage.saveTrainingProgress(progress)).toBe(true);
    expect(storage.loadTrainingProgress()).toEqual(progress);
    expect(storage.loadTutorialQualified()).toBe(false);
    expect(storage.saveTutorialQualified()).toBe(true);
    expect(storage.loadTutorialQualified()).toBe(true);
    expect(memory.getItem(TRAINING_PROGRESS_KEY)).not.toBeNull();
    expect(memory.getItem(TUTORIAL_QUALIFICATION_KEY)).not.toBeNull();
  });

  it("recovers from malformed training and qualification records", () => {
    const memory = new MemoryStorage();
    memory.setItem(TRAINING_PROGRESS_KEY, "{bad json");
    memory.setItem(TUTORIAL_QUALIFICATION_KEY, JSON.stringify({ version: 99, qualified: true }));
    const storage = new StorageSystem(memory);

    expect(storage.loadTrainingProgress()).toEqual({ resolvedCount: 0, fixtures: [] });
    expect(storage.loadTutorialQualified()).toBe(false);
  });

  it("clears progression and qualification only for a full playtest reset", () => {
    const memory = new MemoryStorage();
    const storage = new StorageSystem(memory);
    storage.saveTrainingProgress({
      resolvedCount: 1,
      fixtures: [{ fixtureId: "simple_001", passed: true, resolvedAt: 1 }]
    });
    storage.saveTutorialQualified();

    storage.clearHighScore();
    expect(storage.loadTrainingProgress().resolvedCount).toBe(1);
    expect(storage.loadTutorialQualified()).toBe(true);

    storage.clearPlaytestState();
    expect(storage.loadTrainingProgress()).toEqual({ resolvedCount: 0, fixtures: [] });
    expect(storage.loadTutorialQualified()).toBe(false);
  });

  it("keeps mute controls usable when persistence fails", () => {
    const storage = new StorageSystem(new ThrowingStorage());

    expect(storage.loadMuted()).toBe(false);
    expect(() => storage.saveMuted(true)).not.toThrow();
  });
});
