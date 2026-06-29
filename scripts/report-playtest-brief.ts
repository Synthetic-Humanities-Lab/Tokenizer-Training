import { networkInterfaces } from "node:os";
import { pathToFileURL } from "node:url";
import {
  findAvailablePlaytestPort,
  probePort,
  type PortProbe
} from "./check-playtest-server";
import {
  probePlaytestLaunch,
  type PlaytestLaunchProbe
} from "./check-playtest-launch";
import {
  lanHostsFromInterfaces,
  playtestLinksForBase,
  recommendedPlaytestLaunch,
  type PlaytestLinkRenderOptions,
  type PlaytestRecommendedLaunch
} from "./print-playtest-links";
import {
  hasLanHostCandidate,
  isLocalHost,
  launchProbeIsReady,
  probeCandidatePlaytestLaunches,
  renderLaunchProbe
} from "./playtest-launch-candidates";
import { playtestPortHygieneLines } from "./playtest-port-hygiene";
import { buildPlaytestStatusReport, type PlaytestStatusReport } from "./report-playtest-status";

export interface PlaytestBriefOptions extends PlaytestLinkRenderOptions {
  sessionFiles?: string[];
}

export interface PlaytestBriefPortCheck {
  localProbe: PortProbe;
  lanProbe: PortProbe;
  ready: boolean;
  suggestedPort?: string;
  launchProbe?: PlaytestLaunchProbe;
  launchProbes?: PlaytestLaunchProbe[];
  lanLaunchProbes?: PlaytestLaunchProbe[];
  usableLaunch?: PlaytestRecommendedLaunch;
}

export interface PlaytestBriefReport {
  options: PlaytestBriefOptions;
  status: PlaytestStatusReport;
  portCheck?: PlaytestBriefPortCheck;
}

const defaultSessionFiles = [
  "docs/playtests/session-1.md",
  "docs/playtests/session-2.md",
  "docs/playtests/session-3.md",
  "docs/playtests/session-4.md",
  "docs/playtests/session-5.md"
];

export function buildPlaytestBrief(options: PlaytestBriefOptions): PlaytestBriefReport {
  return {
    options,
    status: buildPlaytestStatusReport(options.sessionFiles ?? defaultSessionFiles)
  };
}

export async function buildPlaytestBriefWithPortCheck(options: PlaytestBriefOptions): Promise<PlaytestBriefReport> {
  const baseReport = buildPlaytestBrief(options);
  const lanHosts = lanHostCandidates(options.hosts);
  const [localProbe, lanProbe] = await Promise.all([
    probePort("127.0.0.1", options.port),
    probePort("0.0.0.0", options.port)
  ]);
  const ready = localProbe.available && lanProbe.available;
  const launchCheck = ready ? undefined : await probeCandidatePlaytestLaunches(options, 1000, probePlaytestLaunch);
  const lanCandidateCheck = await probeLanLaunchCandidates(
    options,
    lanHosts,
    baseReport.status,
    launchCheck?.usableLaunch
  );
  const usableLaunch = lanCandidateCheck.usableLaunch ?? launchCheck?.usableLaunch;
  const sameMachineOnlyForMobile = statusRequiresLanButLaunchIsLocal(baseReport.status, usableLaunch, lanHosts);
  const existingServerUsable = !!usableLaunch && !sameMachineOnlyForMobile;

  return {
    ...baseReport,
    portCheck: {
      localProbe,
      lanProbe,
      ready,
      launchProbe: lanCandidateCheck.probe ?? launchCheck?.probe,
      launchProbes: launchCheck?.probes,
      lanLaunchProbes: lanCandidateCheck.probes,
      usableLaunch: sameMachineOnlyForMobile ? undefined : usableLaunch,
      suggestedPort: ready || existingServerUsable ? undefined : await findAvailablePlaytestPort(options.port)
    }
  };
}

