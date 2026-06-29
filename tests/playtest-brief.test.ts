import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildPlaytestBrief,
  parsePlaytestBriefArgs,
  renderPlaytestBrief
} from "../scripts/report-playtest-brief";
import { probeCandidatePlaytestLaunches } from "../scripts/playtest-launch-candidates";

describe("playtest operator brief", () => {
  it("renders launch metadata, status, and evaluator sequence for a LAN run", () => {
    const root = mkdtempSync(join(tmpdir(), "mtt-brief-"));
    const sessionFiles = [join(root, "session-1.md"), join(root, "session-2.md")];
    const rendered = renderPlaytestBrief(buildPlaytestBrief({
      hosts: ["127.0.0.1", "192.168.1.20"],
      port: "5179",
      protocol: "http",
      sessionFiles
    }));

    expect(rendered).toContain("Tokenization Training playtest operator brief");
    expect(rendered).toContain("npm run playtest:preflight");
    expect(rendered).toContain("Start strict playtest server:");
    expect(rendered).toContain("npm run playtest:serve:lan -- --port 5179");
    expect(rendered).toContain("Run `npm run playtest:doctor -- --port 5179`");
    expect(rendered).toContain("npm run playtest:brief -- --port <chosen-port>");
    expect(rendered).toContain("Port hygiene:");
    expect(rendered).toContain("lsof -nP -iTCP:5179 -sTCP:LISTEN");
    expect(rendered).toContain("lsof -nP -iTCP:5179-5219 -sTCP:LISTEN");
    expect(rendered).toContain("Stop only a confirmed stale Vite process");
    expect(rendered).toContain("Recommended tester launch:");
    expect(rendered).toContain("http://192.168.1.20:5179/?playtestReset=1");
    expect(rendered).toContain("Physical-device sanity check:");
    expect(rendered).toContain("open the Recommended tester launch on the actual phone/tablet");
    expect(rendered).toContain("copy the exact host from Vite's Network URL");
    expect(rendered).toContain("npm run playtest:brief -- --host <network-host> --port <chosen-port>");
    expect(rendered).toContain("npm run playtest:launch-check -- --host <network-host> --port <chosen-port>");
    expect(rendered).toContain("Mobile note validity checklist:");
    expect(rendered).toContain(`${sessionFiles[0]} is the required real-device mobile note.`);
    expect(rendered).toContain("desktop emulation, trackpads, and desktop touchscreens do not count");
    expect(rendered).toContain("Copy Network: LAN and the non-localhost Launch URL only after launch-check passes with --host <network-host>");
    expect(rendered).toContain("actual device reaches the menu");
    expect(rendered).toContain("Leave the mobile note blank rather than filling it from same-machine or failed LAN proof.");
    expect(rendered).toContain("Network: LAN");
    expect(rendered).toContain("Launch URL: http://192.168.1.20:5179/?playtestReset=1");
    expect(rendered).toContain("Tutorial start: http://192.168.1.20:5179/?mode=tutorial&playtestReset=1");
    expect(rendered).toContain("Protocol Results QA: http://192.168.1.20:5179/?mode=protocol-results&playtestReset=1");
    expect(rendered).toContain("Completed notes: 0/2");
    expect(rendered).toContain(`Next session note: ${sessionFiles[0]} as the required real phone/tablet touch session`);
    expect(rendered).toContain(`INCOMPLETE ${sessionFiles[0]}: file`);
    expect(rendered).toContain("Do not explain tokenization, Wiener, the labor frame, or pay/cost before play.");
    expect(rendered).toContain("restarted swipe on a visible blank run stays one cut");
    expect(rendered).toContain("returning to the centered blank slot cleans accidental ordinary-word duplicates");
    expect(rendered).toContain("without suppressing deliberate currency or punctuation token cuts");
    expect(rendered).toContain("static prompt stays centered in the active lane");
    expect(rendered).toContain("near-text Wiener speech is noticed");
    expect(rendered).toContain("Wiener tutorial speech teaches both labor/browser fiction and tokenizer mechanics");
    expect(rendered).toContain("screenshot, photo, screen recording, or observer-note evidence");
    expect(rendered).toContain("whether play invited another round");
    expect(rendered).toContain("npm run playtest:status");
    expect(rendered).toContain(`npm run playtest:evaluate -- ${sessionFiles.join(" ")}`);
    expect(rendered).toContain("npm run playtest:evaluate-rollup -- docs/playtest_rollup_completed.md");
    expect(rendered).toContain("npm run playtest:audit");
    expect(rendered).toContain("at least one real phone/tablet touch session");
    expect(rendered).toContain("non-localhost Launch URL");
  });

  it("uses a suggested free port when the requested playtest port is blocked", () => {
    const rendered = renderPlaytestBrief({
      ...buildPlaytestBrief({
        hosts: ["127.0.0.1", "192.168.1.20"],
        port: "5173",
        protocol: "http",
        sessionFiles: []
      }),
      portCheck: {
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
          url: "http://192.168.1.20:5173/?playtestReset=1",
          ok: false,
          titleFound: false,
          gameRootFound: false,
          resetParamFound: true,
          issue: "request failed"
        },
        ready: false,
        suggestedPort: "5181"
      }
    });

    expect(rendered).toContain("Port check:");
    expect(rendered).toContain("Strict same-machine bind: FAIL (127.0.0.1:5173 is already listening)");
    expect(rendered).toContain("Strict LAN bind: FAIL (0.0.0.0:5173 is already listening)");
    expect(rendered).toContain("Existing launch URL: FAIL");
    expect(rendered).toContain("Decision: requested port is not safe for a tester session.");
    expect(rendered).toContain("Port hygiene:");
    expect(rendered).toContain("lsof -nP -iTCP:5173 -sTCP:LISTEN");
    expect(rendered).toContain("lsof -nP -iTCP:5173-5213 -sTCP:LISTEN");
    expect(rendered).toContain("Suggested free port: 5181");
    expect(rendered).toContain("using port 5181 for serve commands, launch links, and session metadata");
    expect(rendered).toContain("npm run playtest:serve:lan -- --port 5181");
    expect(rendered).toContain("Recommended tester launch:");
    expect(rendered).toContain("http://192.168.1.20:5181/?playtestReset=1");
    expect(rendered).toContain("Do not copy planned launch metadata into a session note yet.");
    expect(rendered).toContain("Planned Network: LAN");
    expect(rendered).toContain("Planned Launch URL: http://192.168.1.20:5181/?playtestReset=1");
    expect(rendered).toContain("Verification command: npm run playtest:launch-check -- --host 192.168.1.20 --port 5181");
    expect(rendered).not.toContain("Copy into Session Metadata before the tester starts:");
    expect(rendered).not.toContain("Launch URL: http://192.168.1.20:5173/?playtestReset=1");
  });

  it("keeps the requested port when it is already serving the game shell", () => {
    const rendered = renderPlaytestBrief({
      ...buildPlaytestBrief({
        hosts: ["127.0.0.1", "192.168.1.20"],
        port: "5173",
        protocol: "http",
        sessionFiles: []
      }),
      portCheck: {
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
          url: "http://192.168.1.20:5173/?playtestReset=1",
          ok: true,
          status: 200,
          titleFound: true,
          gameRootFound: true,
          resetParamFound: true
        },
        ready: false,
        suggestedPort: "5181"
      }
    });

    expect(rendered).toContain("Existing launch URL: PASS (HTTP 200; title OK; game root OK; reset OK)");
    expect(rendered).toContain(
      "Decision: requested port 5173 is already serving the game shell at http://192.168.1.20:5173/?playtestReset=1."
    );
    expect(rendered).toContain("Strict playtest server:");
    expect(rendered).toContain("Already serving the game shell on port 5173.");
    expect(rendered).toContain("Restart command if needed: npm run playtest:serve:lan");
    expect(rendered).toContain("Recommended tester launch:");
    expect(rendered).toContain("http://192.168.1.20:5173/?playtestReset=1");
    expect(rendered).toContain("Launch URL: http://192.168.1.20:5173/?playtestReset=1");
    expect(rendered).not.toContain("Launch URL: http://192.168.1.20:5181/?playtestReset=1");
  });

  it("keeps an occupied requested port when a same-machine candidate serves the game shell", async () => {
    const options = {
      hosts: ["203.0.113.9", "127.0.0.1"],
      port: "5173",
      protocol: "http",
      sessionFiles: []
    };
    const probedUrls: string[] = [];
    const launchCheck = await probeCandidatePlaytestLaunches(options, 1000, async (url) => {
      probedUrls.push(url);
      const localReady = url.startsWith("http://127.0.0.1:");

      return {
        url,
        ok: localReady,
        status: localReady ? 200 : undefined,
        titleFound: localReady,
        gameRootFound: localReady,
        resetParamFound: url.includes("playtestReset=1"),
        issue: localReady ? undefined : "request timed out"
      };
    });
    const report = {
      ...buildPlaytestBrief(options),
      portCheck: {
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
        ready: false,
        launchProbe: launchCheck.probe,
        launchProbes: launchCheck.probes,
        usableLaunch: launchCheck.usableLaunch,
        suggestedPort: undefined
      }
    };
    const rendered = renderPlaytestBrief(report);

    expect(report.portCheck?.usableLaunch).toEqual({
      host: "127.0.0.1",
      network: "same-machine",
      url: "http://127.0.0.1:5173/?playtestReset=1"
    });
    expect(probedUrls).toEqual(["http://127.0.0.1:5173/?playtestReset=1"]);
    expect(report.portCheck?.suggestedPort).toBeUndefined();
    expect(rendered).toContain("Existing launch URL: PASS");
    expect(rendered).toContain("Decision: requested port 5173 is already serving the game shell at http://127.0.0.1:5173/?playtestReset=1.");
    expect(rendered).toContain("Mobile gate: this same-machine proof does not validate phone/tablet access.");
    expect(rendered).toContain("npm run playtest:brief -- --host <network-host> --port 5173");
    expect(rendered).toContain("Restart command if needed: npm run playtest:serve");
    expect(rendered).toContain("Network: same-machine");
    expect(rendered).toContain("Launch URL: http://127.0.0.1:5173/?playtestReset=1");
    expect(rendered).not.toContain("Suggested free port");
    expect(rendered).not.toContain("Launch URL: http://203.0.113.9:5173/?playtestReset=1");
  });

  it("does not treat same-machine proof as enough for the required mobile note when LAN probes fail", () => {
    const root = mkdtempSync(join(tmpdir(), "mtt-brief-mobile-port-"));
    const sessionFiles = [join(root, "session-1.md"), join(root, "session-2.md")];
    const rendered = renderPlaytestBrief({
      ...buildPlaytestBrief({
        hosts: ["127.0.0.1", "192.168.1.20"],
        port: "5173",
        protocol: "http",
        sessionFiles
      }),
      portCheck: {
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
        ready: false,
        suggestedPort: "5184"
      }
    });

    expect(rendered).toContain("Existing launch URL: PASS (HTTP 200; title OK; game root OK; reset OK)");
    expect(rendered).toContain("LAN launch checks on requested port:");
    expect(rendered).toContain("http://192.168.1.20:5173/?playtestReset=1: FAIL (request timed out after 1000ms; title missing; game root missing; reset OK)");
    expect(rendered).toContain("Decision: requested port serves same-machine only; use a LAN-safe port before the required phone/tablet session.");
    expect(rendered).toContain("Suggested free port: 5184");
    expect(rendered).toContain("This brief is using port 5184 for serve commands, launch links, and session metadata.");
    expect(rendered).toContain("Start strict playtest server:\n  npm run playtest:serve:lan -- --port 5184");
    expect(rendered).toContain("Recommended tester launch:\n  http://192.168.1.20:5184/?playtestReset=1");
    expect(rendered).toContain("Do not copy planned launch metadata into a session note yet.");
    expect(rendered).toContain("Planned Network: LAN");
    expect(rendered).toContain("Planned Launch URL: http://192.168.1.20:5184/?playtestReset=1");
    expect(rendered).toContain("Verification command: npm run playtest:launch-check -- --host 192.168.1.20 --port 5184");
    expect(rendered).not.toContain("Copy into Session Metadata before the tester starts:");
    expect(rendered).not.toContain("Network: LAN\n  Launch URL: http://192.168.1.20:5184/?playtestReset=1");
    expect(rendered).not.toContain("Already serving the game shell on port 5173.");
    expect(rendered).not.toContain("Network: same-machine\n  Launch URL: http://127.0.0.1:5173/?playtestReset=1");
    expect(rendered).not.toContain("Current same-machine launch for desktop-only shakedown");
  });

  it("does not present same-machine metadata as copy-ready when the next note must satisfy the mobile gate", () => {
    const root = mkdtempSync(join(tmpdir(), "mtt-brief-mobile-"));
    const sessionFiles = [join(root, "session-1.md"), join(root, "session-2.md")];
    const rendered = renderPlaytestBrief(buildPlaytestBrief({
      hosts: ["127.0.0.1"],
      port: "5174",
      protocol: "http",
      sessionFiles
    }));

    expect(rendered).toContain(`Next session note: ${sessionFiles[0]} as the required real phone/tablet touch session`);
    expect(rendered).toContain("Session Metadata:");
    expect(rendered).toContain("Do not copy same-machine metadata into the required mobile note.");
    expect(rendered).toContain("Required mobile-gate metadata is not ready until the game is reachable from a real phone/tablet.");
    expect(rendered).toContain("Start LAN serving, use Vite's Network host, rerun the brief, then copy:");
    expect(rendered).toContain("Network: LAN");
    expect(rendered).toContain("Launch URL: http://<network-host>:5174/?playtestReset=1");
    expect(rendered).toContain(
      "Current same-machine launch for desktop-only shakedown: http://127.0.0.1:5174/?playtestReset=1"
    );
    expect(rendered).not.toContain("Copy into Session Metadata before the tester starts:");
    expect(rendered).not.toContain("Network: same-machine\n  Launch URL: http://127.0.0.1:5174/?playtestReset=1");
  });

  it("falls back to same-machine server guidance without a LAN host", () => {
    const rendered = renderPlaytestBrief(buildPlaytestBrief({
      hosts: ["127.0.0.1"],
      port: "5174",
      protocol: "http",
      sessionFiles: []
    }));

    expect(rendered).toContain("Start strict playtest server:\n  npm run playtest:serve -- --port 5174");
    expect(rendered).toContain("Network: same-machine");
    expect(rendered).toContain("Launch URL: http://127.0.0.1:5174/?playtestReset=1");
    expect(rendered).toContain("Same-machine URLs do not prove phone/tablet access.");
    expect(rendered).toContain("For a physical device session, restart with `npm run playtest:serve:lan`");
    expect(rendered).toContain("npm run playtest:launch-check -- --host <network-host> --port <chosen-port>");
    expect(rendered).toContain("Next session note: none incomplete; rerun or replace one note with a real phone/tablet touch session");
  });

  it("parses host, port, protocol, and explicit session files", () => {
    expect(parsePlaytestBriefArgs([
      "--host",
      "192.168.1.20",
      "--port=5178",
      "--protocol",
      "https",
      "--sessions",
      "a.md",
      "b.md"
    ])).toEqual({
      help: false,
      hosts: ["192.168.1.20"],
      port: "5178",
      protocol: "https",
      sessionFiles: ["a.md", "b.md"]
    });
  });
});
