import { createServer, type Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildPlaytestLaunchCheck,
  parsePlaytestLaunchCheckArgs,
  renderPlaytestLaunchCheck
} from "../scripts/check-playtest-launch";

const gameShell = `<!doctype html>
<html lang="en">
  <head>
    <title>Manual Tokenization Training - WienerWorks</title>
  </head>
  <body>
    <main id="game-root" aria-label="Manual Tokenization Training by WienerWorks"></main>
  </body>
</html>`;

const servers: Server[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => closeServer(server)));
});

describe("playtest launch check", () => {
  it("passes when the reset-safe launch URL serves the game shell", async () => {
    const { server, port } = await listenWithBody(gameShell);
    servers.push(server);

    const report = await buildPlaytestLaunchCheck({
      hosts: ["127.0.0.1"],
      port: String(port),
      protocol: "http",
      timeoutMs: 1000,
      sessionFiles: []
    });
    const rendered = renderPlaytestLaunchCheck(report);

    expect(report.ready).toBe(true);
    expect(report.probe).toMatchObject({
      ok: true,
      status: 200,
      titleFound: true,
      gameRootFound: true,
      resetParamFound: true
    });
    expect(rendered).toContain("Tokenization Training launch check");
    expect(rendered).toContain(`http://127.0.0.1:${port}/?playtestReset=1`);
    expect(rendered).toContain("HTTP response: PASS (200)");
    expect(rendered).toContain("Title: PASS (Manual Tokenization Training - WienerWorks)");
    expect(rendered).toContain("Game root: PASS (main#game-root)");
    expect(rendered).toContain("Reset parameter: PASS (playtestReset=1)");
    expect(rendered).toContain("Decision: launch URL is serving the game shell");
    expect(rendered).toContain("same-machine");
    expect(rendered).toContain("cannot satisfy the real phone/tablet mobile gate");
  });

  it("does not present same-machine launch metadata as copy-ready for the required mobile note", async () => {
    const { server, port } = await listenWithBody(gameShell);
    servers.push(server);

    const report = await buildPlaytestLaunchCheck({
      hosts: ["127.0.0.1"],
      port: String(port),
      protocol: "http",
      timeoutMs: 1000,
      sessionFiles: ["missing-session-1.md"]
    });
    const rendered = renderPlaytestLaunchCheck(report);

    expect(report.ready).toBe(true);
    expect(rendered).toContain("Next session note: missing-session-1.md as the required real phone/tablet touch session");
    expect(rendered).toContain("Session Metadata:");
    expect(rendered).toContain("Do not copy same-machine metadata into the required mobile note.");
    expect(rendered).toContain("Mobile note validity:");
    expect(rendered).toContain("Target: missing-session-1.md must remain the required real-device note.");
    expect(rendered).toContain("real phone/tablet/mobile browser with touch, pen, or mixed input");
    expect(rendered).toContain("actual device reaches the same menu URL");
    expect(rendered).toContain("HUD, static prompt text, review markers, feedback, Wiener speech");
    expect(rendered).toContain("Required mobile-gate metadata is not ready until the game is reachable from a real phone/tablet.");
    expect(rendered).toContain("Network: LAN");
    expect(rendered).toContain(`Launch URL: http://<network-host>:${port}/?playtestReset=1`);
    expect(rendered).toContain(
      `Current same-machine launch for desktop-only shakedown: http://127.0.0.1:${port}/?playtestReset=1`
    );
    expect(rendered).not.toContain("Copy into Session Metadata before the tester starts:");
    expect(rendered).not.toContain(`Network: same-machine\n  Launch URL: http://127.0.0.1:${port}/?playtestReset=1`);
  });

  it("uses a same-machine candidate when the default host list includes stale LAN hosts", async () => {
    const requestedUrls: string[] = [];
    const report = await buildPlaytestLaunchCheck({
      hosts: ["203.0.113.9", "127.0.0.1"],
      port: "5173",
      protocol: "http",
      timeoutMs: 1000,
      sessionFiles: []
    }, async (url) => {
      requestedUrls.push(url);

      return {
        ok: true,
        status: 200,
        text: async () => gameShell
      };
    });
    const rendered = renderPlaytestLaunchCheck(report);

    expect(requestedUrls).toEqual(["http://127.0.0.1:5173/?playtestReset=1"]);
    expect(report.ready).toBe(true);
    expect(report.recommended).toEqual({
      host: "127.0.0.1",
      network: "same-machine",
      url: "http://127.0.0.1:5173/?playtestReset=1"
    });
    expect(rendered).toContain("Host selection note:");
    expect(rendered).toContain("A same-machine candidate served the game shell first.");
    expect(rendered).toContain("npm run playtest:launch-check -- --host <network-host> --port 5173");
    expect(rendered).toContain("Launch URL: http://127.0.0.1:5173/?playtestReset=1");
    expect(rendered).not.toContain("Launch URL: http://203.0.113.9:5173/?playtestReset=1");
  });

  it("fails when the server responds with the wrong shell", async () => {
    const { server, port } = await listenWithBody("<html><title>Wrong App</title></html>");
    servers.push(server);

    const report = await buildPlaytestLaunchCheck({
      hosts: ["127.0.0.1"],
      port: String(port),
      protocol: "http",
      timeoutMs: 1000,
      sessionFiles: []
    });
    const rendered = renderPlaytestLaunchCheck(report);

    expect(report.ready).toBe(false);
    expect(report.probe.ok).toBe(true);
    expect(report.probe.titleFound).toBe(false);
    expect(report.probe.gameRootFound).toBe(false);
    expect(rendered).toContain("Title: FAIL");
    expect(rendered).toContain("Game root: FAIL");
    expect(rendered).toContain("Decision: fix server, host, or port before a tester session");
    expect(rendered).toContain("This only proves the launch URL responds from this machine.");
    expect(rendered).toContain("Do not copy launch metadata from this failed check.");
    expect(rendered).not.toContain("Copy into Session Metadata before the tester starts:");
  });

  it("does not present failed LAN launch metadata as copy-ready", async () => {
    const report = await buildPlaytestLaunchCheck({
      hosts: ["192.168.1.20"],
      port: "5183",
      protocol: "http",
      timeoutMs: 1000,
      sessionFiles: ["missing-session-1.md"]
    }, async (url) => ({
      ok: false,
      status: 503,
      text: async () => "<html><title>Wrong App</title></html>"
    }));
    const rendered = renderPlaytestLaunchCheck(report);

    expect(report.ready).toBe(false);
    expect(report.recommended).toEqual({
      host: "192.168.1.20",
      network: "LAN",
      url: "http://192.168.1.20:5183/?playtestReset=1"
    });
    expect(rendered).toContain("HTTP response: FAIL (503; HTTP 503)");
    expect(rendered).toContain("Session Metadata:");
    expect(rendered).toContain("Do not copy launch metadata from this failed check.");
    expect(rendered).toContain("Mobile note validity:");
    expect(rendered).toContain("Target: missing-session-1.md must remain the required real-device note.");
    expect(rendered).toContain("Required mobile-gate metadata is still unavailable until a LAN launch passes");
    expect(rendered).toContain("Failed launch candidate: http://192.168.1.20:5183/?playtestReset=1");
    expect(rendered).not.toContain("Copy into Session Metadata before the tester starts:");
    expect(rendered).not.toContain("Network: LAN\n  Launch URL: http://192.168.1.20:5183/?playtestReset=1");
  });

  it("diagnoses a failed LAN path when the same port serves the game shell locally", async () => {
    const requestedUrls: string[] = [];
    const report = await buildPlaytestLaunchCheck({
      hosts: ["192.168.1.20"],
      port: "5184",
      protocol: "http",
      timeoutMs: 1000,
      sessionFiles: ["missing-session-1.md"]
    }, async (url) => {
      requestedUrls.push(url);

      if (url.startsWith("http://127.0.0.1:")) {
        return {
          ok: true,
          status: 200,
          text: async () => gameShell
        };
      }

      const error = new Error("The operation was aborted");
      error.name = "AbortError";
      throw error;
    });
    const rendered = renderPlaytestLaunchCheck(report);

    expect(requestedUrls).toEqual([
      "http://192.168.1.20:5184/?playtestReset=1",
      "http://127.0.0.1:5184/?playtestReset=1"
    ]);
    expect(report.ready).toBe(false);
    expect(report.sameMachineProbe).toMatchObject({
      ok: true,
      status: 200,
      titleFound: true,
      gameRootFound: true,
      resetParamFound: true
    });
    expect(rendered).toContain("HTTP response: FAIL (request timed out after 1000ms)");
    expect(rendered).toContain("LAN path diagnosis:");
    expect(rendered).toContain("Same-machine same-port check: PASS (HTTP 200; title OK; game root OK; reset OK)");
    expect(rendered).toContain("The game shell responds on this machine, but the LAN URL does not.");
    expect(rendered).toContain("macOS firewall or VPN");
    expect(rendered).toContain("host exactly matches Vite's Network URL");
    expect(rendered).toContain("Mobile note validity:");
    expect(rendered).toContain("actual device reaches the same menu URL");
    expect(rendered).toContain("Do not copy launch metadata from this failed check.");
    expect(rendered).not.toContain("Copy into Session Metadata before the tester starts:");
  });

  it("parses host, port, timeout, protocol, and explicit session files", () => {
    expect(parsePlaytestLaunchCheckArgs([
      "--host",
      "192.168.1.20",
      "--port=5181",
      "--protocol",
      "https",
      "--timeout-ms=1500",
      "--sessions",
      "a.md",
      "b.md"
    ])).toEqual({
      help: false,
      hosts: ["192.168.1.20"],
      port: "5181",
      protocol: "https",
      timeoutMs: 1500,
      sessionFiles: ["a.md", "b.md"]
    });
  });
});

async function listenWithBody(body: string): Promise<{ server: Server; port: number }> {
  const server = createServer((_, response) => {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(body);
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("server did not bind to a TCP port");
  }

  return { server, port: address.port };
}

async function closeServer(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
}
