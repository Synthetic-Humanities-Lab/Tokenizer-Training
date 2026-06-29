import { describe, expect, it } from "vitest";
import {
  parsePlaytestQaLinkArgs,
  playtestQaLinksForBase,
  renderPlaytestQaLinks
} from "../scripts/print-playtest-qa-links";

describe("playtest visual QA link generation", () => {
  it("generates deterministic internal visual QA links from a base URL", () => {
    const links = playtestQaLinksForBase("http://127.0.0.1:5180/");

    expect(links).toEqual([
      {
        label: "Desktop frozen tutorial active",
        url: "http://127.0.0.1:5180/?mode=tutorial&playtestReset=1&qaViewport=1280x720&qaFreezeElapsedMs=6200"
      },
      {
        label: "Portrait frozen tutorial active",
        url: "http://127.0.0.1:5180/?mode=tutorial&playtestReset=1&qaViewport=390x844&qaFreezeElapsedMs=6200"
      },
      {
        label: "Small-phone frozen tutorial active",
        url: "http://127.0.0.1:5180/?mode=tutorial&playtestReset=1&qaViewport=320x568&qaFreezeElapsedMs=6200"
      },
      {
        label: "Desktop handoff QA",
        url: "http://127.0.0.1:5180/?mode=tutorial-complete&playtestReset=1&qaViewport=1280x720"
      },
      {
        label: "Desktop failed tutorial QA",
        url: "http://127.0.0.1:5180/?mode=tutorial-failed&playtestReset=1&qaViewport=1280x720"
      },
      {
        label: "Portrait protocol results QA",
        url: "http://127.0.0.1:5180/?mode=protocol-results&playtestReset=1&qaViewport=390x844"
      },
      {
        label: "Small-phone protocol results QA",
        url: "http://127.0.0.1:5180/?mode=protocol-results&playtestReset=1&qaViewport=320x568"
      }
    ]);
  });

  it("renders claim boundaries for internal QA links", () => {
    const rendered = renderPlaytestQaLinks({
      hosts: ["127.0.0.1"],
      port: "5180"
    });

    expect(rendered).toContain("Tokenization Training internal visual QA links");
    expect(rendered).toContain("npm run playtest:qa-links -- --port <printed-port>");
    expect(rendered).toContain("Do not use these URLs for tester sessions or real mobile evidence.");
    expect(rendered).toContain("qaViewport fixes the internal Phaser canvas size.");
    expect(rendered).toContain("qaFreezeElapsedMs freezes active PlayScene motion");
    expect(rendered).toContain("do not prove physical touch readability or player comprehension");
    expect(rendered).toContain("Host 127.0.0.1");
    expect(rendered).toContain("http://127.0.0.1:5180/?mode=tutorial&playtestReset=1&qaViewport=1280x720&qaFreezeElapsedMs=6200");
    expect(rendered).toContain("http://127.0.0.1:5180/?mode=tutorial-failed&playtestReset=1&qaViewport=1280x720");
    expect(rendered).toContain("http://127.0.0.1:5180/?mode=protocol-results&playtestReset=1&qaViewport=320x568");
  });

  it("parses explicit host, port, and protocol arguments", () => {
    expect(parsePlaytestQaLinkArgs([
      "--host",
      "192.168.1.20",
      "--port=5178",
      "--protocol",
      "https"
    ])).toEqual({
      hosts: ["192.168.1.20"],
      port: "5178",
      protocol: "https"
    });
  });
});
