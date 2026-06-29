import { networkInterfaces } from "node:os";
import { pathToFileURL } from "node:url";
import {
  lanHostsFromInterfaces,
  recommendedPlaytestLaunch,
  type PlaytestLinkRenderOptions,
  type PlaytestRecommendedLaunch
} from "./print-playtest-links";
import {
  hasLanHostCandidate,
  probeCandidatePlaytestLaunches
} from "./playtest-launch-candidates";
import { buildPlaytestStatusReport, type PlaytestStatusReport } from "./report-playtest-status";
import { PRODUCT_ROOT_LABEL, PRODUCT_TITLE } from "../src/game/systems/ProductIdentitySystem";

export interface PlaytestLaunchCheckOptions extends PlaytestLinkRenderOptions {
  timeoutMs: number;
  sessionFiles?: string[];
}

export interface PlaytestLaunchProbe {
  url: string;
  ok: boolean;
  status?: number;
  titleFound: boolean;
  gameRootFound: boolean;
  resetParamFound: boolean;
  issue?: string;
}

export interface PlaytestLaunchCheckReport {
  options: PlaytestLaunchCheckOptions;
  recommended: PlaytestRecommendedLaunch;
  probe: PlaytestLaunchProbe;
  sameMachineProbe?: PlaytestLaunchProbe;
  status: PlaytestStatusReport;
  ready: boolean;
}

interface FetchLikeResponse {
  ok: boolean;
  status: number;
  text(): Promise<string>;
}

type FetchLike = (url: string, init: { signal: AbortSignal }) => Promise<FetchLikeResponse>;

const DEFAULT_PORT = "5173";
const DEFAULT_PROTOCOL = "http";
const DEFAULT_TIMEOUT_MS = 5000;
const GAME_SHELL_TITLE = PRODUCT_TITLE;
const GAME_ROOT_LABEL = PRODUCT_ROOT_LABEL;
const defaultSessionFiles = [
  "docs/playtests/session-1.md",
  "docs/playtests/session-2.md",
  "docs/playtests/session-3.md",
  "docs/playtests/session-4.md",
  "docs/playtests/session-5.md"
];

export async function buildPlaytestLaunchCheck(
  options: PlaytestLaunchCheckOptions,
  fetchImpl: FetchLike = fetch
): Promise<PlaytestLaunchCheckReport> {
  const launchCheck = await probeCandidatePlaytestLaunches(
    options,
    options.timeoutMs,
    (url, timeoutMs) => probePlaytestLaunch(url, timeoutMs, fetchImpl)
  );
  const recommended = launchCheck.usableLaunch ?? launchCheck.launch ?? recommendedPlaytestLaunch(options);
  const probe = launchCheck.probe ?? await probePlaytestLaunch(recommended.url, options.timeoutMs, fetchImpl);
  const ready = probeIsReady(probe);
  const sameMachineProbe = await sameMachineProbeForFailedLan(options, recommended, ready, fetchImpl);

  return {
    options,
    recommended,
    probe,
    sameMachineProbe,
    status: buildPlaytestStatusReport(options.sessionFiles ?? defaultSessionFiles),
    ready
  };
}

