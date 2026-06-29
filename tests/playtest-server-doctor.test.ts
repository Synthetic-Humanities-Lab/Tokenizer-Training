import { describe, expect, it } from "vitest";
import {
  findAvailablePlaytestPort,
  parsePlaytestServerDoctorArgs,
  probePort,
  renderPlaytestServerDoctor,
  type PlaytestServerDoctorReport
} from "../scripts/check-playtest-server";

function report(overrides: Partial<PlaytestServerDoctorReport> = {}): PlaytestServerDoctorReport {
  return {
    options: { hosts: ["127.0.0.1", "192.168.1.20"], port: "5173" },
    localProbe: { host: "127.0.0.1", port: "5173", available: true },
    lanProbe: { host: "0.0.0.0", port: "5173", available: true },
    lanHosts: ["192.168.1.20"],
    status: {
      files: ["docs/playtests/session-1.md"],
      statuses: [],
      completeCount: 0,
      mobileMetadataCount: 0,
      mobileCount: 0,
      mobileGateSatisfied: false,
      nextSessionFile: "docs/playtests/session-1.md",
      nextSessionShouldBeMobile: true,
      readyForRollup: false
    },
    ready: true,
    ...overrides
  };
}

describe("playtest server doctor", () => {
  it("renders strict serve commands when the playtest port is available", () => {
    const rendered = renderPlaytestServerDoctor(report());

    expect(rendered).toContain("Tokenizer Training playtest server doctor");
    expect(rendered).toContain("Strict same-machine bind: PASS");
    expect(rendered).toContain("Strict LAN bind: PASS");
    expect(rendered).toContain("LAN host candidates: 192.168.1.20");
    expect(rendered).toContain("Next session note: docs/playtests/session-1.md as the required real phone/tablet touch session");
    expect(rendered).toContain("Decision: strict playtest port is available");
    expect(rendered).toContain("Mobile note validity:");
    expect(rendered).toContain("Target: docs/playtests/session-1.md must remain the required real-device note.");
    expect(rendered).toContain("desktop emulation, trackpads, and desktop touchscreens do not count");
    expect(rendered).toContain("actual device reaches the menu");
    expect(rendered).toContain("HUD, static prompt text, review markers, feedback, Wiener speech");
    expect(rendered).toContain("Recommended tester launch:");
    expect(rendered).toContain("http://192.168.1.20:5173/?playtestReset=1");
    expect(rendered).toContain("Do not copy planned launch metadata into a session note yet.");
    expect(rendered).toContain("Planned Network: LAN");
    expect(rendered).toContain("Planned Launch URL: http://192.168.1.20:5173/?playtestReset=1");
    expect(rendered).toContain("Verification command: npm run playtest:launch-check -- --host 192.168.1.20 --port 5173");
    expect(rendered).not.toContain("Copy into Session Metadata before the tester starts:");
    expect(rendered).toContain("Recommended launch commands:");
    expect(rendered).toContain("npm run playtest:serve");
    expect(rendered).toContain("npm run playtest:serve:lan");
    expect(rendered).toContain("npm run playtest:brief");
  });

  it("surfaces occupied ports before the tester arrives", () => {
    const rendered = renderPlaytestServerDoctor(report({
      localProbe: {
        host: "127.0.0.1",
        port: "5173",
        available: false,
        issue: "127.0.0.1:5173 is already listening"
      },
      lanProbe: {
        host: "0.0.0.0",
        port: "5173",
        available: false,
        issue: "0.0.0.0:5173 is already listening"
      },
      suggestedPort: "5222",
      ready: false
    }));

    expect(rendered).toContain("Decision: resolve server port before tester session");
    expect(rendered).toContain("127.0.0.1:5173 is already listening");
    expect(rendered).toContain("0.0.0.0:5173 is already listening");
    expect(rendered).toContain("Stop stale Vite servers or use the suggested free port");
    expect(rendered).toContain("Port hygiene:");
    expect(rendered).toContain("lsof -nP -iTCP:5173 -sTCP:LISTEN");
    expect(rendered).toContain("lsof -nP -iTCP:5173-5213 -sTCP:LISTEN");
    expect(rendered).toContain("Stop only a confirmed stale Vite process");
    expect(rendered).toContain("Suggested free port: 5222");
    expect(rendered).toContain("Recommended tester launch using suggested port 5222");
    expect(rendered).toContain("http://192.168.1.20:5222/?playtestReset=1");
    expect(rendered).toContain("Do not copy planned launch metadata into a session note yet.");
    expect(rendered).toContain("Planned Launch URL: http://192.168.1.20:5222/?playtestReset=1");
    expect(rendered).toContain("Verification command: npm run playtest:launch-check -- --host 192.168.1.20 --port 5222");
    expect(rendered).not.toContain("Copy into Session Metadata before the tester starts:");
    expect(rendered).toContain("Recommended launch commands using suggested port 5222");
    expect(rendered).toContain("npm run playtest:serve -- --port 5222");
    expect(rendered).toContain("npm run playtest:serve:lan -- --port 5222");
    expect(rendered).toContain("npm run playtest:brief -- --port 5222");
    expect(rendered).toContain("npm run playtest:links -- --port 5222");
  });

  it("keeps an occupied requested port when it is already serving the game shell", () => {
    const rendered = renderPlaytestServerDoctor(report({
      localProbe: {
        host: "127.0.0.1",
        port: "5173",
        available: false,
        issue: "127.0.0.1:5173 is already listening"
      },
      lanProbe: {
        host: "0.0.0.0",
        port: "5173",
        available: false,
        issue: "0.0.0.0:5173 is already listening"
      },
      launchProbe: {
        url: "http://127.0.0.1:5173/?playtestReset=1",
        ok: true,
        status: 200,
        titleFound: true,
        gameRootFound: true,
        resetParamFound: true
      },
      usableLaunch: {
        host: "127.0.0.1",
        network: "same-machine",
        url: "http://127.0.0.1:5173/?playtestReset=1"
      },
      ready: false
    }));

    expect(rendered).toContain("Existing launch URL: PASS (HTTP 200; title OK; game root OK; reset OK)");
    expect(rendered).toContain("Decision: requested port is already serving the game shell at http://127.0.0.1:5173/?playtestReset=1");
    expect(rendered).toContain("Mobile note validity:");
    expect(rendered).toContain("Target: docs/playtests/session-1.md must remain the required real-device note.");
    expect(rendered).toContain("Mobile gate warning:");
    expect(rendered).toContain("Existing same-machine proof does not validate phone/tablet access.");
    expect(rendered).toContain("npm run playtest:brief -- --host <network-host> --port 5173");
    expect(rendered).toContain("Port hygiene:");
    expect(rendered).toContain("lsof -nP -iTCP:5173 -sTCP:LISTEN");
    expect(rendered).toContain("lsof -nP -iTCP:5173-5213 -sTCP:LISTEN");
    expect(rendered).toContain("Do not kill a listener that is already serving an active tester session.");
    expect(rendered).toContain("Recommended tester launch:");
    expect(rendered).toContain("Session Metadata:");
    expect(rendered).toContain("Do not copy same-machine metadata into the required mobile note.");
    expect(rendered).toContain("Required mobile-gate metadata is not ready until the game is reachable from a real phone/tablet.");
    expect(rendered).toContain("Network: LAN");
    expect(rendered).toContain("Launch URL: http://<network-host>:5173/?playtestReset=1");
    expect(rendered).toContain("Current same-machine launch for desktop-only shakedown: http://127.0.0.1:5173/?playtestReset=1");
    expect(rendered).not.toContain("Copy into Session Metadata before the tester starts:");
    expect(rendered).not.toContain("Network: same-machine\n  Launch URL: http://127.0.0.1:5173/?playtestReset=1");
    expect(rendered).not.toContain("Suggested free port");
    expect(rendered).not.toContain("Stop stale Vite servers or use the suggested free port");
    expect(rendered).not.toContain("using suggested port");
  });

  it("does not treat same-machine proof as enough for the required mobile note when LAN probes fail", () => {
    const rendered = renderPlaytestServerDoctor(report({
      localProbe: {
        host: "127.0.0.1",
        port: "5173",
        available: false,
        issue: "127.0.0.1:5173 is already listening"
      },
      lanProbe: {
        host: "0.0.0.0",
        port: "5173",
        available: false,
        issue: "0.0.0.0:5173 is already listening"
      },
      launchProbe: {
        url: "http://127.0.0.1:5173/?playtestReset=1",
        ok: true,
        status: 200,
        titleFound: true,
        gameRootFound: true,
        resetParamFound: true
      },
      lanLaunchProbes: [
        {
          url: "http://192.168.1.20:5173/?playtestReset=1",
          ok: false,
          titleFound: false,
          gameRootFound: false,
          resetParamFound: true,
          issue: "request timed out after 1000ms"
        }
      ],
      suggestedPort: "5184",
      usableLaunch: undefined,
      ready: false
    }));

    expect(rendered).toContain("Existing launch URL: PASS (HTTP 200; title OK; game root OK; reset OK)");
    expect(rendered).toContain("LAN launch checks on requested port:");
    expect(rendered).toContain("http://192.168.1.20:5173/?playtestReset=1: FAIL (request timed out after 1000ms; title missing; game root missing; reset OK)");
    expect(rendered).toContain("Decision: requested port serves same-machine only; use a LAN-safe port before the required phone/tablet session");
    expect(rendered).toContain("Mobile note validity:");
    expect(rendered).toContain("actual device reaches the menu");
    expect(rendered).toContain("Suggested free port: 5184");
    expect(rendered).toContain("Recommended tester launch using suggested port 5184");
    expect(rendered).toContain("http://192.168.1.20:5184/?playtestReset=1");
    expect(rendered).toContain("Do not copy planned launch metadata into a session note yet.");
    expect(rendered).toContain("Planned Launch URL: http://192.168.1.20:5184/?playtestReset=1");
    expect(rendered).toContain("Verification command: npm run playtest:launch-check -- --host 192.168.1.20 --port 5184");
    expect(rendered).not.toContain("Copy into Session Metadata before the tester starts:");
    expect(rendered).not.toContain("Current same-machine launch for desktop-only shakedown");
  });

  it("renders alternate-port commands consistently", () => {
    const rendered = renderPlaytestServerDoctor(report({
      options: { hosts: ["127.0.0.1"], port: "5179" },
      localProbe: { host: "127.0.0.1", port: "5179", available: true },
      lanProbe: { host: "0.0.0.0", port: "5179", available: true },
      lanHosts: []
    }));

    expect(rendered).toContain("LAN host candidates: none detected");
    expect(rendered).toContain("Recommended tester launch:");
    expect(rendered).toContain("http://127.0.0.1:5179/?playtestReset=1");
    expect(rendered).toContain("Do not copy same-machine metadata into the required mobile note.");
    expect(rendered).toContain("Launch URL: http://<network-host>:5179/?playtestReset=1");
    expect(rendered).toContain("Current same-machine launch for desktop-only shakedown: http://127.0.0.1:5179/?playtestReset=1");
    expect(rendered).not.toContain("Network: same-machine\n  Launch URL: http://127.0.0.1:5179/?playtestReset=1");
    expect(rendered).toContain("npm run playtest:serve -- --port 5179");
    expect(rendered).toContain("npm run playtest:serve:lan -- --port 5179");
    expect(rendered).toContain("npm run playtest:brief -- --port 5179");
    expect(rendered).toContain("No non-localhost IPv4 host was detected");
  });

  it("parses host and port arguments", () => {
    expect(parsePlaytestServerDoctorArgs([
      "--host",
      "192.168.1.20",
      "--port=5179"
    ])).toEqual({
      help: false,
      hosts: ["192.168.1.20"],
      port: "5179"
    });
  });

  it("reports invalid ports instead of throwing", async () => {
    await expect(probePort("127.0.0.1", "not-a-port")).resolves.toMatchObject({
      host: "127.0.0.1",
      port: "not-a-port",
      available: false,
      issue: "127.0.0.1:not-a-port is not a valid TCP port"
    });
  });

  it("finds an available alternate playtest port", async () => {
    const port = await findAvailablePlaytestPort("62000", 5);

    expect(port).toMatch(/^6200[1-5]$/);
  });
});
