import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("../src/game/scenes/TokenLogScene.ts", import.meta.url)),
  "utf8"
);

describe("TokenLogScene semantic integration", () => {
  it("mounts one lease, resets reusable state, and disposes on shutdown", () => {
    const create = source.slice(source.indexOf("  create("), source.indexOf("\n  private render"));
    expect(source.match(/\.mount\("token-log"/g)).toHaveLength(1);
    expect(create).toContain("this.navigationStarted = false;");
    expect(create).toContain("this.pageIndex = 0;");
    expect(create).toContain("this.semanticLease?.dispose();");
    expect(create).toContain("clearGameQaSnapshot();");
    expect(source).not.toContain("document.");
    expect(source).not.toContain("HTMLElement");
  });

  it("derives canvas, QA, and semantics from one paginated content object", () => {
    const render = source.slice(source.indexOf("  private render"), source.indexOf("\n  private handleSemanticAction"));
    const qaIndex = render.indexOf("this.writeQaSnapshot(layout, content);");
    const semanticIndex = render.indexOf("tokenLogSemanticSnapshot(content.pageEntries, content.summary");

    expect(render.match(/const entries = tokenLogEntries\(/g)).toHaveLength(1);
    expect(render).toContain("pageEntries: tokenLogPage(entries, this.pageIndex)");
    expect(render).toContain("summary: summarizeTokenLog(entries, this.pageIndex)");
    expect(render).toContain("content.pageEntries.forEach((entry, index) => {");
    expect(qaIndex).toBeGreaterThan(-1);
    expect(semanticIndex).toBeGreaterThan(qaIndex);
  });

  it("routes Previous, Back, and Next through shared guarded commands", () => {
    expect(source).toContain('this.createButton(layout.previousButton, "Previous"');
    expect(source).toContain('this.createButton(layout.backButton, "Back"');
    expect(source).toContain('this.createButton(layout.nextButton, "Next"');
    expect(source).toContain('if (actionId === "previous")');
    expect(source).toContain('if (actionId === "next")');
    expect(source).toContain('if (actionId === "back")');
    expect(source).toContain("this.semanticLease?.focusAction(direction < 0 ? \"previous\" : \"next\");");
    expect(source).toContain('this.scene.start("MenuScene", { semanticFocusActionId: "token-log" });');
  });

  it("keeps visible status, mappings, IDs, and empty-state guidance", () => {
    expect(source).toContain('layout.title.y, "Token Log", {');
    expect(source).toContain("tokenLogEntryMetadata(entry)");
    expect(source).toContain("`ID ${mapping.tokenId}`");
    expect(source).toContain('"No sentences recorded yet."');
    expect(source).toContain('"Resolve tutorial rounds to build your record."');
  });
});
