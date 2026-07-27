import { describe, expect, it } from "vitest";
import {
  createHapticPreferenceRuntime,
  HAPTIC_PREFERENCE_REGISTRY_KEY,
  readHapticPreferenceRuntime
} from "../src/game/systems/HapticPreferenceSystem";
import { STORAGE_PREFIX } from "../src/game/systems/ProductIdentitySystem";
import { StorageSystem, type StorageLike } from "../src/game/systems/StorageSystem";

const HAPTIC_PREFERENCE_KEY = `${STORAGE_PREFIX}.haptics-preference`;
const MUTED_KEY = `${STORAGE_PREFIX}.muted`;

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

class WriteFailingStorage implements StorageLike {
  private readonly values = new Map<string, string>();

  constructor(entries: Iterable<readonly [string, string]> = []) {
    this.values = new Map(entries);
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(): void {
    throw new Error("storage write unavailable");
  }
}

describe("HapticPreferenceSystem", () => {
  it("delays mute-state migration until a haptic route is available", () => {
    const memory = new MemoryStorage();
    const storage = new StorageSystem(memory);
    storage.saveMuted(true);
    const runtime = createHapticPreferenceRuntime(storage);

    expect(runtime.snapshot(false)).toEqual({
      enabled: false,
      persisted: false,
      source: "unavailable"
    });
    expect(memory.getItem(HAPTIC_PREFERENCE_KEY)).toBeNull();

    expect(runtime.snapshot(true)).toEqual({
      enabled: false,
      persisted: true,
      source: "migrated"
    });
    expect(JSON.parse(memory.getItem(HAPTIC_PREFERENCE_KEY)!)).toEqual({ version: 1, enabled: false });
  });

  it("persists haptics independently from Sound and reloads the explicit choice", () => {
    const memory = new MemoryStorage();
    const storage = new StorageSystem(memory);
    storage.saveMuted(true);
    storage.saveHapticPreference(true);
    const runtime = createHapticPreferenceRuntime(storage);

    expect(runtime.snapshot(true)).toEqual({ enabled: true, persisted: true, source: "stored" });
    expect(runtime.setEnabled(false)).toEqual({ enabled: false, persisted: true, source: "stored" });
    expect(storage.loadMuted()).toBe(true);
    expect(createHapticPreferenceRuntime(storage).snapshot(true)).toEqual({
      enabled: false,
      persisted: true,
      source: "stored"
    });
  });

  it("recovers malformed data from the mute default only after an explicit choice", () => {
    const memory = new MemoryStorage();
    memory.setItem(HAPTIC_PREFERENCE_KEY, "{bad json");
    memory.setItem(MUTED_KEY, "false");
    const runtime = createHapticPreferenceRuntime(new StorageSystem(memory));

    expect(runtime.snapshot(true)).toEqual({
      enabled: true,
      persisted: false,
      source: "recovered"
    });
    expect(memory.getItem(HAPTIC_PREFERENCE_KEY)).toBe("{bad json");

    expect(runtime.setEnabled(false)).toEqual({ enabled: false, persisted: true, source: "stored" });
    expect(JSON.parse(memory.getItem(HAPTIC_PREFERENCE_KEY)!)).toEqual({ version: 1, enabled: false });
  });

  it("preserves a future schema and keeps any new choice session-only", () => {
    const memory = new MemoryStorage();
    const futureRecord = JSON.stringify({ version: 2, enabled: true, intensity: "system" });
    memory.setItem(HAPTIC_PREFERENCE_KEY, futureRecord);
    const runtime = createHapticPreferenceRuntime(new StorageSystem(memory));

    expect(runtime.snapshot(true)).toEqual({ enabled: false, persisted: false, source: "future" });
    expect(runtime.setEnabled(true)).toEqual({ enabled: true, persisted: false, source: "session" });
    expect(runtime.snapshot(true)).toEqual({ enabled: true, persisted: false, source: "session" });
    expect(memory.getItem(HAPTIC_PREFERENCE_KEY)).toBe(futureRecord);
  });

  it("retains an explicit choice for the session when persistence fails", () => {
    const backing = new WriteFailingStorage([[MUTED_KEY, "true"]]);
    const runtime = createHapticPreferenceRuntime(new StorageSystem(backing));

    expect(runtime.snapshot(true)).toEqual({
      enabled: false,
      persisted: false,
      source: "unavailable"
    });
    expect(runtime.setEnabled(true)).toEqual({
      enabled: true,
      persisted: false,
      source: "unavailable"
    });
    expect(runtime.snapshot(true)).toEqual({
      enabled: true,
      persisted: false,
      source: "unavailable"
    });
  });

  it("reads only a runtime-shaped value from the shared registry key", () => {
    const runtime = createHapticPreferenceRuntime(new StorageSystem(new MemoryStorage()));
    const keys: string[] = [];

    expect(readHapticPreferenceRuntime({
      get(key) {
        keys.push(key);
        return runtime;
      }
    })).toBe(runtime);
    expect(keys).toEqual([HAPTIC_PREFERENCE_REGISTRY_KEY]);
    expect(readHapticPreferenceRuntime({ get: () => ({ snapshot: () => undefined }) })).toBeUndefined();
    expect(readHapticPreferenceRuntime({ get: () => ({ setEnabled: () => undefined }) })).toBeUndefined();
  });

});
