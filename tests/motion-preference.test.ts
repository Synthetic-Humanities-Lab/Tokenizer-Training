import { describe, expect, it, vi } from "vitest";
import {
  createMotionPreferenceRuntime,
  motionPreferenceLabel,
  motionTreatment,
  REDUCED_MOTION_MEDIA_QUERY,
  type MotionMatchMedia,
  unsupportedMotionPreference
} from "../src/game/systems/MotionPreferenceSystem";
import { StorageSystem, type StorageLike } from "../src/game/systems/StorageSystem";

interface FakeChangeEvent {
  matches: boolean;
}

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

function fakeMediaQuery(initial: boolean) {
  let matches = initial;
  const listeners = new Set<(event: FakeChangeEvent) => void>();
  const query = {
    get matches() {
      return matches;
    },
    addEventListener: vi.fn((_type: "change", listener: (event: FakeChangeEvent) => void) => {
      listeners.add(listener);
    }),
    removeEventListener: vi.fn((_type: "change", listener: (event: FakeChangeEvent) => void) => {
      listeners.delete(listener);
    })
  };

  return {
    query,
    set(next: boolean) {
      matches = next;
      for (const listener of [...listeners]) {
        listener({ matches });
      }
    }
  };
}

describe("MotionPreferenceSystem", () => {
  it("remains manually controllable when matchMedia is unavailable", () => {
    const runtime = createMotionPreferenceRuntime(undefined, new StorageSystem(new MemoryStorage()));

    expect(runtime.snapshot()).toEqual({ reduced: false, supported: true });
    expect(motionPreferenceLabel(runtime.snapshot())).toBe("Reduced Motion: Off");
    expect(runtime.setReduced(true)).toEqual({ reduced: true, supported: true });
    expect(unsupportedMotionPreference()).toEqual({ reduced: false, supported: false });
  });

  it("remains manually controllable when matchMedia throws", () => {
    const runtime = createMotionPreferenceRuntime(() => {
      throw new Error("blocked media query");
    }, new StorageSystem(new MemoryStorage()));

    expect(runtime.snapshot()).toEqual({ reduced: false, supported: true });
  });

  it("reads and follows the system query without duplicate notifications", () => {
    const fake = fakeMediaQuery(false);
    const matchMedia = vi.fn(() => fake.query) as unknown as MotionMatchMedia;
    const runtime = createMotionPreferenceRuntime(matchMedia, new StorageSystem(new MemoryStorage()));
    const listener = vi.fn();
    const unsubscribe = runtime.subscribe(listener);

    expect(matchMedia).toHaveBeenCalledWith(REDUCED_MOTION_MEDIA_QUERY);
    expect(runtime.snapshot()).toEqual({ reduced: false, supported: true });
    expect(motionPreferenceLabel(runtime.snapshot())).toBe("Reduced Motion: Off");

    fake.set(true);
    fake.set(true);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(runtime.snapshot()).toEqual({ reduced: true, supported: true });
    expect(motionPreferenceLabel(runtime.snapshot())).toBe("Reduced Motion: On");

    unsubscribe();
    fake.set(false);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(runtime.snapshot().reduced).toBe(false);
  });

  it("persists a manual override and stops following later system changes", () => {
    const memory = new MemoryStorage();
    const storage = new StorageSystem(memory);
    const fake = fakeMediaQuery(false);
    const runtime = createMotionPreferenceRuntime(
      (() => fake.query) as unknown as MotionMatchMedia,
      storage
    );
    const listener = vi.fn();
    runtime.subscribe(listener);

    runtime.setReduced(true);
    fake.set(false);

    expect(runtime.snapshot()).toEqual({ reduced: true, supported: true });
    expect(listener).toHaveBeenCalledTimes(1);
    const restored = createMotionPreferenceRuntime(
      (() => fake.query) as unknown as MotionMatchMedia,
      storage
    );
    expect(restored.snapshot()).toEqual({ reduced: true, supported: true });
  });

  it("removes its media-query listener and subscribers on destroy", () => {
    const fake = fakeMediaQuery(true);
    const runtime = createMotionPreferenceRuntime((() => fake.query) as unknown as MotionMatchMedia);
    const listener = vi.fn();
    runtime.subscribe(listener);

    runtime.destroy();
    runtime.destroy();
    fake.set(false);

    expect(fake.query.removeEventListener).toHaveBeenCalledTimes(1);
    expect(listener).not.toHaveBeenCalled();
    expect(runtime.snapshot().reduced).toBe(true);
  });

  it("supports the legacy WebKit listener API", () => {
    let listener: ((event: FakeChangeEvent) => void) | undefined;
    const removeListener = vi.fn();
    const runtime = createMotionPreferenceRuntime((() => ({
      matches: false,
      addListener: vi.fn((next: (event: FakeChangeEvent) => void) => {
        listener = next;
      }),
      removeListener
    })) as unknown as MotionMatchMedia);
    const subscriber = vi.fn();
    runtime.subscribe(subscriber);

    listener?.({ matches: true });
    expect(subscriber).toHaveBeenCalledWith({ reduced: true, supported: true });

    runtime.destroy();
    expect(removeListener).toHaveBeenCalledTimes(1);
  });

  it("replaces only nonessential motion when reduction is requested", () => {
    expect(motionTreatment({ reduced: false, supported: true })).toEqual({
      petIdle: "animate",
      petReaction: "animate",
      resolvedText: "fall",
      cutImpact: "scale"
    });
    expect(motionTreatment({ reduced: true, supported: true })).toEqual({
      petIdle: "still",
      petReaction: "still",
      resolvedText: "fade",
      cutImpact: "fade"
    });
  });
});
