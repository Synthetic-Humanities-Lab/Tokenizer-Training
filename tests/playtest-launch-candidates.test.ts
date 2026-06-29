import { describe, expect, it } from "vitest";
import {
  hasLanHostCandidate,
  isLocalHost,
  launchProbeIsReady,
  probeCandidatePlaytestLaunches,
  renderLaunchProbe
} from "../scripts/playtest-launch-candidates";

describe("playtest launch candidates", () => {
  it("probes same-machine candidates first and stops after a ready local shell", async () => {
    const probedUrls: string[] = [];
    const result = await probeCandidatePlaytestLaunches({
      hosts: ["203.0.113.9", "127.0.0.1"],
      port: "5173",
      protocol: "http"
    }, 1000, async (url, timeoutMs) => {
      probedUrls.push(`${url} timeout=${timeoutMs}`);
      const ready = url.startsWith("http://127.0.0.1:");

      return {
        url,
        ok: ready,
        status: ready ? 200 : undefined,
        titleFound: ready,
        gameRootFound: ready,
        resetParamFound: url.includes("playtestReset=1"),
        issue: ready ? undefined : "request timed out"
      };
    });

    expect(probedUrls).toEqual(["http://127.0.0.1:5173/?playtestReset=1 timeout=1000"]);
    expect(result.launch).toEqual({
      host: "127.0.0.1",
      network: "same-machine",
      url: "http://127.0.0.1:5173/?playtestReset=1"
    });
    expect(result.usableLaunch).toEqual(result.launch);
    expect(result.probes).toHaveLength(1);
  });

  it("falls back to LAN candidates when same-machine candidates are not ready", async () => {
    const probedUrls: string[] = [];
    const result = await probeCandidatePlaytestLaunches({
      hosts: ["127.0.0.1", "192.168.1.20"],
      port: "5174",
      protocol: "http"
    }, 1000, async (url) => {
      probedUrls.push(url);
      const ready = url.startsWith("http://192.168.1.20:");

      return {
        url,
        ok: ready,
        status: ready ? 200 : undefined,
        titleFound: ready,
        gameRootFound: ready,
        resetParamFound: url.includes("playtestReset=1"),
        issue: ready ? undefined : "wrong shell"
      };
    });

    expect(probedUrls).toEqual([
      "http://127.0.0.1:5174/?playtestReset=1",
      "http://192.168.1.20:5174/?playtestReset=1"
    ]);
    expect(result.launch).toEqual({
      host: "192.168.1.20",
      network: "LAN",
      url: "http://192.168.1.20:5174/?playtestReset=1"
    });
    expect(result.usableLaunch).toEqual(result.launch);
    expect(result.probes).toHaveLength(2);
  });

  it("returns the first attempted launch when no candidate is ready", async () => {
    const result = await probeCandidatePlaytestLaunches({
      hosts: ["127.0.0.1", "192.168.1.20"],
      port: "5175",
      protocol: "http"
    }, 1000, async (url) => ({
      url,
      ok: false,
      titleFound: false,
      gameRootFound: false,
      resetParamFound: url.includes("playtestReset=1"),
      issue: "request failed"
    }));

    expect(result.launch).toEqual({
      host: "127.0.0.1",
      network: "same-machine",
      url: "http://127.0.0.1:5175/?playtestReset=1"
    });
    expect(result.probe).toMatchObject({
      url: "http://127.0.0.1:5175/?playtestReset=1",
      ok: false
    });
    expect(result.usableLaunch).toBeUndefined();
    expect(result.probes).toHaveLength(2);
  });

  it("requires a full game-shell probe before marking a launch ready", () => {
    expect(launchProbeIsReady({
      url: "http://127.0.0.1:5173/?playtestReset=1",
      ok: true,
      status: 200,
      titleFound: true,
      gameRootFound: true,
      resetParamFound: true
    })).toBe(true);

    expect(launchProbeIsReady({
      url: "http://127.0.0.1:5173/",
      ok: true,
      status: 200,
      titleFound: true,
      gameRootFound: true,
      resetParamFound: false
    })).toBe(false);
  });

  it("renders compact probe details for operator output", () => {
    expect(renderLaunchProbe({
      url: "http://127.0.0.1:5173/?playtestReset=1",
      ok: true,
      status: 200,
      titleFound: true,
      gameRootFound: true,
      resetParamFound: true
    })).toBe("PASS (HTTP 200; title OK; game root OK; reset OK)");

    expect(renderLaunchProbe({
      url: "http://127.0.0.1:5173/?playtestReset=1",
      ok: false,
      titleFound: false,
      gameRootFound: false,
      resetParamFound: true,
      issue: "request failed"
    })).toBe("FAIL (request failed; title missing; game root missing; reset OK)");
  });

  it("classifies same-machine and LAN host candidates", () => {
    expect(isLocalHost("127.0.0.1")).toBe(true);
    expect(isLocalHost("localhost")).toBe(true);
    expect(isLocalHost("192.168.1.20")).toBe(false);
    expect(hasLanHostCandidate(["", "127.0.0.1", "localhost"])).toBe(false);
    expect(hasLanHostCandidate(["127.0.0.1", "192.168.1.20"])).toBe(true);
  });
});
