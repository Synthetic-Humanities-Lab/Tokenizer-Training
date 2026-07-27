import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const report = readFileSync("docs/mobile_optimization_report.md", "utf8");

describe("mobile optimization report", () => {
  it("ties mobile next steps to archived game-feel guidance", () => {
    expect(report).toContain("## Game Feel Alignment");
    expect(report).toContain("docs/game_design_reading_notes/swink_game_feel.md");
    expect(report).toContain("docs/game_design_concepts/02_text_cutting_game_feel.md");
    expect(report).toContain("the swipe is the player's only expressive verb");
    expect(report).toContain("touch aim feedback must stay clear of the finger");
    expect(report).toContain("first-cut latency");
    expect(report).toContain("touch-assist samples");
    expect(report).toContain("Make the real-device game-feel pass metric-driven.");
  });

  it("preserves screenshot-level visual QA as historical capture context", () => {
    expect(report).toContain("## Historical Captured Visual QA Read");
    expect(report).toContain("historical context, not a claim that those browser surfaces remain fresh");
    expect(report).toContain("Short mobile menu");
    expect(report).toContain("Tall mobile menu");
    expect(report).toContain("The approved card was readable");
    expect(report).toContain("dropped the old division/status line");
    expect(report).toContain("Settings` appeared as a normal menu action");
    expect(report).toContain("Active mobile play");
    expect(report).toContain("Review feedback");
    expect(report).toContain("Results");
    expect(report).toContain("used four larger metric cards");
    expect(report).toContain("omitted the redundant zero-credit card");
    expect(report).toContain("not a substitute for the physical phone pass");
    expect(report).toContain("not claims that the corresponding browser screenshots still match the current runtime");
  });

  it("records runtime screenshot artifact hardening", () => {
    expect(report).toContain("rejects placeholder runtime screenshots");
    expect(report).toContain("real PNG/JPEG image evidence at the `368x552` mobile viewport dimensions");
    expect(report).toContain("encoded visual variation to reject structurally valid but effectively blank captures");
    expect(report).toContain("sibling QA JSON with named HUD, playfield, text, control, pet, and feedback geometry");
    expect(report).toContain("listed controls must retain 44px touch targets");
    expect(report).toContain("review feedback cards must leave at least 8px above the bottom controls");
    expect(report).toContain("named feedback regions must carry visible token-split, verified/rework/net-credit, and cut-audit text");
    expect(report).toContain("viewport containment, 44px controls, review feedback-card clearance above bottom controls, and semantic feedback-card/token-split text");
    expect(report).toContain("named HUD/playfield/control/feedback elements");
    expect(report).toContain("route-level failure artifacts");
    expect(report).toContain("<route-id>.failure.json");
    expect(report).toContain("exact Codex Browser fallback procedure");
    expect(report).toContain("region-level nonblank checks for the feedback-card rectangle if renderer captures keep regressing");
  });

  it("records the compact active-play exit label contract", () => {
    expect(report).toContain("mobile tutorial changed from `Menu` to `Exit`");
    expect(report).toContain("Undo / Clear / Exit / Resolve control contract");
  });

  it("records the review feedback and active speech contract", () => {
    expect(report).toContain("Wiener retained the review speech line");
    expect(report).toContain("feedback card kept token split, verified/rework/net credits, and cut audit inside the card");
    expect(report).toContain("Active speech layout and review feedback-card layout are included in surface provenance");
    expect(report).toContain("HUD/playfield/Wiener/speech/control contract");
    expect(report).toContain("compact speech text and HUD/pet/prompt clearance");
    expect(report).toContain("reduced Token Credit depletion metric evidence including cuts, accuracy, and rank");
    expect(report).toContain("absence of a redundant zero-credit card");
  });

  it("keeps the durable layout summary aligned with the current surface contract", () => {
    expect(report).toContain("equal `Tutorial`, `Training`, `Token");
    expect(report).toContain("Log`, and `Settings` actions");
    expect(report).toContain("the mobile HUD shows `CREDITS`, `TIME`, and `BEST RUN` / `CURRENT`");
    expect(report).toContain("Wiener retains one review speech bubble");
    expect(report).toContain("`Token Credits Depleted` shows run, cuts, accuracy, and rank");
    expect(report).toContain("`Training Suspended` may additionally show remaining Token Credits");
    expect(report).not.toContain("primary tutorial/endless/sound actions");
  });

  it("records the tall mobile menu and freshness-scope cleanup", () => {
    expect(report).toContain("action stack is lifted closer to the best-rank line");
    expect(report).toContain("without restoring desktop premise copy");
    expect(report).toContain("Menu-only layout changes are isolated to menu and simulator provenance");
  });

  it("records the compact results metric readability pass", () => {
    expect(report).toContain("Compact mobile results now give the rank metric a full-width card");
    expect(report).toContain("slightly larger metric text");
    expect(report).toContain("without adding a second results panel");
  });

  it("records the compact mobile token-split fixture-growth gate", () => {
    expect(report).toContain("token-split evidence to fit within two compact wrapped lines");
    expect(report).toContain("single token evidence segment that exceeds the compact card's estimated line width");
    expect(report).toContain("do not add a separate token-strip surface");
  });

  it("records the compact touch-assist artifact pass", () => {
    expect(report).toContain("Compact touch aim now uses the inline armed preview instead of a detached loupe card");
    expect(report).toContain("preserving the same preview slot, snap threshold, accepted cuts, and QA input-feel metrics");
    expect(report).toContain("Runtime capture now records active touch-assist evidence");
    expect(report).toContain("snap-ready boundary evidence");
    expect(report).toContain("detached touch loupe to stay hidden");
    expect(report).toContain("rejected floating-card artifact instead of only final review screenshots");
  });

  it("records hidden storage-state QA evidence without adding a visible panel", () => {
    expect(report).toContain("hidden flat storage state");
    expect(report).toContain("canonical high-score and muted storage keys");
    expect(report).toContain("raw canonical values when present");
    expect(report).toContain("without adding a visible panel or changing gameplay");
  });

  it("records the desktop-harness evidence handoff summary", () => {
    expect(report).toContain("npm run mobile:desktop-evidence");
    expect(report).toContain("seeded the desktop harness row");
    expect(report).toContain("Desktop browser harness evidence: seeded");
    expect(report).toContain("concise physical-evidence summary");
  });

  it("keeps live status out of the durable report", () => {
    expect(report).toContain("blank template-shaped files from an older run");
    expect(report).toContain("visible-but-unavailable phone");
    expect(report).toContain("trust, Developer Mode, or Xcode pairing");
    expect(report).toContain("## Live Status Authority");
    expect(report).toContain("This report is not a live status cache.");
    expect(report).toContain("Run `npm test` for the current automated test result.");
    expect(report).toContain("Run `npm run mobile:status` for a non-destructive diagnostic summary.");
    expect(report).toContain("It is diagnostic only and cannot declare the mobile port complete.");
    expect(report).toContain("Run `npm run mobile:completion` for the fail-closed authority on completion.");
    expect(report).toContain("This report does not claim that the mobile port is complete.");
    expect(report).not.toMatch(/\b\d+\s+test files?\b/i);
    expect(report).not.toMatch(/\b\d+\s+tests?\s+(?:pass|passed)\b/i);
    expect(report).not.toMatch(/\bcurrently passes\b/i);
    expect(report).not.toMatch(/\bfreshness(?:\s+gate)?\s+(?:currently\s+)?passes\b/i);
    expect(report).not.toMatch(/\b(?:all|the|local|validation|mobile)\s+gates? passed\b/i);
    expect(report).not.toMatch(/^\s*(?:validation commands|additional local gates) passed:\s*$/im);
    expect(report).not.toMatch(/\/(?:private\/)?var\/folders\//);
  });
});
