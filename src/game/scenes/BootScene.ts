import Phaser from "phaser";
import { launchModeFromUrl, playtestResetFromUrl } from "../systems/LaunchModeSystem";
import { createResultsProtocolSeed } from "../systems/ResultsProtocolSystem";
import { STARTING_TOKEN_CREDITS } from "../systems/ScoringSystem";
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
    if (launchMode === "tutorialIntake") {
      this.startInitialScene("TutorialScene");
      return;
    }

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
        creditBalance: STARTING_TOKEN_CREDITS,
        accuracy: 0,
        totalCorrectCuts: 0,
        totalMissedCuts: 0,
        totalFalseCuts: 0,
        roundTraces: [],
        startSource: "direct",
        inputModality: "none",
        totalVerifiedCredits: 0,
        totalReworkCredits: 0,
        outcome: "quit"
      });
      return;
    }

    if (launchMode === "settingsResetConfirm") {
      this.startInitialScene("SettingsScene", { resetConfirmation: true });
      return;
    }

    if (launchMode === "settings") {
      this.startInitialScene("SettingsScene");
      return;
    }

    if (launchMode === "tokenLog") {
      this.startInitialScene("TokenLogScene");
      return;
    }

    if (launchMode === "protocolResults") {
      this.startInitialScene("ResultsScene", createResultsProtocolSeed());
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
