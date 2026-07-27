import { networkInterfaces } from "node:os";
import { pathToFileURL } from "node:url";
import {
  lanHostsFromInterfaces,
  type PlaytestLink,
  type PlaytestLinkRenderOptions
} from "./print-playtest-links";

const DEFAULT_PORT = "5173";
const DEFAULT_PROTOCOL = "http";

const qaRouteParams = [
  {
    label: "Desktop frozen tutorial active",
    params: { mode: "tutorial", playtestReset: "1", qaViewport: "1280x720", qaFreezeElapsedMs: "6200" }
  },
  {
    label: "Portrait frozen tutorial active",
    params: { mode: "tutorial", playtestReset: "1", qaViewport: "390x844", qaFreezeElapsedMs: "6200" }
  },
  {
    label: "Small-phone frozen tutorial active",
    params: { mode: "tutorial", playtestReset: "1", qaViewport: "320x568", qaFreezeElapsedMs: "6200" }
  },
  {
    label: "Desktop frozen endless active pinned fixture",
    params: {
      mode: "endless",
      playtestReset: "1",
      qaViewport: "1280x720",
      qaFreezeElapsedMs: "6200",
      qaFixtureId: "simple_001"
    }
  },
  {
    label: "Mobile-surface small-phone frozen tutorial active",
    params: {
      surface: "mobile",
      mode: "tutorial",
      playtestReset: "1",
      qaViewport: "368x552",
      qaFreezeElapsedMs: "6200"
    }
  },
  {
    label: "Mobile-surface small-phone frozen endless active pinned fixture",
    params: {
      surface: "mobile",
      mode: "endless",
      playtestReset: "1",
      qaViewport: "368x552",
      qaFreezeElapsedMs: "6200",
      qaFixtureId: "simple_001"
    }
  },
  {
    label: "Mobile-surface portrait frozen tutorial active",
    params: {
      surface: "mobile",
      mode: "tutorial",
      playtestReset: "1",
      qaViewport: "390x844",
      qaFreezeElapsedMs: "6200"
    }
  },
  {
    label: "Desktop handoff QA",
    params: { mode: "tutorial-complete", playtestReset: "1", qaViewport: "1280x720" }
  },
  {
    label: "Desktop failed tutorial QA",
    params: { mode: "tutorial-failed", playtestReset: "1", qaViewport: "1280x720" }
  },
  {
    label: "Small-phone handoff QA",
    params: { mode: "tutorial-complete", playtestReset: "1", qaViewport: "320x568" }
  },
  {
    label: "Small-phone failed tutorial QA",
    params: { mode: "tutorial-failed", playtestReset: "1", qaViewport: "320x568" }
  },
  {
    label: "Mobile-surface tall handoff QA",
    params: { surface: "mobile", mode: "tutorial-complete", playtestReset: "1", qaViewport: "368x800" }
  },
  {
    label: "Mobile-surface tall failed tutorial QA",
    params: { surface: "mobile", mode: "tutorial-failed", playtestReset: "1", qaViewport: "368x800" }
  },
  {
    label: "Small-phone semantic Token Log QA",
    params: {
      mode: "token-log",
      semanticUi: "visible",
      playtestReset: "1",
      qaViewport: "320x568"
    }
  },
  {
    label: "Mobile-surface tall semantic Token Log QA",
    params: {
      surface: "mobile",
      mode: "token-log",
      semanticUi: "visible",
      playtestReset: "1",
      qaViewport: "368x800"
    }
  },
  {
    label: "Portrait protocol results QA",
    params: { mode: "protocol-results", playtestReset: "1", qaViewport: "390x844" }
  },
  {
    label: "Small-phone protocol results QA",
    params: { mode: "protocol-results", playtestReset: "1", qaViewport: "320x568" }
  },
  {
    label: "Mobile-surface small-phone protocol results QA",
    params: { surface: "mobile", mode: "protocol-results", playtestReset: "1", qaViewport: "368x552" }
  }
] as const;

export function playtestQaLinksForBase(baseUrl: string): PlaytestLink[] {
  return qaRouteParams.map((route) => {
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

export function renderPlaytestQaLinks(options: PlaytestLinkRenderOptions): string {
  const protocol = options.protocol ?? DEFAULT_PROTOCOL;
  const hosts = [...new Set(options.hosts)].filter((host) => host.trim().length > 0);
  const targetHosts = hosts.length > 0 ? hosts : ["127.0.0.1"];
  const sections = targetHosts.map((host) => {
    const baseUrl = `${protocol}://${host}:${options.port}/`;
    const links = playtestQaLinksForBase(baseUrl)
      .map((link) => `  ${link.label}: ${link.url}`)
      .join("\n");

    return `Host ${host}\n${links}`;
  });

  return [
    "Tokenizer Training internal visual QA links",
    "",
    "Use these before a tester session to inspect deterministic canvas QA states.",
    "Do not use these URLs for tester sessions or real mobile evidence.",
    "",
    `Using port ${options.port}. If Vite prints another port, rerun with:`,
    "  npm run playtest:qa-links -- --port <printed-port>",
    "",
    "Capture notes:",
    "  qaViewport fixes the internal Phaser canvas size.",
    "  qaFreezeElapsedMs freezes active PlayScene motion for repeatable canvas capture.",
    "  qaFixtureId pins endless/main-mode QA to one tokenizer fixture for browser/mobile comparison.",
    "  qaHoldReview=1 can hold internal endless review only while capturing evidence.",
    "  These links still do not prove physical touch readability or player comprehension.",
    "",
    ...sections
  ].join("\n");
}

export function parsePlaytestQaLinkArgs(args: string[]): PlaytestLinkRenderOptions {
  const port = valueForFlag(args, "--port") ?? DEFAULT_PORT;
  const protocol = valueForFlag(args, "--protocol") ?? DEFAULT_PROTOCOL;
  const explicitHosts = valuesForFlag(args, "--host");
  const hosts = explicitHosts.length > 0 ? explicitHosts : ["127.0.0.1", ...lanHostsFromInterfaces(networkInterfaces())];

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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(renderPlaytestQaLinks(parsePlaytestQaLinkArgs(process.argv.slice(2))));
}
