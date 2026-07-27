import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { resultsSemanticSnapshot } from "../src/game/systems/ResultsSemanticSystem";

function resultsSceneSource(): string {
  return readFileSync(
    fileURLToPath(new URL("../src/game/scenes/ResultsScene.ts", import.meta.url)),
    "utf8"
  );
}

describe("resultsSemanticSnapshot", () => {
  it("projects the exact visible outcome, metric rows, and action order", () => {
    const snapshot = resultsSemanticSnapshot({
      title: "Token Credits Depleted",
      summary: "Your account no longer contains enough Token Credits to correct your output. Training access revoked.",
      metricRows: [
        { label: "RUN", value: "12 rounds" },
        { label: "CUTS", value: "OK 5 / M 3 / F 2" },
        { label: "ACCURACY", value: "50%" },
        { label: "RANK", value: "BPE Adjacent" }
      ],
      outcomeAnnouncementId: "results:tt-results-qa:outcome"
    });

    expect(snapshot).toEqual({
      scene: "results",
      heading: "Token Credits Depleted",
      summary: "Your account no longer contains enough Token Credits to correct your output. Training access revoked.",
      details: [
        "RUN: 12 rounds",
        "CUTS: OK 5 / M 3 / F 2",
        "ACCURACY: 50%",
        "RANK: BPE Adjacent"
      ],
      actions: [
        { id: "token-log", label: "Review Token Log" },
        { id: "retry", label: "Run Training Again" },
        { id: "menu", label: "Return to Menu" }
      ],
      announcement: {
        id: "results:tt-results-qa:outcome",
        text: "Token Credits Depleted\nYour account no longer contains enough Token Credits to correct your output. Training access revoked.",
        politeness: "assertive"
      }
    });
  });

  it("preserves the visible remaining-credit row and stable recovery actions", () => {
    const input = {
      title: "Training Suspended",
      summary: "Session closed by operator request. WienerWorks preserved the usable portion and most of the causes.",
      metricRows: [
        { label: "RUN", value: "7 rounds" },
        { label: "CUTS", value: "OK 5 / M 3 / F 2" },
        { label: "ACCURACY", value: "63%" },
        { label: "CREDITS", value: "12 TC" },
        { label: "RANK", value: "Junior Boundary Clerk" }
      ]
    } as const;

    const snapshot = resultsSemanticSnapshot(input);

    expect(snapshot.details).toEqual([
      "RUN: 7 rounds",
      "CUTS: OK 5 / M 3 / F 2",
      "ACCURACY: 63%",
      "CREDITS: 12 TC",
      "RANK: Junior Boundary Clerk"
    ]);
    expect(snapshot.actions[0]).toEqual({ id: "token-log", label: "Review Token Log" });
    expect(snapshot.announcement).toBeUndefined();
  });

  it("resets reusable scene state and guards each navigation path", () => {
    const source = resultsSceneSource();
    const create = source.slice(source.indexOf("  create("), source.indexOf("\n  private render"));
    const tokenLogCommand = source.slice(
      source.indexOf("  private commandTokenLog"),
      source.indexOf("  private commandRetry")
    );
    const retryCommand = source.slice(
      source.indexOf("  private commandRetry"),
      source.indexOf("  private commandReturnToMenu")
    );
    const menuCommand = source.slice(
      source.indexOf("  private commandReturnToMenu"),
      source.indexOf("  private beginNavigation")
    );
    expect(create).toContain("this.announceOutcomeOnNextPublish = true;");
    expect(create).toContain("this.navigationStarted = false;");
    expect(create.indexOf("this.navigationStarted = false;")).toBeLessThan(
      create.indexOf("this.dataSnapshot =")
    );
    expect(create).toContain("readSemanticRuntime(this.registry)?.mount");
    expect(create.match(/\.mount\("results"/g)).toHaveLength(1);
    expect(create).toContain("this.navigationStarted = true;");
    expect(create).toContain("this.semanticLease?.dispose();");
    expect(tokenLogCommand).toContain("beginNavigation");
    expect(tokenLogCommand).toContain('this.scene.start("TokenLogScene")');
    expect(retryCommand).toContain("beginNavigation");
    expect(menuCommand).toContain("beginNavigation");
  });
});