export function renderPlaytestBrief(report: PlaytestBriefReport): string {
  const selectedPort = selectedPlaytestPort(report);
  const recommendation = selectedPlaytestLaunch(report, selectedPort);
  const recommendedLinks = playtestLinksForBase(recommendation.url);
  const serverCommand = playtestServerCommand(recommendation.network, selectedPort);
  const existingLaunchReady = portCheckLaunchCanServeNextSession(report);
  const status = report.status;
  const incomplete = status.statuses.filter((entry) => !entry.readyForRollup);
  const serverLines = existingLaunchReady
    ? [
      "Strict playtest server:",
      `  Already serving the game shell on port ${selectedPort}.`,
      `  Restart command if needed: ${serverCommand}`
    ]
    : [
      "Start strict playtest server:",
      `  ${serverCommand}`
    ];

  const lines = [
    "Tokenization Training playtest operator brief",
    "",
    "Preflight:",
    "  npm run playtest:preflight",
    "",
    ...serverLines,
    "",
    ...portGuidance(report, selectedPort, recommendation),
    "",
    "Recommended tester launch:",
    `  ${recommendation.url}`,
    "",
    "Physical-device sanity check:",
    ...physicalDeviceSanityCheck(recommendation.network),
    ...mobileNoteValidityChecklist(status),
    "",
    ...sessionMetadataGuidance(status, recommendation, selectedPort, sessionMetadataCanBeCopied(report, selectedPort)),
    "",
    "Useful controlled links for the same host:"
  ];

  for (const label of ["Tutorial start", "Handoff QA", "Results QA", "Protocol Results QA"]) {
    const link = recommendedLinks.find((entry) => entry.label === label);
    if (link) {
      lines.push(`  ${label}: ${link.url}`);
    }
  }

  lines.push(
    "",
    "Current note status:",
    `  Completed notes: ${status.completeCount}/${status.statuses.length}`,
    `  Completed real mobile/touch notes: ${status.mobileCount}`,
    `  Mobile metadata notes: ${status.mobileMetadataCount}`,
    `  Ready for rollup evaluator: ${status.readyForRollup ? "yes" : "no"}`
  );
  lines.push(...nextSessionGuidance(status));

  for (const entry of incomplete) {
    const tester = entry.testerId ? ` tester ${entry.testerId}` : "";
    lines.push(`  INCOMPLETE ${entry.file}${tester}: ${entry.missing.join(", ") || "unknown"}`);
  }

  lines.push(
    "",
    "During each session:",
    "  Start from the Recommended tester launch URL.",
    "  Do not explain tokenization, Wiener, the labor frame, or pay/cost before play.",
    "  Watch whether a restarted swipe on a visible blank run stays one cut, and whether returning to the centered blank slot cleans accidental ordinary-word duplicates without suppressing deliberate currency or punctuation token cuts.",
    "  Watch whether the static prompt stays centered in the active lane and clear of HUD, Wiener speech, review evidence, feedback, and controls.",
    "  Watch whether near-text Wiener speech is noticed without looking for a second panel.",
    "  Watch whether Wiener tutorial speech teaches both labor/browser fiction and tokenizer mechanics without facilitator explanation.",
    "  For phone/tablet sessions, record screenshot, photo, screen recording, or observer-note evidence naming HUD, static prompt text, review markers, feedback, Wiener speech, clipping, overlap, or finger occlusion.",
    "  Record whether play invited another round and whether the degraded visual style read as intentional rather than broken.",
    "  On the results screen, collect Copy Summary or the Save Summary fallback and paste it into the note.",
    "",
    "After each session:",
    "  npm run playtest:status",
    "",
    "After five sessions:",
    `  npm run playtest:evaluate -- ${(report.options.sessionFiles ?? defaultSessionFiles).join(" ")}`,
    "  npm run playtest:rollup",
    "  npm run playtest:evaluate-rollup -- docs/playtest_rollup_completed.md",
    "  npm run playtest:audit",
    "",
    "Broader playtest readiness requires five completed notes, at least one real phone/tablet touch session with Network: LAN and a non-localhost Launch URL, and a completed passing rollup."
  );

  return lines.join("\n");
}

