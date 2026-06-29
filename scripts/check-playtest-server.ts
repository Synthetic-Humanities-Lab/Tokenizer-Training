import { createServer } from "node:net";
import { networkInterfaces } from "node:os";
import { pathToFileURL } from "node:url";
import { probePlaytestLaunch, type PlaytestLaunchProbe } from "./check-playtest-launch";
import {
  lanHostsFromInterfaces,
  recommendedPlaytestLaunch,
  type PlaytestRecommendedLaunch
} from "./print-playtest-links";
import {
  launchProbeIsReady,
  probeCandidatePlaytestLaunches,
  renderLaunchProbe
} from "./playtest-launch-candidates";
import { playtestPortHygieneLines } from "./playtest-port-hygiene";
import { buildPlaytestStatusReport, type PlaytestStatusReport } from "./report-playtest-status";

export interface PlaytestServerDoctorOptions {
  hosts: string[];
  port: string;
}

export interface PortProbe {
  host: string;
  port: string;
  available: boolean;
  issue?: string;
}

export interface PlaytestServerDoctorReport {
  options: PlaytestServerDoctorOptions;
  localProbe: PortProbe;
  lanProbe: PortProbe;
  suggestedPort?: string;
  launchProbe?: PlaytestLaunchProbe;
  launchProbes?: PlaytestLaunchProbe[];
  lanLaunchProbes?: PlaytestLaunchProbe[];
  usableLaunch?: PlaytestRecommendedLaunch;
  lanHosts: string[];
  status: PlaytestStatusReport;
  ready: boolean;
}

const DEFAULT_PORT = "5173";
const SUGGESTION_SCAN_LIMIT = 40;

export async function buildPlaytestServerDoctor(
  options: PlaytestServerDoctorOptions
): Promise<PlaytestServerDoctorReport> {
  const lanHosts = options.hosts.filter((host) => host !== "127.0.0.1" && host !== "localhost");
  const status = buildPlaytestStatusReport();
  const [localProbe, lanProbe] = await Promise.all([
    probePort("127.0.0.1", options.port),
    probePort("0.0.0.0", options.port)
  ]);
  const ready = localProbe.available && lanProbe.available;
  const launchCheck = ready ? undefined : await probeCandidatePlaytestLaunches(options, 1000, probePlaytestLaunch);
  const lanCandidateCheck = await probeLanLaunchCandidates(options, lanHosts, status, launchCheck?.usableLaunch);
  const usableLaunch = lanCandidateCheck.usableLaunch ?? launchCheck?.usableLaunch;
  const sameMachineOnlyForMobile =
    status.nextSessionShouldBeMobile &&
    usableLaunch?.network === "same-machine" &&
    lanHosts.length > 0;
  const existingServerUsable = !!usableLaunch && !sameMachineOnlyForMobile;
  const suggestedPort = ready || existingServerUsable ? undefined : await findAvailablePlaytestPort(options.port);

  return {
    options,
    localProbe,
    lanProbe,
    suggestedPort,
    launchProbe: lanCandidateCheck.probe ?? launchCheck?.probe,
    launchProbes: launchCheck?.probes,
    lanLaunchProbes: lanCandidateCheck.probes,
    usableLaunch: sameMachineOnlyForMobile ? undefined : usableLaunch,
    lanHosts,
    status,
    ready
  };
}

