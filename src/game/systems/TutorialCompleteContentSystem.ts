export interface TutorialCompleteCopy {
  status: TutorialCompleteStatus;
  chromePath: string;
  title: string;
  summary: string;
  primaryAction: string;
  secondaryAction: string;
}

export interface TutorialCompletePerformance {
  accuracy?: number;
  totalCorrectCuts?: number;
  totalMissedCuts?: number;
  totalFalseCuts?: number;
}

export type TutorialCompleteStatus = "passed" | "failed";

export const TUTORIAL_PASS_ACCURACY = 0.7;

export function tutorialPerformanceScore(performance: TutorialCompletePerformance = {}): number {
  const correctCuts = finiteCount(performance.totalCorrectCuts);
  const missedCuts = finiteCount(performance.totalMissedCuts);
  const falseCuts = finiteCount(performance.totalFalseCuts);
  const hasCutAudit = correctCuts !== undefined && missedCuts !== undefined && falseCuts !== undefined;

  if (hasCutAudit) {
    const denominator = correctCuts + missedCuts + falseCuts;
    return denominator > 0 ? correctCuts / denominator : normalizedAccuracy(performance.accuracy);
  }

  return normalizedAccuracy(performance.accuracy);
}

export function tutorialCompletionStatus(performance: TutorialCompletePerformance = {}): TutorialCompleteStatus {
  return tutorialPerformanceScore(performance) >= TUTORIAL_PASS_ACCURACY ? "passed" : "failed";
}

export function tutorialCompleteCopy(performance: TutorialCompletePerformance = { accuracy: 1 }): TutorialCompleteCopy {
  const status = tutorialCompletionStatus(performance);
  if (status === "failed") {
    return {
      status,
      chromePath: "wienerworks://tutorial-failed",
      title: "Tutorial Failed",
      summary:
        "Boundary accuracy stayed below the readiness threshold. Retry the tutorial before the mistakes become payroll events. Wiener has preserved the evidence, unnecessarily well.",
      primaryAction: "Retry Tutorial",
      secondaryAction: "Return to Menu"
    };
  }

  return {
    status,
    chromePath: "wienerworks://tutorial-cleared",
    title: "Tutorial Cleared",
    summary:
      "Training threshold met. WienerWorks now considers you safe enough for live cost exposure. This should not be confused with trust.",
    primaryAction: "Start Endless Training",
    secondaryAction: "Return to Menu"
  };
}

function finiteCount(value: number | undefined): number | undefined {
  if (!Number.isFinite(value)) {
    return undefined;
  }

  return Math.max(0, Math.floor(value ?? 0));
}

function normalizedAccuracy(value: number | undefined): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(1, value ?? 0));
}