function selectedPlaytestPort(report: PlaytestBriefReport): string {
  if (report.portCheck?.usableLaunch || portCheckLaunchCanServeNextSession(report)) {
    return report.options.port;
  }

  if (report.portCheck && !report.portCheck.ready && report.portCheck.suggestedPort) {
    return report.portCheck.suggestedPort;
  }

  return report.options.port;
}

function mobileNoteValidityChecklist(status: PlaytestStatusReport): string[] {
  if (status.mobileGateSatisfied) {
    return [];
  }

  const noteLine = status.nextSessionFile
    ? `  Note file: ${status.nextSessionFile}${status.nextSessionShouldBeMobile ? " is the required real-device mobile note." : "."}`
    : "  No incomplete note remains; replace or rerun one completed note as the required real-device mobile note.";

  return [
    "",
    "Mobile note validity checklist:",
    noteLine,
    "  Use a real phone/tablet/mobile browser with touch, pen, or mixed input; desktop emulation, trackpads, and desktop touchscreens do not count.",
    "  Copy Network: LAN and the non-localhost Launch URL only after launch-check passes with --host <network-host> and the actual device reaches the menu.",
    "  Record concrete visual evidence naming HUD, static prompt text, review markers, feedback, Wiener speech, clipping, overlap, or finger occlusion.",
    "  Leave the mobile note blank rather than filling it from same-machine or failed LAN proof."
  ];
}

function selectedPlaytestLaunch(report: PlaytestBriefReport, selectedPort: string): PlaytestRecommendedLaunch {
  return report.portCheck?.usableLaunch ?? recommendedPlaytestLaunch({ ...report.options, port: selectedPort });
}

function sessionMetadataCanBeCopied(report: PlaytestBriefReport, selectedPort: string): boolean {
  if (
    report.portCheck?.suggestedPort === selectedPort &&
    selectedPort !== report.options.port &&
    !report.portCheck.usableLaunch
  ) {
    return false;
  }

  return true;
}

function portGuidance(
  report: PlaytestBriefReport,
  selectedPort: string,
  selectedLaunch: PlaytestRecommendedLaunch
): string[] {
  if (!report.portCheck) {
    return [
      `Using port ${report.options.port}. Run \`npm run playtest:doctor -- --port ${report.options.port}\` before starting the server. If that port is occupied, inspect the listener, stop only a confirmed stale Vite process, or use the doctor's suggested free port, then rerun:`,
      "  npm run playtest:brief -- --port <chosen-port>",
      ...playtestPortHygieneLines(report.options.port, { indent: "  " })
    ];
  }

  const lines = [
    "Port check:",
    `  Strict same-machine bind: ${renderProbe(report.portCheck.localProbe)}`,
    `  Strict LAN bind: ${renderProbe(report.portCheck.lanProbe)}`
  ];
  if (report.portCheck.launchProbe) {
    lines.push(`  Existing launch URL: ${renderLaunchProbe(report.portCheck.launchProbe)}`);
  }
  if (report.portCheck.lanLaunchProbes && report.portCheck.lanLaunchProbes.length > 0) {
    lines.push("  LAN launch checks on requested port:");
    for (const probe of report.portCheck.lanLaunchProbes) {
      lines.push(`    ${probe.url}: ${renderLaunchProbe(probe)}`);
    }
  }

  if (report.portCheck.ready) {
    lines.push(`  Decision: using requested port ${selectedPort}.`);
    return lines;
  }

  if (portCheckIsSameMachineOnlyForMobile(report)) {
    lines.push("  Decision: requested port serves same-machine only; use a LAN-safe port before the required phone/tablet session.");
    appendSuggestedPortGuidance(lines, report, selectedPort);
    return lines;
  }

  if (portCheckLaunchCanServeNextSession(report)) {
    lines.push(`  Decision: requested port ${selectedPort} is already serving the game shell at ${selectedLaunch.url}.`);
    if (selectedLaunch.network === "same-machine" && hasLanHostCandidate(report.options.hosts)) {
      lines.push(
        "  Mobile gate: this same-machine proof does not validate phone/tablet access.",
        "  For a physical-device note, rerun with the exact Vite Network host:"
      );
      lines.push(`  npm run playtest:brief -- --host <network-host> --port ${selectedPort}`);
    }
    return lines;
  }

  lines.push("  Decision: requested port is not safe for a tester session.");
  appendSuggestedPortGuidance(lines, report, selectedPort);

  return lines;
}

