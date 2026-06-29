import { describe, expect, it } from "vitest";
import { launchModeFromUrl, playtestResetFromUrl } from "../src/game/systems/LaunchModeSystem";

describe("launchModeFromUrl", () => {
  it("defaults to the menu without a valid launch mode", () => {
    expect(launchModeFromUrl(undefined)).toBe("menu");
    expect(launchModeFromUrl("not a url")).toBe("menu");
    expect(launchModeFromUrl("http://127.0.0.1:5173/")).toBe("menu");
    expect(launchModeFromUrl("http://127.0.0.1:5173/?mode=unknown")).toBe("menu");
  });

  it("accepts tutorial launch aliases from query params", () => {
    expect(launchModeFromUrl("http://127.0.0.1:5173/?mode=tutorial")).toBe("tutorial");
    expect(launchModeFromUrl("http://127.0.0.1:5173/?mode=guided")).toBe("tutorial");
    expect(launchModeFromUrl("http://127.0.0.1:5173/?mode=training")).toBe("tutorial");
  });

  it("accepts endless launch aliases from query params", () => {
    expect(launchModeFromUrl("http://127.0.0.1:5173/?mode=endless")).toBe("endless");
    expect(launchModeFromUrl("http://127.0.0.1:5173/?mode=play")).toBe("endless");
    expect(launchModeFromUrl("http://127.0.0.1:5173/?mode=shift")).toBe("endless");
  });

  it("accepts tutorial-complete launch aliases from query params", () => {
    expect(launchModeFromUrl("http://127.0.0.1:5173/?mode=tutorial-complete")).toBe("tutorialComplete");
    expect(launchModeFromUrl("http://127.0.0.1:5173/?mode=tutorialComplete")).toBe("tutorialComplete");
    expect(launchModeFromUrl("http://127.0.0.1:5173/?mode=tutorial-cleared")).toBe("tutorialComplete");
    expect(launchModeFromUrl("http://127.0.0.1:5173/?mode=tutorial-passed")).toBe("tutorialComplete");
    expect(launchModeFromUrl("http://127.0.0.1:5173/?mode=passed-tutorial")).toBe("tutorialComplete");
    expect(launchModeFromUrl("http://127.0.0.1:5173/?mode=handoff")).toBe("tutorialComplete");
  });

  it("accepts failed tutorial QA launch aliases from query params", () => {
    expect(launchModeFromUrl("http://127.0.0.1:5173/?mode=tutorial-failed")).toBe("tutorialFailed");
    expect(launchModeFromUrl("http://127.0.0.1:5173/?mode=tutorialFailed")).toBe("tutorialFailed");
    expect(launchModeFromUrl("http://127.0.0.1:5173/?mode=failed-tutorial")).toBe("tutorialFailed");
  });

  it("accepts results launch aliases from query params", () => {
    expect(launchModeFromUrl("http://127.0.0.1:5173/?mode=results")).toBe("results");
    expect(launchModeFromUrl("http://127.0.0.1:5173/?mode=result")).toBe("results");
    expect(launchModeFromUrl("http://127.0.0.1:5173/?mode=summary")).toBe("results");
    expect(launchModeFromUrl("http://127.0.0.1:5173/?mode=results-qa")).toBe("results");
  });

  it("accepts protocol-results launch aliases from query params", () => {
    expect(launchModeFromUrl("http://127.0.0.1:5173/?mode=protocol-results")).toBe("protocolResults");
    expect(launchModeFromUrl("http://127.0.0.1:5173/?mode=results-protocol")).toBe("protocolResults");
    expect(launchModeFromUrl("http://127.0.0.1:5173/?mode=results-handoff")).toBe("protocolResults");
  });

  it("uses hash params when query mode is absent", () => {
    expect(launchModeFromUrl("http://127.0.0.1:5173/#mode=tutorial")).toBe("tutorial");
    expect(launchModeFromUrl("http://127.0.0.1:5173/#mode=endless")).toBe("endless");
    expect(launchModeFromUrl("http://127.0.0.1:5173/#mode=complete")).toBe("tutorialComplete");
    expect(launchModeFromUrl("http://127.0.0.1:5173/#mode=tutorial-failed")).toBe("tutorialFailed");
    expect(launchModeFromUrl("http://127.0.0.1:5173/#mode=results")).toBe("results");
    expect(launchModeFromUrl("http://127.0.0.1:5173/#mode=protocol-results")).toBe("protocolResults");
  });

  it("gives query params precedence over hash params", () => {
    expect(launchModeFromUrl("http://127.0.0.1:5173/?mode=endless#mode=tutorial")).toBe("endless");
  });

  it("detects explicit playtest reset requests without changing launch mode", () => {
    expect(playtestResetFromUrl(undefined)).toBe(false);
    expect(playtestResetFromUrl("not a url")).toBe(false);
    expect(playtestResetFromUrl("http://127.0.0.1:5173/")).toBe(false);
    expect(playtestResetFromUrl("http://127.0.0.1:5173/?playtestReset=1")).toBe(true);
    expect(playtestResetFromUrl("http://127.0.0.1:5173/?mode=tutorial&playtestReset=playtest")).toBe(true);
    expect(playtestResetFromUrl("http://127.0.0.1:5173/?mode=endless#playtestReset=true")).toBe(true);
    expect(launchModeFromUrl("http://127.0.0.1:5173/?mode=tutorial&playtestReset=1")).toBe("tutorial");
    expect(launchModeFromUrl("http://127.0.0.1:5173/?mode=tutorial-complete&playtestReset=1")).toBe("tutorialComplete");
    expect(launchModeFromUrl("http://127.0.0.1:5173/?mode=tutorial-failed&playtestReset=1")).toBe("tutorialFailed");
    expect(launchModeFromUrl("http://127.0.0.1:5173/?mode=results&playtestReset=1")).toBe("results");
    expect(launchModeFromUrl("http://127.0.0.1:5173/?mode=protocol-results&playtestReset=1")).toBe(
      "protocolResults"
    );
  });
});