export function renderPlaytestServerDoctor(report: PlaytestServerDoctorReport): string {
  const issues = doctorIssues(report);
  const commandPort = !report.ready && !report.usableLaunch && report.suggestedPort
    ? report.suggestedPort
    : report.options.port;
  const launch = report.usableLaunch ?? recommendedPlaytestLaunch({
    hosts: report.options.hosts,
    port: commandPort
  });
  const lines = [
    "Tokenizer Training playtest server doctor",
    "",
    `Port: ${report.options.port}`,
    `Strict same-machine bind: ${renderProbe(report.localProbe)}`,
    `Strict LAN bind: ${renderProbe(report.lanProbe)}`,
    `LAN host candidates: ${report.lanHosts.length > 0 ? report.lanHosts.join(", ") : "none detected"}`,
    "",
    `Completed notes: ${report.status.completeCount}/${report.status.statuses.length}`,
    `Completed real mobile/touch notes: ${report.status.mobileCount}`,
    `Mobile metadata notes: ${report.status.mobileMetadataCount}`,
    `Next session note: ${nextSessionLine(report.status)}`,
    ""
  ];

  if (report.launchProbe) {
    lines.push(`Existing launch URL: ${renderLaunchProbe(report.launchProbe)}`);
  }
  if (report.lanLaunchProbes && report.lanLaunchProbes.length > 0) {
    lines.push("LAN launch checks on requested port:");
    for (const probe of report.lanLaunchProbes) {
      lines.push(`  ${probe.url}: ${renderLaunchProbe(probe)}`);
    }
  }

  lines.push(`Decision: ${doctorDecision(report, launch)}`);
  lines.push(...mobileNoteValidityLines(report.status));

  if (report.usableLaunch && launch.network === "same-machine" && report.lanHosts.length > 0) {
    lines.push(
      "",
      "Mobile gate warning:",
      "- Existing same-machine proof does not validate phone/tablet access.",
      `- For a physical-device note, rerun: npm run playtest:brief -- --host <network-host> --port ${commandPort}`
    );
  }

  if (!report.ready) {
    lines.push("", ...playtestPortHygieneLines(report.options.port));
  }

  if (issues.length > 0) {
    lines.push("", "Issues:");
    for (const issue of issues) {
      lines.push(`- ${issue}`);
    }
  }

  if (!report.ready && !report.usableLaunch && report.suggestedPort) {
    lines.push(
      "",
      `Suggested free port: ${report.suggestedPort}`,
      "Use one port consistently for serve, brief, links, and session metadata."
    );
  }

  lines.push(
    "",
    `Recommended tester launch${commandPort !== report.options.port ? ` using suggested port ${commandPort}` : ""}:`,
    `  ${launch.url}`,
    "",
    ...sessionMetadataGuidance(report.status, launch, commandPort, Boolean(report.usableLaunch)),
    "",
    `Recommended launch commands${commandPort !== report.options.port ? ` using suggested port ${commandPort}` : ""}:`,
    "Desktop/same-machine session:",
    `  ${serveCommand("npm run playtest:serve", commandPort)}`,
    "Required phone/tablet touch session:",
    `  ${serveCommand("npm run playtest:serve:lan", commandPort)}`,
    "Then print launch metadata with:",
    `  ${briefCommand(commandPort)}`,
    "Optional controlled links with:",
    `  ${linksCommand(commandPort)}`
  );

  if (report.lanHosts.length === 0) {
    lines.push(
      "",
      "LAN note:",
      "- No non-localhost IPv4 host was detected. A real phone/tablet session still needs Network: LAN and a non-localhost Launch URL."
    );
  }

  return lines.join("\n");
}

export function parsePlaytestServerDoctorArgs(args: string[]): PlaytestServerDoctorOptions & { help: boolean } {
  const hosts: string[] = [];
  let port = DEFAULT_PORT;
  let help = false;

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];

    if (value === "--help" || value === "-h") {
      help = true;
      continue;
    }

    if (value === "--port" && args[index + 1]) {
      port = args[index + 1];
      index += 1;
      continue;
    }

    if (value.startsWith("--port=")) {
      port = value.slice("--port=".length);
      continue;
    }

    if (value === "--host" && args[index + 1]) {
      hosts.push(args[index + 1]);
      index += 1;
      continue;
    }

    if (value.startsWith("--host=")) {
      hosts.push(value.slice("--host=".length));
    }
  }

  return {
    help,
    hosts: hosts.length > 0 ? hosts : ["127.0.0.1", ...lanHostsFromInterfaces(networkInterfaces())],
    port
  };
}

export async function probePort(host: string, port: string): Promise<PortProbe> {
  const numericPort = Number.parseInt(port, 10);
  if (!Number.isInteger(numericPort) || numericPort < 1 || numericPort > 65535) {
    return {
      host,
      port,
      available: false,
      issue: `${host}:${port} is not a valid TCP port`
    };
  }

  return new Promise((resolveProbe) => {
    const server = createServer();
    let settled = false;

    const finish = (probe: PortProbe): void => {
      if (settled) return;
      settled = true;
      resolveProbe(probe);
    };

    server.once("error", (error: NodeJS.ErrnoException) => {
      finish({
        host,
        port,
        available: false,
        issue: error.code === "EADDRINUSE"
          ? `${host}:${port} is already listening`
          : `${host}:${port} cannot be probed: ${error.code ?? error.message}`
      });
    });

    server.listen({ host, port: numericPort }, () => {
      server.close(() => finish({ host, port, available: true }));
    });
  });
}

export async function findAvailablePlaytestPort(
  startingPort: string,
  scanLimit = SUGGESTION_SCAN_LIMIT
): Promise<string | undefined> {
  const numericPort = Number.parseInt(startingPort, 10);
  if (!Number.isInteger(numericPort) || numericPort < 1 || numericPort > 65535) {
    return undefined;
  }

  for (let candidate = numericPort + 1; candidate <= 65535 && candidate <= numericPort + scanLimit; candidate += 1) {
    const port = String(candidate);
    const [localProbe, lanProbe] = await Promise.all([
      probePort("127.0.0.1", port),
      probePort("0.0.0.0", port)
    ]);

    if (localProbe.available && lanProbe.available) {
      return port;
    }
  }

  return undefined;
}