function appendSuggestedPortGuidance(lines: string[], report: PlaytestBriefReport, selectedPort: string): void {
  if (!report.portCheck) {
    return;
  }

  lines.push(...playtestPortHygieneLines(report.options.port, { indent: "  " }));
  if (report.portCheck.suggestedPort) {
    lines.push(
      `  Suggested free port: ${report.portCheck.suggestedPort}`,
      `  This brief is using port ${selectedPort} for serve commands, launch links, and session metadata.`
    );
  } else {
    lines.push(
      "  No suggested port was found in the scan window.",
      "  Inspect the listener, stop only a confirmed stale Vite process, or choose a deliberate free port, then rerun:",
      "  npm run playtest:brief -- --port <chosen-port>"
    );
  }
}

function portCheckLaunchCanServeNextSession(report: PlaytestBriefReport): boolean {
  if (!report.portCheck || !launchProbeIsReady(report.portCheck.launchProbe)) {
    return false;
  }

  return !portCheckIsSameMachineOnlyForMobile(report);
}

function portCheckIsSameMachineOnlyForMobile(report: PlaytestBriefReport): boolean {
  if (
    !report.portCheck ||
    !report.status.nextSessionShouldBeMobile ||
    !hasLanHostCandidate(report.options.hosts) ||
    !launchProbeIsReady(report.portCheck.launchProbe)
  ) {
    return false;
  }

  const network = report.portCheck.usableLaunch?.network ?? launchProbeNetwork(report.portCheck.launchProbe);
  return network === "same-machine";
}

function launchProbeNetwork(probe?: PlaytestLaunchProbe): PlaytestRecommendedLaunch["network"] | undefined {
  if (!probe) {
    return undefined;
  }

  try {
    const host = new URL(probe.url).hostname;
    return isLocalHost(host) ? "same-machine" : "LAN";
  } catch {
    return undefined;
  }
}

async function probeLanLaunchCandidates(
  options: PlaytestBriefOptions,
  lanHosts: string[],
  status: PlaytestStatusReport,
  usableLaunch?: PlaytestRecommendedLaunch
): Promise<{
  probe?: PlaytestLaunchProbe;
  probes?: PlaytestLaunchProbe[];
  usableLaunch?: PlaytestRecommendedLaunch;
}> {
  if (!status.nextSessionShouldBeMobile || usableLaunch?.network !== "same-machine" || lanHosts.length === 0) {
    return {};
  }

  const results = await Promise.all(lanHosts.map(async (host) => {
    const launch = recommendedPlaytestLaunch({ ...options, hosts: [host] });
    return {
      launch,
      probe: await probePlaytestLaunch(launch.url, 1000)
    };
  }));
  const usable = results.find((result) => launchProbeIsReady(result.probe));

  return {
    probe: usable?.probe,
    probes: results.map((result) => result.probe),
    usableLaunch: usable?.launch
  };
}

function statusRequiresLanButLaunchIsLocal(
  status: PlaytestStatusReport,
  launch: PlaytestRecommendedLaunch | undefined,
  lanHosts: string[]
): boolean {
  return status.nextSessionShouldBeMobile && launch?.network === "same-machine" && lanHosts.length > 0;
}

function lanHostCandidates(hosts: string[]): string[] {
  return hosts.filter((host) => host.trim().length > 0 && !isLocalHost(host));
}

function renderProbe(probe: PortProbe): string {
  return probe.available ? "PASS" : `FAIL (${probe.issue ?? "unavailable"})`;
}

