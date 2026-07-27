import type { NetworkInterfaceInfo } from "node:os";
import { describe, expect, it } from "vitest";
import {
  lanHostsFromInterfaces,
  parsePlaytestLinkArgs,
  playtestLinksForBase,
  recommendedPlaytestLaunch,
  renderPlaytestLinks
} from "../scripts/print-playtest-links";

describe("playtest link generation", () => {
  it("generates reset-safe deep links from a base URL", () => {
    const links = playtestLinksForBase("http://192.168.1.20:5174/");

    expect(links).toEqual([
      { label: "Controlled menu", url: "http://192.168.1.20:5174/?playtestReset=1" },
      { label: "Tutorial start", url: "http://192.168.1.20:5174/?mode=tutorial&playtestReset=1" },
      { label: "Training start", url: "http://192.168.1.20:5174/?mode=endless&playtestReset=1" },
      { label: "Handoff QA", url: "http://192.168.1.20:5174/?mode=tutorial-complete&playtestReset=1" },
      { label: "Failed Tutorial QA", url: "http://192.168.1.20:5174/?mode=tutorial-failed&playtestReset=1" },
      { label: "Results QA", url: "http://192.168.1.20:5174/?mode=results&playtestReset=1" },
      { label: "Protocol Results QA", url: "http://192.168.1.20:5174/?mode=protocol-results&playtestReset=1" }
    ]);
  });

  it("filters LAN candidates to non-internal IPv4 addresses", () => {
    const hosts = lanHostsFromInterfaces({
      lo0: [{ address: "127.0.0.1", family: "IPv4", internal: true } as NetworkInterfaceInfo],
      en0: [{ address: "192.168.1.20", family: "IPv4", internal: false } as NetworkInterfaceInfo],
      en1: [{ address: "fe80::1", family: "IPv6", internal: false } as NetworkInterfaceInfo],
      en2: [{ address: "10.0.0.8", family: "IPv4", internal: false } as NetworkInterfaceInfo]
    });

    expect(hosts).toEqual(["10.0.0.8", "192.168.1.20"]);
  });

  it("parses explicit host and fallback-port arguments", () => {
    expect(parsePlaytestLinkArgs(["--host", "192.168.1.20", "--port", "5174"])).toEqual({
      hosts: ["192.168.1.20"],
      port: "5174",
      protocol: "http"
    });
  });

  it("recommends the LAN controlled-menu URL when a touch-device host is available", () => {
    expect(recommendedPlaytestLaunch({
      hosts: ["127.0.0.1", "192.168.1.20"],
      port: "5174"
    })).toEqual({
      host: "192.168.1.20",
      network: "LAN",
      url: "http://192.168.1.20:5174/?playtestReset=1"
    });
  });

  it("falls back to same-machine metadata when no LAN host is available", () => {
    expect(recommendedPlaytestLaunch({
      hosts: [],
      port: "5174"
    })).toEqual({
      host: "127.0.0.1",
      network: "same-machine",
      url: "http://127.0.0.1:5174/?playtestReset=1"
    });
  });

  it("renders facilitator instructions with localhost and touch-device links", () => {
    const output = renderPlaytestLinks({
      hosts: ["127.0.0.1", "192.168.1.20"],
      port: "5174"
    });

    expect(output).toContain("npm run playtest:serve:lan -- --port 5174");
    expect(output).toContain("npm run playtest:links -- --port <chosen-port>");
    expect(output).toContain("Port hygiene:");
    expect(output).toContain("lsof -nP -iTCP:5174 -sTCP:LISTEN");
    expect(output).toContain("lsof -nP -iTCP:5174-5214 -sTCP:LISTEN");
    expect(output).toContain("Do not kill a listener that is already serving an active tester session.");
    expect(output).toContain("Recommended tester launch:");
    expect(output).toContain("  http://192.168.1.20:5174/?playtestReset=1");
    expect(output).toContain("Session Metadata:");
    expect(output).toContain("Do not copy planned launch metadata into a session note yet.");
    expect(output).toContain("Planned Network: LAN");
    expect(output).toContain("Planned Launch URL: http://192.168.1.20:5174/?playtestReset=1");
    expect(output).toContain("Verification command: npm run playtest:launch-check -- --host 192.168.1.20 --port 5174");
    expect(output).toContain("Mobile note validity:");
    expect(output).toContain("desktop emulation, trackpads, and desktop touchscreens do not count");
    expect(output).toContain("actual device reaches the menu");
    expect(output).not.toContain("Copy into the session metadata:");
    expect(output).toContain("record screenshot, photo, screen recording, or observer-note evidence");
    expect(output).toContain("Host 127.0.0.1");
    expect(output).toContain("Host 192.168.1.20");
    expect(output).toContain("Training start: http://192.168.1.20:5174/?mode=endless&playtestReset=1");
    expect(output).not.toContain("Endless start:");
    expect(output).toContain("http://192.168.1.20:5174/?mode=tutorial&playtestReset=1");
    expect(output).toContain("http://192.168.1.20:5174/?mode=tutorial-complete&playtestReset=1");
    expect(output).toContain("http://192.168.1.20:5174/?mode=tutorial-failed&playtestReset=1");
    expect(output).toContain("http://192.168.1.20:5174/?mode=results&playtestReset=1");
    expect(output).toContain("http://192.168.1.20:5174/?mode=protocol-results&playtestReset=1");
  });

  it("does not present same-machine links as mobile-gate session metadata", () => {
    const output = renderPlaytestLinks({
      hosts: ["127.0.0.1"],
      port: "5174"
    });

    expect(output).toContain("Recommended tester launch:");
    expect(output).toContain("http://127.0.0.1:5174/?playtestReset=1");
    expect(output).toContain("Session Metadata:");
    expect(output).toContain("Do not copy same-machine metadata into the required mobile note.");
    expect(output).toContain("Use this launch only for desktop/same-machine shakedown");
    expect(output).toContain("Required mobile-gate metadata:");
    expect(output).toContain("Network: LAN");
    expect(output).toContain("Launch URL: http://<network-host>:5174/?playtestReset=1");
    expect(output).toContain("Mobile note validity:");
    expect(output).toContain("Check command: npm run playtest:launch-check -- --host <network-host> --port 5174");
    expect(output).toContain(
      "Current same-machine launch for desktop-only shakedown: http://127.0.0.1:5174/?playtestReset=1"
    );
    expect(output).not.toContain("Copy into the session metadata:");
    expect(output).not.toContain("Network: same-machine\n  Launch URL: http://127.0.0.1:5174/?playtestReset=1");
  });
});