function renderProbe(probe: PortProbe): string {
  return probe.available ? "PASS" : `FAIL (${probe.issue ?? "unavailable"})`;
}

function doctorIssues(report: PlaytestServerDoctorReport): string[] {
  if (report.usableLaunch) {
    return [];
  }

  return [report.localProbe, report.lanProbe]
    .filter((probe) => !probe.available)
    .map((probe) =>
      `${probe.issue ?? `${probe.host}:${probe.port} unavailable`}. Stop stale Vite servers or use the suggested free port and pass it to serve, brief, and links.`
    );
}

function doctorDecision(report: PlaytestServerDoctorReport, launch: PlaytestRecommendedLaunch): string {
  if (report.ready) {
    return "strict playtest port is available";
  }

  if (
    report.status.nextSessionShouldBeMobile &&
    report.launchProbe &&
    launchProbeIsReady(report.launchProbe) &&
    !report.usableLaunch &&
    report.lanHosts.length > 0
  ) {
    return "requested port serves same-machine only; use a LAN-safe port before the required phone/tablet session";
  }

  if (report.usableLaunch) {
    return `requested port is already serving the game shell at ${launch.url}`;
  }

  return "resolve server port before tester session";
}

async function probeLanLaunchCandidates(
  options: PlaytestServerDoctorOptions,
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

function nextSessionLine(status: PlaytestStatusReport): string {
  if (!status.nextSessionFile) {
    return status.mobileGateSatisfied ? "none; run evaluator sequence" : "none incomplete; replace one note with real phone/tablet evidence";
  }

  return `${status.nextSessionFile}${status.nextSessionShouldBeMobile ? " as the required real phone/tablet touch session" : ""}`;
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
    `- Target: ${target}.`,
    "- Use a real phone/tablet/mobile browser with touch, pen, or mixed input; desktop emulation, trackpads, and desktop touchscreens do not count.",
    "- Copy LAN metadata only after launch-check passes for the exact Vite Network host and the actual device reaches the menu.",
    "- Record concrete visual evidence naming HUD, static prompt text, review markers, feedback, Wiener speech, clipping, overlap, or finger occlusion."
  ];
}

function serveCommand(command: string, port: string): string {
  return port === DEFAULT_PORT ? command : `${command} -- --port ${port}`;
}

function sessionMetadataGuidance(
  status: PlaytestStatusReport,
  launch: PlaytestRecommendedLaunch,
  port: string,
  launchVerified: boolean
): string[] {
  if (status.nextSessionShouldBeMobile && launch.network !== "LAN") {
    return [
      "Session Metadata:",
      "  Do not copy same-machine metadata into the required mobile note.",
      "  Required mobile-gate metadata is not ready until the game is reachable from a real phone/tablet.",
      "  Start LAN serving, use Vite's Network host, rerun the brief, then copy:",
      "  Network: LAN",
      `  Launch URL: http://<network-host>:${port}/?playtestReset=1`,
      `  Current same-machine launch for desktop-only shakedown: ${launch.url}`
    ];
  }

  if (!launchVerified) {
    const lines = [
      "Session Metadata:",
      "  Do not copy planned launch metadata into a session note yet.",
      "  Start the strict server on the selected port, rerun launch-check for the exact host, and copy metadata only after the game shell passes."
    ];

    if (status.nextSessionShouldBeMobile) {
      lines.push("  For the required mobile note, the actual phone/tablet must also open the same URL and stop at the menu.");
    }

    lines.push(
      `  Planned Network: ${launch.network}`,
      `  Planned Launch URL: ${launch.url}`,
      `  Verification command: npm run playtest:launch-check -- --host ${launch.host} --port ${port}`
    );
    return lines;
  }

  return [
    "Copy into Session Metadata before the tester starts:",
    `  Network: ${launch.network}`,
    `  Launch URL: ${launch.url}`
  ];
}

function briefCommand(port: string): string {
  return port === DEFAULT_PORT ? "npm run playtest:brief" : `npm run playtest:brief -- --port ${port}`;
}

function linksCommand(port: string): string {
  return port === DEFAULT_PORT ? "npm run playtest:links" : `npm run playtest:links -- --port ${port}`;
}

function usage(): string {
  return [
    "Usage:",
    "  npm run playtest:doctor",
    "  npm run playtest:doctor -- --port <chosen-port>",
    "",
    "Run before starting the playtest server. It checks whether the strict playtest port is free and prints the next launch commands."
  ].join("\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const options = parsePlaytestServerDoctorArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    process.exitCode = 0;
  } else {
    const report = await buildPlaytestServerDoctor(options);
    console.log(renderPlaytestServerDoctor(report));
    process.exitCode = report.ready || report.usableLaunch ? 0 : 1;
  }
}
