import { readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { validatePngBuffer } from "../scripts/audit-playtest-readiness";

function readRepoFile(path: string): string {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");
}

describe("browser QA evidence notes", () => {
  it("keeps the latest browser evidence explicit about states and screenshot limits", () => {
    const note = readRepoFile("docs/browser_qa_2026-06-06.md");
    const matrix = readRepoFile("docs/design_verification_matrix.md");
    const audit = readRepoFile("docs/phase2_design_audit.md");

    expect(note).toContain("Browser-readable QA snapshots were collected");
    expect(note).toContain("Page.captureScreenshot");
    expect(note).toContain("not screenshot proof");
    expect(note).toContain("app-authored canvas QA capture");
    expect(note).toContain("qaViewport=320x568");
    expect(note).toContain("docs/browser_qa/");
    expect(note).toContain("Desktop tutorial active");
    expect(note).toContain("Desktop tutorial review");
    expect(note).toContain("Desktop tutorial-complete");
    expect(note).toContain("Desktop protocol results");
    expect(note).toContain("fixture round trace");
    expect(note).toContain("Portrait tutorial active");
    expect(note).toContain("shortened near-text robot");
    expect(note).toContain("shortened bottom overseer");
    expect(note).toContain("Portrait tutorial review");
    expect(note).toContain("Portrait review follow-up");
    expect(note).toContain("compact review defect");
    expect(note).toContain("safe review text position");
    expect(note).toContain("feedback card above the playfield");
    expect(note).toContain("2026-06-06-canvas-desktop-menu.png");
    expect(note).toContain("2026-06-06-canvas-desktop-tutorial-active.png");
    expect(note).toContain("2026-06-06-canvas-desktop-tutorial-review.png");
    expect(note).toContain("2026-06-06-canvas-desktop-handoff.png");
    expect(note).toContain("2026-06-06-canvas-desktop-protocol-results.png");
    expect(note).toContain("2026-06-06-canvas-portrait-tutorial-active.png");
    expect(note).toContain("2026-06-06-canvas-portrait-tutorial-review.png");
    expect(note).toContain("2026-06-06-canvas-small-phone-tutorial-active.png");
    expect(note).toContain("2026-06-06-canvas-small-phone-tutorial-review-popup.png");
    expect(note).toContain("2026-06-06-canvas-small-phone-tutorial-review-feedback.png");
    expect(note).toContain("2026-06-06-canvas-small-phone-menu.png");
    expect(note).toContain("2026-06-06-canvas-small-phone-handoff.png");
    expect(note).toContain("2026-06-06-canvas-small-phone-results.png");
    expect(note).toContain("2026-06-06-canvas-small-phone-protocol-results.png");
    expect(note).toContain("real touch behavior");
    expect(note).toContain("player comprehension");
    expect(matrix).toContain("docs/browser_qa_2026-06-06.md");
    expect(matrix).toContain("app-authored Phaser canvas PNG capture");
    expect(matrix).toContain("latest in-app Browser tab screenshot recheck");
    expect(matrix).toContain("Page.captureScreenshot");
    expect(matrix).toContain("app-authored Phaser canvas rasters");
    expect(matrix).toContain("compact tutorial-header stripping");
    expect(matrix).toContain("compact tutorial-toast wrap capacity");
    expect(matrix).toContain("compact bottom overseer");
    expect(matrix).toContain("compact overseer text shaping");
    expect(matrix).toContain("compact review text parking below controls");
    expect(matrix).toContain("first-user phone/tablet viewport sweep");
    expect(matrix).toContain("tests/responsive-surface-sweep.test.ts");
    expect(matrix).toContain("constrained short-phone active/review tutorial popups");
    expect(matrix).toContain("qaViewport=320x568");
    expect(matrix).toContain("short-phone popup/feedback sequencing");
    expect(matrix).toContain("compact feedback audit fit");
    expect(matrix).toContain("separated menu title/module/premise copy");
    expect(matrix).toContain("compact result ledger fit");
    expect(matrix).toContain("preserved hidden Copy Summary payload");
    expect(matrix).toContain("readable feedback above the playfield layer");
    expect(matrix).toContain("PlayScene QA prompt-position fields");
    expect(matrix).toContain("elapsed/duration/progress");
    expect(matrix).toContain("same-gesture replacement");
    expect(matrix).toContain("return-to-space cleanup");
    expect(matrix).toContain("44px touch-target pass/fail flags");
    expect(matrix).toContain("overseer text/font/wrap evidence");
    expect(matrix).toContain("exact Copy Summary payload including fixture round trace");
    expect(matrix).toContain("text-file download fallback");
    expect(audit).toContain("docs/browser_qa_2026-06-06.md");
    expect(audit).toContain("overseer text/font/wrap evidence");
    expect(audit).toContain("active sentence-motion start/end/current y positions");
    expect(audit).toContain("proportional active text motion");
    expect(audit).toContain("active-motion/review-display split");
    expect(audit).toContain("touch-target pass/fail flags");
    expect(audit).toContain("separate safe text position");
    expect(audit).toContain("first-user responsive surface sweep tests");
    expect(audit).toContain("320x568");
    expect(audit).toContain("constrained short-phone layout");
    expect(audit).toContain("qaViewport=320x568");
    expect(audit).toContain("review popup and feedback card");
    expect(audit).toContain("compact feedback typography");
    expect(audit).toContain("module label collided with the premise copy");
    expect(audit).toContain("compact results defect");
    expect(audit).toContain("hidden Copy Summary");
    expect(audit).toContain("same-gesture cut");
    expect(audit).toContain("return-to-space gesture");
    expect(audit).toContain("tokenizer-training-canvas-qa");
    expect(audit).toContain("preserveDrawingBuffer");
    expect(audit).toContain("Save Summary text-file fallback");
  });

  it("keeps persistent canvas raster artifacts for representative QA states", () => {
    for (const file of [
      "docs/browser_qa/2026-06-06-canvas-desktop-menu.png",
      "docs/browser_qa/2026-06-06-canvas-desktop-tutorial-active.png",
      "docs/browser_qa/2026-06-06-canvas-desktop-tutorial-review.png",
      "docs/browser_qa/2026-06-06-canvas-desktop-handoff.png",
      "docs/browser_qa/2026-06-06-canvas-desktop-protocol-results.png",
      "docs/browser_qa/2026-06-06-canvas-portrait-tutorial-active.png",
      "docs/browser_qa/2026-06-06-canvas-portrait-tutorial-review.png",
      "docs/browser_qa/2026-06-06-canvas-small-phone-tutorial-active.png",
      "docs/browser_qa/2026-06-06-canvas-small-phone-tutorial-review-popup.png",
      "docs/browser_qa/2026-06-06-canvas-small-phone-tutorial-review-feedback.png",
      "docs/browser_qa/2026-06-06-canvas-small-phone-menu.png",
      "docs/browser_qa/2026-06-06-canvas-small-phone-handoff.png",
      "docs/browser_qa/2026-06-06-canvas-small-phone-results.png",
      "docs/browser_qa/2026-06-06-canvas-small-phone-protocol-results.png"
    ]) {
      expect(statSync(repoPath(file)).size, file).toBeGreaterThan(50_000);
    }
  });

  it("keeps the live runtime smoke evidence explicit about interaction and claim boundaries", () => {
    const note = readRepoFile("docs/browser_qa_2026-06-07.md");
    const matrix = readRepoFile("docs/design_verification_matrix.md");
    const audit = readRepoFile("docs/phase2_design_audit.md");

    expect(note).toContain("http://127.0.0.1:5178/");
    expect(note).toContain("qaViewport=390x844");
    expect(note).toContain("tokenization-training-qa");
    expect(note).toContain("tokenization-training-canvas-qa");
    expect(note).toContain("Menu `Begin Training` button");
    expect(note).toContain("Tutorial-complete `Start Endless Training` button");
    expect(note).toContain("Tutorial swipe at the first `simple_001` token boundary");
    expect(note).toContain("CUTS: 1 / 16");
    expect(note).toContain("the | _cat | _sat | _on | _the | _mat");
    expect(note).toContain("No browser console warnings or errors");
    expect(note).toContain("not player comprehension evidence");
    expect(note).toContain("real phone/tablet touch readability");
    expect(note).toContain("http://127.0.0.1:5179/");
    expect(note).toContain("Playwright was not installed");
    expect(note).toContain("Chrome Computer Use was denied");
    expect(note).toContain("Current Canvas Raster Evidence");
    expect(note).toContain("dev port `5173`");
    expect(note).toContain("Direct tab screenshot capture still");
    expect(note).toContain("2026-06-07-browser-canvas-desktop-menu.png");
    expect(note).toContain("2026-06-07-browser-canvas-desktop-tutorial-review.png");
    expect(note).toContain("2026-06-07-browser-canvas-desktop-handoff.png");
    expect(note).toContain("2026-06-07-browser-canvas-desktop-protocol-results.png");
    expect(note).toContain("2026-06-07-browser-canvas-portrait-tutorial-active.png");
    expect(note).toContain("2026-06-07-browser-canvas-portrait-protocol-results.png");
    expect(note).toContain("active desktop PlayScene continually rewrites");
    expect(note).toContain("qaFreezeElapsedMs");
    expect(note).toContain("canvas-level QA artifacts");
    expect(note).toContain("dev port `5180`");
    expect(note).toContain("small-phone popup/text-panel separation");
    expect(note).toContain("short-phone active tutorial popups");
    expect(note).toContain("title/summary overlap fix");
    expect(note).toContain("2026-06-07-frozen-canvas-desktop-tutorial-active.png");
    expect(note).toContain("2026-06-07-frozen-canvas-portrait-tutorial-active.png");
    expect(note).toContain("2026-06-07-frozen-canvas-small-phone-tutorial-active.png");
    expect(note).toContain("2026-06-07-qa-links-desktop-handoff.png");
    expect(note).toContain("2026-06-07-qa-links-portrait-protocol-results.png");
    expect(note).toContain("2026-06-07-qa-links-small-phone-protocol-results.png");
    expect(note).toContain("ledger row rules no longer cut through");
    expect(note).toContain("Latest Current-Build QA Refresh");
    expect(note).toContain("chunked");
    expect(note).toContain("data-URL reads");
    expect(note).toContain("Canvas QA Extraction Hardening - 2026-06-07");
    expect(note).toContain("tokenization-training-canvas-qa-chunks");
    expect(note).toContain("tokenization-training-canvas-qa-chunk-N");
    expect(note).toContain("full data-URL length");
    expect(note).toContain("data-URL hash");
    expect(note).toContain("capture id");
    expect(note).toContain("data-capture-id");
    expect(note).toContain("data-data-url-hash");
    expect(note).toContain("reject mixed-frame reads");
    expect(note).toContain("stale-length matches");
    expect(note).toContain("2026-06-07-chunked-canvas-desktop-menu.png");
    expect(note).toContain("2026-06-07-latest-canvas-desktop-menu.png");
    expect(note).toContain("2026-06-07-latest-canvas-desktop-tutorial-active.png");
    expect(note).toContain("2026-06-07-latest-canvas-desktop-tutorial-review.png");
    expect(note).toContain("2026-06-07-latest-canvas-portrait-tutorial-active.png");
    expect(note).toContain("2026-06-07-latest-canvas-small-phone-tutorial-active.png");
    expect(note).toContain("SEGMENTS STAGED: 1 / 16");
    expect(note).toContain("No browser warning or error logs");
    expect(note).toContain("narrative, mechanics");
    expect(note).toContain("deliberate following-token cuts");
    expect(note).toContain("Live Compact Popup Regression - 2026-06-07");
    expect(note).toContain("fresh strict dev server on port `5181`");
    expect(note).toContain("compact Resolve control row");
    expect(note).toContain("popup/control overlap: `false`");
    expect(note).toContain("popup/text-panel overlap: `false`");
    expect(note).toContain("popup/robot-toast overlap: `false`");
    expect(note).toContain("physical-device touch evidence");
    expect(note).toContain("Direct Full-Tab Screenshot Retry - 2026-06-07");
    expect(note).toContain("existing strict local game shell on port");
    expect(note).toContain("no `2026-06-07-full-tab-*` PNG files were produced");
    expect(note).toContain("In-App Browser Screenshot Recheck - 2026-06-07");
    expect(note).toContain("http://127.0.0.1:5183/?playtestReset=1");
    expect(note).toContain("tab.screenshot({ fullPage: false })");
    expect(note).toContain("full-tab screenshot gap current");
    expect(note).toContain("Compact Robot Toast Re-Raster - 2026-06-07");
    expect(note).toContain("2026-06-07-tight-toast-small-phone-tutorial-active.png");
    expect(note).toContain("short one-line strip between the controls and the token text");
    expect(note).toContain("Review Trail And Balance Recheck - 2026-06-07");
    expect(note).toContain("2026-06-07-review-no-ui-trail-balance.png");
    expect(note).toContain("Continuation Menu Raster Recheck - 2026-06-07");
    expect(note).toContain("2026-06-07-continuation-canvas-menu.png");
    expect(note).toContain("complete `IEND` chunk");
    expect(note).toContain("one chunk at a time");
    expect(note).toContain("Balance $30.67");
    expect(note).toContain("stale amber diagonal");
    expect(note).toContain("UI clicks no longer extend the cutting trail");
    expect(note).toContain("fresh dev port `5182`");
    expect(note).toContain("active-phase-only");
    expect(note).toContain("trail redraw bails out while");
    expect(note).toContain("no stale diagonal");
    expect(note).toContain("Post-UI Byte Route Portrait Recheck - 2026-06-07");
    expect(note).toContain("2026-06-07-post-ui-byte-route-portrait.png");
    expect(note).toContain("BYTE ROUTE 1/5");
    expect(note).toContain("UTF-8 bytes become chunks, then token IDs.");
    expect(note).toContain("data-URL hash");
    expect(note).toContain("58c1dbf4");
    expect(note).toContain("app-authored canvas QA evidence only");
    expect(note).toContain("physical-device touch proof");
    expect(note).toContain("player comprehension evidence");
    expect(matrix).toContain("docs/browser_qa_2026-06-07.md");
    expect(matrix).toContain("menu-to-tutorial click");
    expect(matrix).toContain("handoff-to-endless click");
    expect(matrix).toContain("one `simple_001` swipe cut");
    expect(matrix).toContain("resolve-to-review token-strip/feedback evidence");
    expect(matrix).toContain("port `5179`");
    expect(matrix).toContain("Playwright absence");
    expect(matrix).toContain("Chrome Computer Use denial");
    expect(matrix).toContain("narrative/mechanics/technical/review popup sequencing");
    expect(matrix).toContain("multi-space run suppression for fast swipes");
    expect(matrix).toContain("deliberate following-token cuts after a compact space-run");
    expect(matrix).toContain("current port `5173` in-app Browser canvas-raster pass");
    expect(matrix).toContain("port `5180` `qaFreezeElapsedMs` QA-link pass");
    expect(matrix).toContain("current `2026-06-07-browser-canvas-*` files");
    expect(matrix).toContain("current frozen `2026-06-07-frozen-canvas-*`");
    expect(matrix).toContain("latest `2026-06-07-latest-canvas-*`");
    expect(matrix).toContain("browser drag plus Resolve");
    expect(matrix).toContain("chunked data-URL raster evidence");
    expect(matrix).toContain("tokenizer-training-canvas-qa-chunks");
    expect(matrix).toContain("bounded pieces");
    expect(matrix).toContain("capture-id and data-URL-hash matching");
    expect(matrix).toContain("reject mixed-frame");
    expect(matrix).toContain("stale same-length data");
    expect(matrix).toContain("2026-06-07-chunked-canvas-desktop-menu.png");
    expect(matrix).toContain("fresh direct screenshot retry on strict port `5173`");
    expect(matrix).toContain("2026-06-07-full-tab-*");
    expect(matrix).toContain("screenshot recheck on port `5183`");
    expect(matrix).toContain("still timed out on `Page.captureScreenshot`");
    expect(matrix).toContain("compact-toast follow-up on strict port `5173`");
    expect(matrix).toContain("tight compact robot-toast control/text separation");
    expect(matrix).toContain("UI-click samples excluded from the visible cut trail");
    expect(matrix).toContain("active-phase-only trail visibility");
    expect(matrix).toContain("dev-port `5182` active-phase-only trail fix");
    expect(matrix).toContain("2026-06-07-review-no-ui-trail-balance.png");
    expect(matrix).toContain("2026-06-07-continuation-canvas-menu.png");
    expect(matrix).toContain("2026-06-07-post-ui-byte-route-portrait.png");
    expect(matrix).toContain("byte-route");
    expect(matrix).toContain("continuation menu raster");
    expect(matrix).toContain("qaFreezeElapsedMs");
    expect(matrix).toContain("short-phone active popup/text-panel separation");
    expect(matrix).toContain("normal-phone `390x844` active-popup/control regression coverage");
    expect(matrix).toContain("compact result title/summary separation");
    expect(matrix).toContain("compact result ledger typography and row-rule clearance");
    expect(matrix).toContain("2026-06-07-qa-links-small-phone-protocol-results.png");
    expect(audit).toContain("compact ledger row rules cutting through");
    expect(audit).toContain("Run/Cuts/Pay/Net/Eff/Rank/Best rows clear");
    expect(audit).toContain("docs/browser_qa_2026-06-07.md");
    expect(audit).toContain("live route and interaction smoke passed");
    expect(audit).toContain("no stale UI-click trail");
    expect(audit).toContain("2026-06-07-review-no-ui-trail-balance.png");
    expect(audit).toContain("active-phase-only");
    expect(audit).toContain("fresh dev port `5182`");
    expect(audit).toContain("refuses to redraw it while reviewing");
    expect(audit).toContain("`the | _cat | _sat | _on | _the | _mat`");
    expect(audit).toContain("Follow-Up Implementation Pass - 2026-06-07");
    expect(audit).toContain("Playwright was not installed");
    expect(audit).toContain("Chrome Computer Use was denied");
    expect(audit).toContain("current valid");
    expect(audit).toContain("Direct `Page.captureScreenshot`");
    expect(audit).toContain("current canvas-raster evidence");
    expect(audit).toContain("qaFreezeElapsedMs");
    expect(audit).toContain("short-phone active-popup overlap");
    expect(audit).toContain("during continuous sentence motion");
    expect(audit).toContain("wrapped title colliding with the summary");
    expect(audit).toContain("latest current-build QA refresh");
    expect(audit).toContain("capture-id manifest");
    expect(audit).toContain("manifest data-URL hash");
    expect(audit).toContain("numbered canvas-data chunks");
    expect(audit).toContain("reject mixed-frame reads");
    expect(audit).toContain("stale same-length data");
    expect(audit).toContain("large DOM read");
    expect(audit).toContain("2026-06-07-chunked-canvas-desktop-menu.png");
    expect(audit).toContain("2026-06-07-latest-canvas-desktop-tutorial-review.png");
    expect(audit).toContain("`SEGMENTS STAGED: 1 / 16`");
    expect(audit).toContain("no browser");
    expect(audit).toContain("fresh strict dev server at port `5181`");
    expect(audit).toContain("subsequent direct screenshot retry");
    expect(audit).toContain("screenshot gap current rather than historical");
    expect(audit).toContain("latest compact UI follow-up");
    expect(audit).toContain("2026-06-07-tight-toast-small-phone-tutorial-active.png");
    expect(audit).toContain("2026-06-07-continuation-canvas-menu.png");
    expect(audit).toContain("2026-06-07-post-ui-byte-route-portrait.png");
    expect(audit).toContain("byte-route portrait recheck");
    expect(audit).toContain("BYTE ROUTE 1/5");
    expect(audit).toContain("popup/control");
    expect(audit).toContain("popup/text-panel");
    expect(audit).toContain("popup/toast");
    expect(audit).toContain("overseer/control overlap");
    expect(audit).toContain("real-device touch observation");
  });

  it("keeps current browser-canvas raster artifacts valid and non-empty", () => {
    const expectedArtifacts = new Map<string, { width: number; height: number }>([
      ["docs/browser_qa/2026-06-07-browser-canvas-desktop-menu.png", { width: 1280, height: 720 }],
      ["docs/browser_qa/2026-06-07-browser-canvas-desktop-tutorial-review.png", { width: 1280, height: 720 }],
      ["docs/browser_qa/2026-06-07-browser-canvas-desktop-handoff.png", { width: 1280, height: 720 }],
      ["docs/browser_qa/2026-06-07-browser-canvas-desktop-protocol-results.png", { width: 1280, height: 720 }],
      ["docs/browser_qa/2026-06-07-browser-canvas-portrait-tutorial-active.png", { width: 390, height: 844 }],
      ["docs/browser_qa/2026-06-07-browser-canvas-portrait-protocol-results.png", { width: 390, height: 844 }],
      ["docs/browser_qa/2026-06-07-frozen-canvas-desktop-tutorial-active.png", { width: 1280, height: 720 }],
      ["docs/browser_qa/2026-06-07-frozen-canvas-portrait-tutorial-active.png", { width: 390, height: 844 }],
      ["docs/browser_qa/2026-06-07-frozen-canvas-small-phone-tutorial-active.png", { width: 320, height: 568 }],
      ["docs/browser_qa/2026-06-07-qa-links-desktop-handoff.png", { width: 1280, height: 720 }],
      ["docs/browser_qa/2026-06-07-qa-links-portrait-protocol-results.png", { width: 390, height: 844 }],
      ["docs/browser_qa/2026-06-07-qa-links-small-phone-protocol-results.png", { width: 320, height: 568 }],
      ["docs/browser_qa/2026-06-07-latest-canvas-desktop-menu.png", { width: 1280, height: 720 }],
      ["docs/browser_qa/2026-06-07-latest-canvas-desktop-tutorial-active.png", { width: 1280, height: 720 }],
      ["docs/browser_qa/2026-06-07-latest-canvas-desktop-tutorial-review.png", { width: 1280, height: 720 }],
      ["docs/browser_qa/2026-06-07-latest-canvas-portrait-tutorial-active.png", { width: 390, height: 844 }],
      ["docs/browser_qa/2026-06-07-latest-canvas-small-phone-tutorial-active.png", { width: 320, height: 568 }],
      ["docs/browser_qa/2026-06-07-chunked-canvas-desktop-menu.png", { width: 1280, height: 720 }],
      ["docs/browser_qa/2026-06-07-tight-toast-small-phone-tutorial-active.png", { width: 320, height: 568 }],
      ["docs/browser_qa/2026-06-07-continuation-canvas-menu.png", { width: 1280, height: 720 }],
      ["docs/browser_qa/2026-06-07-post-ui-byte-route-portrait.png", { width: 390, height: 844 }]
    ]);

    for (const [file, dimensions] of expectedArtifacts) {
      const path = repoPath(file);
      const validation = validatePngBuffer(readFileSync(path));
      expect(statSync(path).size, file).toBeGreaterThan(50_000);
      expect(validation, file).toMatchObject({ ok: true, ...dimensions });
    }
  });
});

function repoPath(path: string): string {
  return fileURLToPath(new URL(`../${path}`, import.meta.url));
}
