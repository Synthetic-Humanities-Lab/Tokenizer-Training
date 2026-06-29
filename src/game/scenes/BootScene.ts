import Phaser from "phaser";
import { launchModeFromUrl, playtestResetFromUrl } from "../systems/LaunchModeSystem";
import { StorageSystem } from "../systems/StorageSystem";
import wienerReferenceUrl from "../assets/wiener-reference.png";
import { WIENER_TEXTURE_KEY } from "../ui/WienerSprite";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload(): void {
    this.load.image(WIENER_TEXTURE_KEY, wienerReferenceUrl);
  }

  create(): void {
    this.textures.get(WIENER_TEXTURE_KEY).setFilter(Phaser.Textures.FilterMode.NEAREST);
    const href = globalThis.location?.href;
    if (playtestResetFromUrl(href)) {
      new StorageSystem().clearPlaytestState();
    }

    const launchMode = launchModeFromUrl(href);
    if (launchMode === "tutorial") {
      this.startInitialScene("PlayScene", { tutorial: true, startSource: "direct" });
      return;
    }

    if (launchMode === "endless") {
      this.startInitialScene("PlayScene", { tutorial: false, startSource: "direct" });
      return;
    }

    if (launchMode === "tutorialComplete") {
      this.startInitialScene("TutorialCompleteScene");
      return;
    }

    if (launchMode === "tutorialFailed") {
      this.startInitialScene("TutorialCompleteScene", {
        accuracy: 0,
        totalCorrectCuts: 0,
        totalMissedCuts: 5,
        totalFalseCuts: 3
      });
      return;
    }

    if (launchMode === "results") {
      this.startInitialScene("ResultsScene", {
        runId: "tt-results-qa",
        rounds: 0,
        balance: 40,
        accuracy: 0,
        totalCorrectCuts: 0,
        totalMissedCuts: 0,
        totalFalseCuts: 0,
        roundTraces: [],
        startSource: "direct",
        inputModality: "none",
        totalPay: 0,
        totalCost: 0,
        outcome: "quit"
      });
      return;
    }

    if (launchMode === "protocolResults") {
      this.startInitialScene("ResultsScene", {
        runId: "tt-protocol-qa",
        rounds: 7,
        balance: 12.34,
        accuracy: 0.625,
        totalCorrectCuts: 5,
        totalMissedCuts: 3,
        totalFalseCuts: 2,
        roundTraces: [
          {
            round: 1,
            fixtureId: "simple_001",
            category: "simple_prose",
            tier: 1,
            tokenCount: 6,
            correctCuts: 2,
            missedCuts: 1,
            falseCuts: 0
          },
          {
            round: 2,
            fixtureId: "punct_001",
            category: "contraction",
            tier: 2,
            tokenCount: 5,
            correctCuts: 2,
            missedCuts: 1,
            falseCuts: 1
          },
          {
            round: 3,
            fixtureId: "dense_001",
            category: "url",
            tier: 3,
            tokenCount: 4,
            correctCuts: 1,
            missedCuts: 1,
            falseCuts: 1
          }
        ],
        startSource: "handoff-screen",
        inputModality: "touch",
        totalPay: 21.5,
        totalCost: 49.75,
        outcome: "quit"
      });
      return;
    }

    this.startInitialScene("MenuScene");
  }

  private startInitialScene(key: string, data?: object): void {
    if (import.meta.env.DEV && shouldStartImmediatelyForQa(globalThis.location?.href)) {
      this.scene.manager.start(key, data);
      return;
    }

    this.scene.start(key, data);
  }
}

function shouldStartImmediatelyForQa(url: string | undefined): boolean {
  if (!url) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.searchParams.has("qaViewport") || parsed.searchParams.has("qaFreezeElapsedMs");
  } catch {
    return false;
  }
}
