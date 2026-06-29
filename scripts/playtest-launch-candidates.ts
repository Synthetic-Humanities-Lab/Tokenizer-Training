import {
  recommendedPlaytestLaunch,
  type PlaytestLinkRenderOptions,
  type PlaytestRecommendedLaunch
} from "./print-playtest-links";
import type { PlaytestLaunchProbe } from "./check-playtest-launch";

export interface PlaytestLaunchCandidateResult {
  launch?: PlaytestRecommendedLaunch;
  probe?: PlaytestLaunchProbe;
  probes: PlaytestLaunchProbe[];
  usableLaunch?: PlaytestRecommendedLaunch;
}

export type PlaytestLaunchProbeFn = (
  url: string,
  timeoutMs: number
) => Promise<PlaytestLaunchProbe>;

export async function probeCandidatePlaytestLaunches(
  options: PlaytestLinkRenderOptions,
  timeoutMs: number,
  probeLaunch: PlaytestLaunchProbeFn
): Promise<PlaytestLaunchCandidateResult> {
  const results: Array<{ launch: PlaytestRecommendedLaunch; probe: PlaytestLaunchProbe }> = [];

  for (const group of playtestLaunchCandidateGroups(options)) {
    const groupResults = await Promise.all(group.map(async (launch) => ({
      launch,
      probe: await probeLaunch(launch.url, timeoutMs)
    })));
    results.push(...groupResults);
    const usable = groupResults.find((result) => launchProbeIsReady(result.probe));

    if (usable) {
      return {
        launch: usable.launch,
        probe: usable.probe,
        probes: results.map((result) => result.probe),
        usableLaunch: usable.launch
      };
    }
  }

  return {
    launch: results[0]?.launch,
    probe: results[0]?.probe,
    probes: results.map((result) => result.probe)
  };
}

export function launchProbeIsReady(probe?: PlaytestLaunchProbe): boolean {
  return !!probe && probe.ok && probe.titleFound && probe.gameRootFound && probe.resetParamFound;
}

export function renderLaunchProbe(probe: PlaytestLaunchProbe): string {
  const ready = launchProbeIsReady(probe);
  const details = [
    probe.status ? `HTTP ${probe.status}` : probe.issue ?? "no response",
    probe.titleFound ? "title OK" : "title missing",
    probe.gameRootFound ? "game root OK" : "game root missing",
    probe.resetParamFound ? "reset OK" : "reset missing"
  ];

  return `${ready ? "PASS" : "FAIL"} (${details.join("; ")})`;
}

export function isLocalHost(host: string): boolean {
  return host === "127.0.0.1" || host === "localhost";
}

export function hasLanHostCandidate(hosts: string[]): boolean {
  return hosts.some((host) => host.trim().length > 0 && !isLocalHost(host));
}

function playtestLaunchCandidateGroups(options: PlaytestLinkRenderOptions): PlaytestRecommendedLaunch[][] {
  const uniqueHosts = [...new Set(options.hosts)].filter((host) => host.trim().length > 0);
  const hosts = uniqueHosts.length > 0 ? uniqueHosts : ["127.0.0.1"];
  const localHosts = hosts.filter(isLocalHost);
  const lanHosts = hosts.filter((host) => !isLocalHost(host));

  return [localHosts, lanHosts]
    .filter((group) => group.length > 0)
    .map((group) => group.map((host) => recommendedPlaytestLaunch({
      ...options,
      hosts: [host]
    })));
}
