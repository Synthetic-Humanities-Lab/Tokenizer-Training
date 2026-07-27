export type LaunchMode =
  | "menu"
  | "tutorialIntake"
  | "tutorial"
  | "endless"
  | "tutorialComplete"
  | "tutorialFailed"
  | "results"
  | "protocolResults"
  | "settings"
  | "settingsResetConfirm"
  | "tokenLog";

const TUTORIAL_ALIASES = new Set(["tutorial", "training", "guided"]);
const TUTORIAL_INTAKE_ALIASES = new Set(["tutorial-intake", "clock-in", "intake"]);
const ENDLESS_ALIASES = new Set(["endless", "play", "shift"]);
const TUTORIAL_COMPLETE_ALIASES = new Set([
  "tutorial-complete",
  "tutorialcomplete",
  "tutorial-cleared",
  "tutorialcleared",
  "tutorial-passed",
  "tutorialpassed",
  "passed-tutorial",
  "passed",
  "handoff",
  "complete"
]);
const TUTORIAL_FAILED_ALIASES = new Set(["tutorial-failed", "tutorialfailed", "failed-tutorial"]);
const RESULTS_ALIASES = new Set(["results", "result", "summary", "results-qa"]);
const SETTINGS_ALIASES = new Set(["settings", "options"]);
const SETTINGS_RESET_CONFIRM_ALIASES = new Set(["settings-reset-confirm"]);
const TOKEN_LOG_ALIASES = new Set(["token-log", "tokenlog", "tokens", "archive"]);
const PROTOCOL_RESULTS_ALIASES = new Set([
  "protocol-results",
  "results-protocol",
  "results-handoff",
  "handoff-results"
]);
const RESET_ALIASES = new Set(["1", "true", "yes", "playtest"]);

export function launchModeFromUrl(url: string | undefined): LaunchMode {
  const parsed = parseLaunchUrl(url);
  if (!parsed) {
    return "menu";
  }

  const mode = normalizedMode(parsed.searchParams.get("mode"));
  if (mode) {
    return mode;
  }

  const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ""));
  return normalizedMode(hashParams.get("mode")) ?? "menu";
}

export function playtestResetFromUrl(url: string | undefined): boolean {
  const parsed = parseLaunchUrl(url);
  if (!parsed) {
    return false;
  }

  if (resetRequested(parsed.searchParams)) {
    return true;
  }

  return resetRequested(new URLSearchParams(parsed.hash.replace(/^#/, "")));
}

function parseLaunchUrl(url: string | undefined): URL | undefined {
  if (!url) {
    return undefined;
  }

  try {
    return new URL(url);
  } catch {
    return undefined;
  }
}

function resetRequested(params: URLSearchParams): boolean {
  return RESET_ALIASES.has(params.get("playtestReset")?.trim().toLowerCase() ?? "");
}

function normalizedMode(value: string | null): LaunchMode | undefined {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (TUTORIAL_ALIASES.has(normalized)) {
    return "tutorial";
  }

  if (TUTORIAL_INTAKE_ALIASES.has(normalized)) {
    return "tutorialIntake";
  }

  if (ENDLESS_ALIASES.has(normalized)) {
    return "endless";
  }

  if (TUTORIAL_COMPLETE_ALIASES.has(normalized)) {
    return "tutorialComplete";
  }

  if (TUTORIAL_FAILED_ALIASES.has(normalized)) {
    return "tutorialFailed";
  }

  if (RESULTS_ALIASES.has(normalized)) {
    return "results";
  }

  if (SETTINGS_RESET_CONFIRM_ALIASES.has(normalized)) {
    return "settingsResetConfirm";
  }

  if (SETTINGS_ALIASES.has(normalized)) {
    return "settings";
  }

  if (TOKEN_LOG_ALIASES.has(normalized)) {
    return "tokenLog";
  }

  if (PROTOCOL_RESULTS_ALIASES.has(normalized)) {
    return "protocolResults";
  }

  if (normalized === "menu") {
    return "menu";
  }

  return undefined;
}