function physicalDeviceSanityCheck(network: "LAN" | "same-machine"): string[] {
  if (network === "LAN") {
    return [
      "  Before the tester arrives, open the Recommended tester launch on the actual phone/tablet and stop at the menu.",
      "  If it does not load, confirm the device is on the same trusted network, copy the exact host from Vite's Network URL, and rerun:",
      "  npm run playtest:brief -- --host <network-host> --port <chosen-port>",
      "  npm run playtest:launch-check -- --host <network-host> --port <chosen-port>"
    ];
  }

  return [
    "  Same-machine URLs do not prove phone/tablet access.",
    "  For a physical device session, restart with `npm run playtest:serve:lan`, use Vite's Network URL host, and rerun:",
    "  npm run playtest:brief -- --host <network-host> --port <chosen-port>",
    "  npm run playtest:launch-check -- --host <network-host> --port <chosen-port>"
  ];
}

function playtestServerCommand(network: "LAN" | "same-machine", port: string): string {
  const baseCommand = network === "LAN" ? "npm run playtest:serve:lan" : "npm run playtest:serve";
  return port === "5173" ? baseCommand : `${baseCommand} -- --port ${port}`;
}

function sessionMetadataGuidance(
  status: PlaytestStatusReport,
  recommendation: PlaytestRecommendedLaunch,
  selectedPort: string,
  copyReady = true
): string[] {
  if (status.nextSessionShouldBeMobile && recommendation.network !== "LAN") {
    return [
      "Session Metadata:",
      "  Do not copy same-machine metadata into the required mobile note.",
      "  Required mobile-gate metadata is not ready until the game is reachable from a real phone/tablet.",
      "  Start LAN serving, use Vite's Network host, rerun the brief, then copy:",
      "  Network: LAN",
      `  Launch URL: http://<network-host>:${selectedPort}/?playtestReset=1`,
      `  Current same-machine launch for desktop-only shakedown: ${recommendation.url}`
    ];
  }

  if (!copyReady) {
    return [
      "Session Metadata:",
      "  Do not copy planned launch metadata into a session note yet.",
      "  Start the strict server on the selected port, rerun launch-check for the exact host, and copy metadata only after the game shell passes.",
      "  For the required mobile note, the actual phone/tablet must also open the same URL and stop at the menu.",
      `  Planned Network: ${recommendation.network}`,
      `  Planned Launch URL: ${recommendation.url}`,
      `  Verification command: npm run playtest:launch-check -- --host ${recommendation.host} --port ${selectedPort}`
    ];
  }

  return [
    "Copy into Session Metadata before the tester starts:",
    `  Network: ${recommendation.network}`,
    `  Launch URL: ${recommendation.url}`
  ];
}

function nextSessionGuidance(status: PlaytestStatusReport): string[] {
  if (status.nextSessionFile) {
    const mobileNote = status.nextSessionShouldBeMobile
      ? " as the required real phone/tablet touch session"
      : "";
    return [`  Next session note: ${status.nextSessionFile}${mobileNote}`];
  }

  if (!status.mobileGateSatisfied) {
    return [
      "  Next session note: none incomplete; rerun or replace one note with a real phone/tablet touch session"
    ];
  }

  return ["  Next session note: none; run the evaluator sequence"];
}

export function parsePlaytestBriefArgs(args: string[]): PlaytestBriefOptions & { help: boolean } {
  const hosts: string[] = [];
  const sessionFiles: string[] = [];
  let port = "5173";
  let protocol = "http";
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

    sessionFiles.push(value);
  }

  return {
    help,
    hosts: hosts.length > 0 ? hosts : ["127.0.0.1", ...lanHostsFromInterfaces(networkInterfaces())],
    port,
    protocol,
    sessionFiles: sessionFiles.length > 0 ? sessionFiles : defaultSessionFiles
  };
}

function usage(): string {
  return [
    "Usage:",
    "  npm run playtest:brief",
    "  npm run playtest:brief -- --port <chosen-port>",
    "  npm run playtest:brief -- --host 192.168.1.20 --port 5174 --sessions docs/playtests/session-1.md ...",
    "",
    "Prints a compact operator brief with launch metadata, current note status, and final evaluator commands."
  ].join("\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const options = parsePlaytestBriefArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
  } else {
    console.log(renderPlaytestBrief(await buildPlaytestBriefWithPortCheck(options)));
  }
}
