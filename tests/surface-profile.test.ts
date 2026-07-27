import { describe, expect, it } from "vitest";
import {
  parseSurfaceProfile,
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
});
