import { networkInterfaces, type NetworkInterfaceInfo } from "node:os";
import { pathToFileURL } from "node:url";
import { playtestPortHygieneLines } from "./playtest-port-hygiene";

export interface PlaytestLink {
  label: string;
  url: string;
}

export interface PlaytestRecommendedLaunch {
  host: string;
  network: "LAN" | "same-machine";
  url: string;
}

export interface PlaytestLinkRenderOptions {
  hosts: string[];
  port: string;
  protocol?: string;
}

const DEFAULT_PORT = "5173";
const DEFAULT_PROTOCOL = "http";

const routeParams = [
  { label: "Controlled menu", params: { playtestReset: "1" } },
  { label: "Tutorial start", params: { mode: "tutorial", playtestReset: "1" } },
  { label: "Endless start", params: { mode: "endless", playtestReset: "1" } },
  { label: "Handoff QA", params: { mode: "tutorial-complete", playtestReset: "1" } },
  { label: "Failed Tutorial QA", params: { mode: "tutorial-failed", playtestReset: "1" } },
  { label: "Results QA", params: { mode: "results", playtestReset: "1" } },
  { label: "Protocol Results QA", params: { mode: "protocol-results", playtestReset: "1" } }
] as const;

export function lanHostsFromInterfaces(
  interfaces: NodeJS.Dict<NetworkInterfaceInfo[]> = networkInterfaces()
): string[] {
  const hosts = Object.values(interfaces)
    .flatMap((entries) => entries ?? [])
    .filter((entry) => isIpv4(entry) && !entry.internal)
    .map((entry) => entry.address);

  return [...new Set(hosts)].sort();
}

export function playtestLinksForBase(baseUrl: string): PlaytestLink[] {
  return routeParams.map((route) => {
    const url = new URL(baseUrl);
    url.search = "";
    for (const [key, value] of Object.entries(route.params)) {
      url.searchParams.set(key, value);
    }

    return {
      label: route.label,
      url: url.toString()
    };
  });
}

export function recommendedPlaytestLaunch(options: PlaytestLinkRenderOptions): PlaytestRecommendedLaunch {
  const protocol = options.protocol ?? DEFAULT_PROTOCOL;
  const uniqueHosts = [...new Set(options.hosts)].filter((host) => host.trim().length > 0);
  const hosts = uniqueHosts.length > 0 ? uniqueHosts : ["127.0.0.1"];
  const host = hosts.find((candidate) => candidate !== "127.0.0.1" && candidate !== "localhost") ?? hosts[0];
  const baseUrl = `${protocol}://${host}:${options.port}/`;
  const controlledMenu = playtestLinksForBase(baseUrl).find((link) => link.label === "Controlled menu");

  return {
    host,
    network: host === "127.0.0.1" || host === "localhost" ? "same-machine" : "LAN",
    url: controlledMenu?.url ?? baseUrl
  };
}

export function renderPlaytestLinks(options: PlaytestLinkRenderOptions): string {
  const protocol = options.protocol ?? DEFAULT_PROTOCOL;
  const uniqueHosts = [...new Set(options.hosts)].filter((host) => host.trim().length > 0);
  const hosts = uniqueHosts.length > 0 ? uniqueHosts : ["127.0.0.1"];
  const recommended = recommendedPlaytestLaunch({ ...options, hosts });
  const sections = hosts.map((host) => {
    const baseUrl = `${protocol}://${host}:${options.port}/`;
    const links = playtestLinksForBase(baseUrl)
      .map((link) => `  ${link.label}: ${link.url}`)
      .join("\n");

    return `Host ${host}\n${links}`;
  });

  return [
    "Tokenization Training playtest links",
    "",
    "Start same-network touch-device testing with a strict playtest port:",
    `  ${playtestLanServerCommand(options.port)}`,
    "",
    `Using port ${options.port}. If that port is occupied, inspect the listener, stop only a confirmed stale Vite process, or choose a deliberate free port and rerun with:`,
    "  npm run playtest:links -- --port <chosen-port>",
    "",
    ...playtestPortHygieneLines(options.port),
    "",
    "Recommended tester launch:",
    `  ${recommended.url}`,
    "",
    ...sessionMetadataLines(recommended),
    "",
    ...mobileNoteValidityLines(recommended),
    "",
    "For phone/tablet sessions, also record screenshot, photo, screen recording, or observer-note evidence naming readable surfaces.",
    "",
    ...sections
  ].join("\n");
}

function sessionMetadataLines(recommended: PlaytestRecommendedLaunch): string[] {
  const port = new URL(recommended.url).port;
  if (recommended.network !== "LAN") {
    return [
      "Session Metadata:",
      "  Do not copy same-machine metadata into the required mobile note.",
      "  Use this launch only for desktop/same-machine shakedown, or rerun with Vite's Network host.",
      "  Required mobile-gate metadata:",
      "  Network: LAN",
      `  Launch URL: http://<network-host>:${port}/?playtestReset=1`,
      `  Current same-machine launch for desktop-only shakedown: ${recommended.url}`
    ];
  }

  return [
    "Session Metadata:",
    "  Do not copy planned launch metadata into a session note yet.",
    "  Start the strict server on the selected port, rerun launch-check for the exact host, and copy metadata only after the game shell passes.",
    "  For the required mobile note, the actual phone/tablet must also open the same URL and stop at the menu.",
    `  Planned Network: ${recommended.network}`,
    `  Planned Launch URL: ${recommended.url}`,
    `  Verification command: npm run playtest:launch-check -- --host ${recommended.host} --port ${port}`
  ];
}

function mobileNoteValidityLines(recommended: PlaytestRecommendedLaunch): string[] {
  const port = new URL(recommended.url).port;
  return [
    "Mobile note validity:",
    "  Use a real phone/tablet/mobile browser with touch, pen, or mixed input; desktop emulation, trackpads, and desktop touchscreens do not count.",
    "  Copy LAN metadata only after launch-check passes for the exact Vite Network host and the actual device reaches the menu.",
    "  Record concrete visual evidence naming HUD, static prompt text, review markers, feedback, Wiener speech, clipping, overlap, or finger occlusion.",
    `  Check command: npm run playtest:launch-check -- --host ${recommended.network === "LAN" ? recommended.host : "<network-host>"} --port ${port}`
  ];
}

function playtestLanServerCommand(port: string): string {
  return port === DEFAULT_PORT ? "npm run playtest:serve:lan" : `npm run playtest:serve:lan -- --port ${port}`;
}

export function parsePlaytestLinkArgs(args: string[]): PlaytestLinkRenderOptions {
  const port = valueForFlag(args, "--port") ?? DEFAULT_PORT;
  const protocol = valueForFlag(args, "--protocol") ?? DEFAULT_PROTOCOL;
  const explicitHosts = valuesForFlag(args, "--host");
  const hosts = explicitHosts.length > 0 ? explicitHosts : ["127.0.0.1", ...lanHostsFromInterfaces()];

  return {
    hosts,
    port,
    protocol
  };
}

function valuesForFlag(args: string[], flag: string): string[] {
  const values: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === flag && args[index + 1]) {
      values.push(args[index + 1]);
      index += 1;
      continue;
    }

    if (value.startsWith(`${flag}=`)) {
      values.push(value.slice(flag.length + 1));
    }
  }

  return values;
}

function valueForFlag(args: string[], flag: string): string | undefined {
  return valuesForFlag(args, flag).at(-1);
}

function isIpv4(entry: NetworkInterfaceInfo): boolean {
  return entry.family === "IPv4";
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(renderPlaytestLinks(parsePlaytestLinkArgs(process.argv.slice(2))));
}
