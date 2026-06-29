import { describe, expect, it } from "vitest";
import {
  balanceHudLabel,
  balanceHudText,
  compactBalanceHudText,
  compactTimeHudText,
  computeHudLayout,
  costHudText,
  highScoreHudText,
  hudMoney,
  progressHudLabel,
  progressHudRatio,
  payHudText,
  progressHudText,
  shortRank,
  timeHudColor,
  timeHudText
} from "../src/game/ui/Hud";
import { uiPalette } from "../src/game/ui/VisualTheme";

describe("Hud balance formatting", () => {
  it("formats money without hiding negative values in helper output", () => {
    expect(hudMoney(4.25)).toBe("$4.25");
    expect(hudMoney(-3.5)).toBe("-$3.50");
  });

  it("labels normal, low, and exhausted balance states explicitly", () => {
    expect(balanceHudLabel(40)).toBe("BALANCE");
    expect(balanceHudLabel(10)).toBe("BALANCE LOW");
    expect(balanceHudLabel(0)).toBe("BUDGET ZERO");
    expect(balanceHudLabel(-2.5)).toBe("BUDGET ZERO");
  });

  it("clamps displayed exhausted balance while preserving the warning label", () => {
    expect(balanceHudText(12.34)).toBe("BALANCE\n$12.34");
    expect(balanceHudText(9.99)).toBe("BALANCE LOW\n$9.99");
    expect(balanceHudText(-1.25)).toBe("BUDGET ZERO\n$0.00");
  });

  it("uses shorter compact balance labels for narrow HUDs", () => {
    expect(compactBalanceHudText(12.34)).toBe("BAL\n$12.34");
    expect(compactBalanceHudText(9.99)).toBe("LOW BAL\n$9.99");
    expect(compactBalanceHudText(-1.25)).toBe("ZERO\n$0.00");
  });

  it("shows pay and cost only during review so active rounds cannot display stale accounting", () => {
    expect(payHudText(3.24, "review")).toBe("PAY\n+$3.24");
    expect(costHudText(5.12, "review")).toBe("COST\n-$5.12");
    expect(payHudText(3.24, "active")).toBe("PAY\n+$0.00");
    expect(costHudText(5.12, "active")).toBe("COST\n-$0.00");
    expect(payHudText(3.24, "paused")).toBe("PAY\n+$0.00");
    expect(costHudText(5.12, "paused")).toBe("COST\n-$0.00");
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

  it("formats active and paused timer states explicitly", () => {
    expect(timeHudText(9000)).toBe("TIME\n9.0s");
    expect(timeHudText(9000, "paused")).toBe("PAUSED\n9.0s");
    expect(timeHudText(9000, "review")).toBe("REVIEW\n9.0s");
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
    expect(compactTimeHudText(9000, "review")).toBe("REVW\n9.0s");
    expect(progressHudText("TUTORIAL", 3, 5)).toBe("TUTORIAL\n3 / 5");
    expect(progressHudText("TUTORIAL", 3, 5, true)).toBe("LESSON\n3 / 5");
    expect(progressHudText("CLEARANCE", 0, 10, true)).toBe("CLEAR\n0 / 10");
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

  it("lays compact HUD metrics into two readable rows", () => {
    const layout = computeHudLayout(390);

    expect(layout.compact).toBe(true);
    expect(layout.background.height).toBe(112);
    expect(layout.balance.fontSize).toBeLessThan(20);
    expect(layout.pay.y).toBeGreaterThan(layout.balance.y + 48);
    expect(layout.cost.y).toBe(layout.pay.y);
    expect(layout.round.y).toBe(layout.pay.y);
    expect(layout.round.x).toBeGreaterThan(layout.cost.x);
  });

  it("keeps desktop HUD labels full length and larger", () => {
    const layout = computeHudLayout(1280);

    expect(layout.compact).toBe(false);
    expect(layout.balance.fontSize).toBe(22);
    expect(layout.round.x).toBeGreaterThan(layout.cost.x);
    expect(layout.highScore.x).toBe(1086);
  });

  it("condenses desktop HUD metrics inside a bounded training console", () => {
    const layout = computeHudLayout(1280, { x: 640, width: 692 });

    expect(layout.compact).toBe(false);
    expect(layout.background.x).toBe(640);
    expect(layout.background.width).toBe(692);
    expect(layout.balance.fontSize).toBeLessThan(24);
    expect(layout.highScore.x).toBeLessThan(986);
    expect(layout.pay.x).toBeGreaterThan(layout.balance.x);
    expect(layout.time.x).toBeGreaterThan(layout.round.x);
  });
});
