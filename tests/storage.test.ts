import { describe, expect, it } from "vitest";
import { StorageSystem, type StorageLike } from "../src/game/systems/StorageSystem";

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

describe("StorageSystem", () => {
  it("saves and loads a high score", () => {
    const storage = new StorageSystem(new MemoryStorage());
    const saved = storage.saveHighScore({
      rounds: 8,
      balance: 4.25,
      accuracy: 0.72,
      rank: "Prompt Intake Associate"
    });

    expect(storage.loadHighScore()).toEqual(saved);
  });

  it("keeps the better high score", () => {
    const memory = new MemoryStorage();
    const storage = new StorageSystem(memory);
    storage.saveHighScore({ rounds: 10, balance: 0, accuracy: 0.6, rank: "BPE Adjacent" });
    const kept = storage.saveHighScore({ rounds: 4, balance: 20, accuracy: 1, rank: "Junior Boundary Clerk" });

    expect(kept.rounds).toBe(10);
    expect(storage.loadHighScore()?.rounds).toBe(10);
  });

  it("drops invalid stored values without throwing", () => {
    const memory = new MemoryStorage();
    memory.setItem("tokenization-training.high-score", "{bad json");
    const storage = new StorageSystem(memory);

    expect(storage.loadHighScore()).toBeNull();
  });

  it("continues session flow when high score persistence fails", () => {
    const storage = new StorageSystem(new ThrowingStorage());

    const saved = storage.saveHighScore({
      rounds: 6,
      balance: 2.5,
      accuracy: 0.66,
      rank: "Junior Boundary Clerk"
    });

    expect(saved.rounds).toBe(6);
    expect(storage.loadHighScore()).toBeNull();
  });

  it("persists mute preference", () => {
    const memory = new MemoryStorage();
    const storage = new StorageSystem(memory);

    storage.saveMuted(true);
    expect(storage.loadMuted()).toBe(true);
    storage.saveMuted(false);
    expect(storage.loadMuted()).toBe(false);
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

    storage.clearPlaytestState();

    expect(storage.loadHighScore()).toBeNull();
    expect(storage.loadMuted()).toBe(false);
  });

  it("keeps mute controls usable when persistence fails", () => {
    const storage = new StorageSystem(new ThrowingStorage());

    expect(storage.loadMuted()).toBe(false);
    expect(() => storage.saveMuted(true)).not.toThrow();
  });
});