export async function probePlaytestLaunch(
  url: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  fetchImpl: FetchLike = fetch
): Promise<PlaytestLaunchProbe> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(url, { signal: controller.signal });
    const body = await response.text();
    const titleFound = new RegExp(`<title>\\s*${escapeRegExp(GAME_SHELL_TITLE)}\\s*<\\/title>`, "i").test(body);
    const gameRootFound = new RegExp(`<main\\s+id=["']game-root["'][^>]*${escapeRegExp(GAME_ROOT_LABEL)}`, "i").test(body);

    return {
      url,
      ok: response.ok,
      status: response.status,
      titleFound,
      gameRootFound,
      resetParamFound: launchUrlHasPlaytestReset(url),
      issue: response.ok ? undefined : `HTTP ${response.status}`
    };
  } catch (error) {
    const issue = error instanceof Error && error.name === "AbortError"
      ? `request timed out after ${timeoutMs}ms`
      : error instanceof Error ? error.message : "request failed";

    return {
      url,
      ok: false,
      titleFound: false,
      gameRootFound: false,
      resetParamFound: launchUrlHasPlaytestReset(url),
      issue
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function renderPlaytestLaunchCheck(report: PlaytestLaunchCheckReport): string {
  const lines = [
    "Tokenization Training launch check",
    "",
    "Recommended tester launch:",
    `  ${report.recommended.url}`,
    "",
    "HTTP game shell:",
    `  ${renderProbeLine("HTTP response", report.probe.ok, statusOrIssue(report.probe))}`,
    `  ${renderProbeLine("Title", report.probe.titleFound, GAME_SHELL_TITLE)}`,
    `  ${renderProbeLine("Game root", report.probe.gameRootFound, "main#game-root")}`,
    `  ${renderProbeLine("Reset parameter", report.probe.resetParamFound, "playtestReset=1")}`,
    ...lanPathDiagnosis(report),
    ...mobileNoteValidityLines(report.status),
    "",
    ...sessionMetadataGuidance(report.status, report.recommended, report.options.port, report.ready),
    "",
    "Current note status:",
    `  Completed notes: ${report.status.completeCount}/${report.status.statuses.length}`,
    `  Completed real mobile/touch notes: ${report.status.mobileCount}`,
    `  Mobile metadata notes: ${report.status.mobileMetadataCount}`,
    `  Next session note: ${nextSessionLine(report.status)}`,
    "",
    `Decision: ${report.ready ? "launch URL is serving the game shell" : "fix server, host, or port before a tester session"}`,
    "",
    "Physical-device boundary:",
    "  This only proves the launch URL responds from this machine.",
    "  The required phone/tablet note still needs the actual device to open the same URL and stop at the menu."
  ];

  if (report.ready && report.recommended.network === "same-machine" && hasLanHostCandidate(report.options.hosts)) {
    lines.push(
      "",
      "Host selection note:",
      "  A same-machine candidate served the game shell first.",
      "  For a phone/tablet note, rerun with the exact Vite Network host:"
    );
    lines.push(`  npm run playtest:launch-check -- --host <network-host> --port ${report.options.port}`);
  }

  if (report.recommended.network !== "LAN") {
    lines.push(
      "",
      "Mobile gate warning:",
      "  This launch URL is same-machine. It cannot satisfy the real phone/tablet mobile gate."
    );
  }

  return lines.join("\n");
}

async function sameMachineProbeForFailedLan(
  options: PlaytestLaunchCheckOptions,
  recommended: PlaytestRecommendedLaunch,
  ready: boolean,
  fetchImpl: FetchLike
): Promise<PlaytestLaunchProbe | undefined> {
  if (ready || recommended.network !== "LAN") {
    return undefined;
  }

  const sameMachineLaunch = recommendedPlaytestLaunch({
    ...options,
    hosts: ["127.0.0.1"]
  });

  return probePlaytestLaunch(sameMachineLaunch.url, options.timeoutMs, fetchImpl);
}

function lanPathDiagnosis(report: PlaytestLaunchCheckReport): string[] {
  if (report.ready || report.recommended.network !== "LAN" || !report.sameMachineProbe) {
    return [];
  }

  const sameMachineReady = probeIsReady(report.sameMachineProbe);
  const lines = [
    "",
    "LAN path diagnosis:",
    `  Same-machine same-port check: ${sameMachineReady ? "PASS" : "FAIL"} (${probeReadinessSummary(report.sameMachineProbe)})`
  ];

  if (sameMachineReady) {
    lines.push(
      "  The game shell responds on this machine, but the LAN URL does not.",
      "  Check that the phone/tablet is on the same trusted network, the host exactly matches Vite's Network URL, and macOS firewall or VPN isolation is not blocking Vite before copying mobile metadata."
    );
  } else {
    lines.push(
      "  The same port did not serve the game shell locally either.",
      "  Start the strict server on the selected port before retrying the LAN launch check."
    );
  }

  return lines;
}

function probeIsReady(probe: PlaytestLaunchProbe | undefined): boolean {
  return Boolean(probe?.ok && probe.titleFound && probe.gameRootFound && probe.resetParamFound);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function probeReadinessSummary(probe: PlaytestLaunchProbe): string {
  return [
    probe.status !== undefined ? `HTTP ${probe.status}` : probe.issue ?? "no response",
    `title ${probe.titleFound ? "OK" : "missing"}`,
    `game root ${probe.gameRootFound ? "OK" : "missing"}`,
    `reset ${probe.resetParamFound ? "OK" : "missing"}`
  ].join("; ");
}

function mobileNoteValidityLines(status: PlaytestStatusReport): string[] {
  if (status.mobileGateSatisfied) {
    return [];
  }

  const target = status.nextSessionFile
    ? `${status.nextSessionFile}${status.nextSessionShouldBeMobile ? " must remain the required real-device note" : ""}`
    : "replace or rerun one completed note as the required real-device note";

  return [
    "",
    "Mobile note validity:",
    `  Target: ${target}.`,
    "  The mobile gate requires a real phone/tablet/mobile browser with touch, pen, or mixed input.",
    "  Copy LAN metadata only after this explicit host launch-check passes and the actual device reaches the same menu URL.",
    "  Record concrete visual evidence naming HUD, static prompt text, review markers, feedback, Wiener speech, clipping, overlap, or finger occlusion."
  ];
}

export function parsePlaytestLaunchCheckArgs(
  args: string[]
): PlaytestLaunchCheckOptions & { help: boolean } {
  const hosts: string[] = [];
  const sessionFiles: string[] = [];
  let port = DEFAULT_PORT;
  let protocol = DEFAULT_PROTOCOL;
  let timeoutMs = DEFAULT_TIMEOUT_MS;
  let help = false;
  let parsingSessions = false;

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];

    if (value === "--help" || value === "-h") {
      help = true;
      continue;
    }

    if (value === "--sessions") {
      parsingSessions = true;
      continue;
    }

    if (!parsingSessions && value === "--host" && args[index + 1]) {
      hosts.push(args[index + 1]);
      index += 1;
      continue;
    }

    if (!parsingSessions && value.startsWith("--host=")) {
      hosts.push(value.slice("--host=".length));
      continue;
    }

    if (!parsingSessions && value === "--port" && args[index + 1]) {
      port = args[index + 1];
      index += 1;
      continue;
    }

    if (!parsingSessions && value.startsWith("--port=")) {
      port = value.slice("--port=".length);
      continue;
    }

    if (!parsingSessions && value === "--protocol" && args[index + 1]) {
      protocol = args[index + 1];
      index += 1;
      continue;
    }

    if (!parsingSessions && value.startsWith("--protocol=")) {
      protocol = value.slice("--protocol=".length);
      continue;
    }

    if (!parsingSessions && value === "--timeout-ms" && args[index + 1]) {
      timeoutMs = parseTimeoutMs(args[index + 1]);
      index += 1;
      continue;
    }

    if (!parsingSessions && value.startsWith("--timeout-ms=")) {
      timeoutMs = parseTimeoutMs(value.slice("--timeout-ms=".length));
      continue;
    }

    sessionFiles.push(value);
  }

  return {
    help,
    hosts: hosts.length > 0 ? hosts : ["127.0.0.1", ...lanHostsFromInterfaces(networkInterfaces())],
    port,
    protocol,
    timeoutMs,
    sessionFiles: sessionFiles.length > 0 ? sessionFiles : defaultSessionFiles
  };
}

function renderProbeLine(label: string, pass: boolean, detail: string): string {
  return `${label}: ${pass ? "PASS" : "FAIL"} (${detail})`;
}

function statusOrIssue(probe: PlaytestLaunchProbe): string {
  if (probe.status !== undefined) {
    return probe.issue ? `${probe.status}; ${probe.issue}` : String(probe.status);
  }

  return probe.issue ?? "no response";
}

function nextSessionLine(status: PlaytestStatusReport): string {
  if (!status.nextSessionFile) {
    return status.mobileGateSatisfied ? "none; run evaluator sequence" : "none incomplete; replace one note with real phone/tablet evidence";
  }

  return `${status.nextSessionFile}${status.nextSessionShouldBeMobile ? " as the required real phone/tablet touch session" : ""}`;
}

function sessionMetadataGuidance(
  status: PlaytestStatusReport,
  recommended: PlaytestRecommendedLaunch,
  port: string,
  ready: boolean
): string[] {
  if (!ready) {
    const lines = [
      "Session Metadata:",
      "  Do not copy launch metadata from this failed check.",
      "  Fix the server, host, or port, then rerun launch-check until HTTP, title, game root, and reset all pass."
    ];

    if (status.nextSessionShouldBeMobile) {
      lines.push(
        "  Required mobile-gate metadata is still unavailable until a LAN launch passes and the real phone/tablet opens it."
      );
    }

    lines.push(`  Failed launch candidate: ${recommended.url}`);
    return lines;
  }

  if (status.nextSessionShouldBeMobile && recommended.network !== "LAN") {
    return [
      "Session Metadata:",
      "  Do not copy same-machine metadata into the required mobile note.",
      "  Required mobile-gate metadata is not ready until the game is reachable from a real phone/tablet.",
      "  Start LAN serving, use Vite's Network host, rerun the brief, then copy:",
      "  Network: LAN",
      `  Launch URL: http://<network-host>:${port}/?playtestReset=1`,
      `  Current same-machine launch for desktop-only shakedown: ${recommended.url}`
    ];
  }

  return [
    "Copy into Session Metadata before the tester starts:",
    `  Network: ${recommended.network}`,
    `  Launch URL: ${recommended.url}`
  ];
}

function launchUrlHasPlaytestReset(value: string): boolean {
  try {
    return new URL(value).searchParams.get("playtestReset") === "1";
  } catch {
    return false;
  }
}

function parseTimeoutMs(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
}

function usage(): string {
  return [
    "Usage:",
    "  npm run playtest:launch-check -- --port <chosen-port>",
    "  npm run playtest:launch-check -- --host <network-host> --port <chosen-port>",
    "",
    "Run after starting the strict playtest server. It verifies the reset-safe launch URL serves the game shell."
  ].join("\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const options = parsePlaytestLaunchCheckArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    process.exitCode = 0;
  } else {
    const report = await buildPlaytestLaunchCheck(options);
    console.log(renderPlaytestLaunchCheck(report));
    process.exitCode = report.ready ? 0 : 1;
  }
}
