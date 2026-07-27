import { describe, expect, it } from "vitest";
import {
  compactCreditHudText,
  compactTimeHudText,
  computeHudLayout,
  creditHudLabel,
  creditHudText,
  highScoreHudText,
  hudMetricVisibility,
  mobileProgressHudText,
  progressHudLabel,
  progressHudRatio,
  progressHudText,
  rankLedgerHudText,
  reworkHudText,
  shortRank,
  timeHudColor,
  timeHudText,
  tokenCredits,
  verifiedHudText
} from "../src/game/ui/Hud";
import { uiPalette } from "../src/game/ui/VisualTheme";

describe("Hud Token Credit formatting", () => {
  it("formats integer Token Credits without allowing a negative visible account", () => {
    expect(tokenCredits(4.25)).toBe("4 TC");
    expect(tokenCredits(-3.5)).toBe("0 TC");
    expect(tokenCredits(Number.POSITIVE_INFINITY)).toBe("∞ TC");
  });

  it("labels normal, low, and depleted credit states explicitly", () => {
    expect(creditHudLabel(40)).toBe("CREDITS");
    expect(creditHudLabel(10)).toBe("CREDITS LOW");
    expect(creditHudLabel(0)).toBe("CREDITS EMPTY");
    expect(creditHudLabel(-2.5)).toBe("CREDITS EMPTY");
  });

  it("clamps displayed depleted credits while preserving the warning label", () => {
    expect(creditHudText(12)).toBe("CREDITS\n12 TC");
    expect(creditHudText(9)).toBe("CREDITS LOW\n9 TC");
    expect(creditHudText(-1)).toBe("CREDITS EMPTY\n0 TC");
  });

  it("uses shorter compact credit labels for narrow HUDs", () => {
    expect(compactCreditHudText(12)).toBe("CREDITS\n12 TC");
    expect(compactCreditHudText(9)).toBe("LOW TC\n9 TC");
    expect(compactCreditHudText(-1)).toBe("EMPTY\n0 TC");
  });

  it("shows verified and rework credits only during review", () => {
    expect(verifiedHudText(3, "review")).toBe("VERIFIED\n+3 TC");
    expect(reworkHudText(5, "review")).toBe("REWORK\n-5 TC");
    expect(verifiedHudText(3, "active")).toBe("VERIFIED\n+0 TC");
    expect(reworkHudText(5, "active")).toBe("REWORK\n-0 TC");
    expect(verifiedHudText(3, "paused")).toBe("VERIFIED\n+0 TC");
    expect(reworkHudText(5, "paused")).toBe("REWORK\n-0 TC");
  });

  it("shortens best-rank text more aggressively on compact HUDs", () => {
    expect(shortRank("Prompt Intake Associate")).toBe("Prompt Intake");
    expect(shortRank("Prompt Intake Associate", true)).toBe("Prompt");
    expect(shortRank("Junior Boundary Clerk", true)).toBe("Boundary");
    expect(shortRank("Temporary Sequence Specialist", true)).toBe("Temp Seq.");
    expect(shortRank("Regex Intern", true)).toBe("Regex");
  });

  it("formats best record text for desktop and compact HUDs", () => {
    expect(highScoreHudText(11.9, "Junior Boundary Clerk")).toBe("BEST\n11 / Boundary Clerk");
    expect(highScoreHudText(11.9, "Junior Boundary Clerk", true)).toBe("BEST\n11 / Boundary");
    expect(highScoreHudText(-1, "Regex Intern", true)).toBe("BEST\n0 / Regex");
  });

  it("keeps best and current run counts in one persistent ledger", () => {
    expect(rankLedgerHudText(37, 2)).toBe(
      "BEST RUN  37\nCURRENT  2"
    );
  });

  it("formats active and paused timer states explicitly", () => {
    expect(timeHudText(9000)).toBe("TIME\n9.0s");
    expect(timeHudText(9000, "paused")).toBe("PAUSED\n9.0s");
    expect(timeHudText(9000, "review")).toBe("STATUS\nAUDIT");
    expect(timeHudText(-120, "paused")).toBe("PAUSED\n0.0s");
  });

  it("warns on low active time without coloring paused or review states", () => {
    expect(timeHudColor(1900)).toBe("#b6534a");
    expect(timeHudColor(2100)).toBe(uiPalette.text);
    expect(timeHudColor(1900, "active", false)).toBe(uiPalette.text);
    expect(timeHudColor(1900, "paused")).toBe(uiPalette.text);
    expect(timeHudColor(1900, "review")).toBe(uiPalette.text);
  });

  it("uses compact timer and round labels on narrow HUDs", () => {
    expect(compactTimeHudText(9000)).toBe("TIME\n9.0s");
    expect(compactTimeHudText(9000, "paused")).toBe("PAUSE\n9.0s");
    expect(compactTimeHudText(9000, "review")).toBe("STATUS\nAUDIT");
    expect(progressHudText("TUTORIAL", 3, 5)).toBe("TUTORIAL\n3 / 5");
    expect(progressHudText("TUTORIAL", 3, 5, true)).toBe("LESSON\n3 / 5");
    expect(progressHudText("CLEARANCE", 0, 10, true)).toBe("CLEAR\n0 / 10");
    expect(progressHudText("SAMPLES", 37, 200, true)).toBe("SAMPLES\n37 / 200");
    expect(mobileProgressHudText("SAMPLES", 37, 200)).toBe("SAMPLES 37/200");
    expect(mobileProgressHudText("TUTORIAL", 3, 10)).toBe("LESSON 3/10");
    expect(progressHudLabel("CLEARANCE")).toBe("CLEARANCE");
    expect(progressHudLabel("CLEARANCE", true)).toBe("CLEAR");
  });

  it("clamps the progress-meter fill ratio", () => {
    expect(progressHudRatio(0, 5)).toBe(0);
    expect(progressHudRatio(3, 5)).toBe(0.6);
    expect(progressHudRatio(7, 5)).toBe(1);
    expect(progressHudRatio(-2, 5)).toBe(0);
    expect(progressHudRatio(2, 0)).toBe(1);
  });

  it("keeps compact HUD geometry readable while prediction renders only Credits and Time", () => {
    const layout = computeHudLayout(390);
    const active = hudMetricVisibility(layout, "active");
    const review = hudMetricVisibility(layout, "review");

    expect(layout.compact).toBe(true);
    expect(layout.background.height).toBe(112);
    expect(layout.credits.fontSize).toBeLessThan(20);
    expect(active).toEqual({ credits: true, verified: false, rework: false, round: false, time: true, highScore: true });
    expect(review.highScore).toBe(true);
  });

  it.each([
    [320, 568],
    [368, 800],
    [390, 844]
  ])("keeps the mobile HUD legible at %ix%i", (width, height) => {
    const layout = computeHudLayout(width, undefined, undefined, "mobile");
    const active = hudMetricVisibility(layout, "active");
    const review = hudMetricVisibility(layout, "review");

    expect(layout.background.width).toBeGreaterThanOrEqual(280);
    expect(layout.background.height).toBe(78);
    expect(layout.credits.fontSize).toBeGreaterThanOrEqual(16);
    expect(layout.time.fontSize).toBeGreaterThanOrEqual(15);
    expect(active).toEqual({ credits: true, verified: false, rework: false, round: true, time: true, highScore: true });
    expect(review.highScore).toBe(true);
    expect(height).toBeGreaterThan(layout.background.height);
  });

  it("keeps desktop HUD labels full length and larger", () => {
    const layout = computeHudLayout(1280);

    expect(layout.compact).toBe(false);
    expect(layout.credits.fontSize).toBe(22);
    expect(layout.round.x).toBeGreaterThan(layout.rework.x);
    expect(layout.highScore.x).toBe(1086);
  });

  it("condenses desktop HUD metrics inside a bounded training console", () => {
    const layout = computeHudLayout(1280, { x: 640, width: 692 });

    expect(layout.compact).toBe(false);
    expect(layout.background.x).toBe(640);
    expect(layout.background.width).toBe(692);
    expect(layout.credits.fontSize).toBeLessThan(24);
    expect(layout.highScore.x).toBeLessThan(986);
    expect(layout.verified.x).toBeGreaterThan(layout.credits.x);
    expect(layout.time.x).toBeGreaterThan(layout.round.x);
    expect(hudMetricVisibility(layout, "active").highScore).toBe(true);
  });
});
