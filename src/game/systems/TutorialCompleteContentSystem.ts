import { cutAuditAccuracy } from "./ScoringSystem";

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
    return denominator > 0
      ? cutAuditAccuracy(correctCuts, missedCuts, falseCuts)
      : normalizedAccuracy(performance.accuracy);
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
      summary: tutorialFailureSummary(performance),
      primaryAction: "Retry Tutorial",
      secondaryAction: "Return to Menu"
    };
  }

  return {
    status,
    chromePath: "wienerworks://tutorial-cleared",
    title: "Tutorial Cleared",
    summary:
      "Qualification approved. WienerWorks permits you to begin Machine Replacement Training with a 40 TC account. Production speed remains theoretical.",
    primaryAction: "Start Training",
    secondaryAction: "Return to Menu"
  };
}

function tutorialFailureSummary(performance: TutorialCompletePerformance): string {
  const readinessPercent = Math.floor(TUTORIAL_PASS_ACCURACY * 100);
  const accuracyPercent = Math.min(
    Math.floor(tutorialPerformanceScore(performance) * 100),
    readinessPercent - 1
  );

  return `Boundary accuracy: ${accuracyPercent}%. Readiness requires ${readinessPercent}%. ${tutorialFailureCorrection(performance)} Qualification denied. Payroll remains unconvinced.`;
}

function tutorialFailureCorrection(performance: TutorialCompletePerformance): string {
  const correctCuts = finiteCount(performance.totalCorrectCuts);
  const missedCuts = finiteCount(performance.totalMissedCuts);
  const falseCuts = finiteCount(performance.totalFalseCuts);

  if (
    correctCuts === undefined ||
    missedCuts === undefined ||
    falseCuts === undefined ||
    missedCuts + falseCuts === 0
  ) {
    return "Review the boundary evidence.";
  }

  if (missedCuts > falseCuts) {
    return "Focus: recover missed boundaries.";
  }

  if (falseCuts > missedCuts) {
    return "Focus: remove false cuts.";
  }

  return "Focus: missed boundaries and false cuts.";
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
