import { describe, expect, it } from "vitest";
import {
  parseSurfaceProfile,
  surfaceProfileForRuntime,
  surfaceProfileFromUrl
} from "../src/game/systems/SurfaceProfileSystem";

describe("SurfaceProfileSystem", () => {
  it("defaults to the browser surface", () => {
    expect(surfaceProfileFromUrl(undefined)).toBe("browser");
    expect(surfaceProfileFromUrl("not a url")).toBe("browser");
    expect(surfaceProfileFromUrl("https://example.test/")).toBe("browser");
  });

  it("reads explicit mobile and browser surface profiles from search params", () => {
    expect(surfaceProfileFromUrl("https://example.test/?surface=mobile")).toBe("mobile");
    expect(surfaceProfileFromUrl("https://example.test/?surface=ios")).toBe("mobile");
    expect(surfaceProfileFromUrl("https://example.test/?ttSurface=web")).toBe("browser");
  });

  it("reads explicit surface profiles from hash params", () => {
    expect(surfaceProfileFromUrl("https://example.test/#surface=native")).toBe("mobile");
    expect(surfaceProfileFromUrl("https://example.test/#surface=desktop")).toBe("browser");
  });

  it("ignores unknown profile names", () => {
    expect(parseSurfaceProfile("tablet")).toBeUndefined();
    expect(surfaceProfileFromUrl("https://example.test/?surface=tablet")).toBe("browser");
  });

  it("selects the mobile surface automatically for touch-sized runtime viewports", () => {
    expect(surfaceProfileForRuntime("https://example.test/", {
      viewportWidth: 390,
      maxTouchPoints: 5,
      coarsePointer: true
    })).toBe("mobile");
  });

  it("keeps narrow mouse-only browsers on the browser surface", () => {
    expect(surfaceProfileForRuntime("https://example.test/", {
      viewportWidth: 390,
      maxTouchPoints: 0,
      coarsePointer: false
    })).toBe("browser");
  });

  it("honors explicit surface overrides before runtime detection", () => {
    expect(surfaceProfileForRuntime("https://example.test/?surface=browser", {
      viewportWidth: 390,
      maxTouchPoints: 5,
      coarsePointer: true
    })).toBe("browser");
    expect(surfaceProfileForRuntime("https://example.test/?surface=mobile", {
      viewportWidth: 1280,
      maxTouchPoints: 0,
      coarsePointer: false
    })).toBe("mobile");
  });
});
