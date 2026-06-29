import { describe, expect, it } from "vitest";
import config from "../vite.config";

describe("Vite build config", () => {
  it("keeps the known Phaser engine bundle explicit instead of a generic app chunk", () => {
    const output = config.build?.rollupOptions?.output;
    const outputOptions = Array.isArray(output) ? output[0] : output;
    const manualChunks = outputOptions?.manualChunks;

    expect(config.build?.chunkSizeWarningLimit).toBe(1400);
    expect(typeof manualChunks).toBe("function");
    expect(
      typeof manualChunks === "function"
        ? manualChunks("/repo/node_modules/phaser/dist/phaser.js", { getModuleInfo: () => null, getModuleIds: function* () {} })
        : undefined
    ).toBe("phaser-engine");
    expect(
      typeof manualChunks === "function"
        ? manualChunks("/repo/src/game/Game.ts", { getModuleInfo: () => null, getModuleIds: function* () {} })
        : "unexpected"
    ).toBeUndefined();
  });
});
