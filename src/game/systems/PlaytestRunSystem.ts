import { PLAYTEST_RUN_PREFIX } from "./ProductIdentitySystem";

export function playtestRunIdFromDate(date: Date): string {
  if (!Number.isFinite(date.getTime())) {
    return `${PLAYTEST_RUN_PREFIX}-unknown-time`;
  }

  const iso = date.toISOString();
  const day = iso.slice(0, 10).replaceAll("-", "");
  const time = iso.slice(11, 19).replaceAll(":", "");
  return `${PLAYTEST_RUN_PREFIX}-${day}-${time}z`;
}

export function playtestRunSummaryLine(runId: string | undefined): string {
  const trimmed = runId?.trim();
  return trimmed ? `Run ID: ${trimmed}` : "Run ID: not captured";
}
