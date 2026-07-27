import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  evaluateMobileCrossReferenceAutonomy,
  evaluateMobileCrossReferenceWiring,
  renderMobileCrossReferenceAutonomy
} from "../scripts/report-mobile-cross-reference-autonomy";
import type { MobileCrossReferenceEvaluation } from "../scripts/evaluate-mobile-cross-reference";
import type { MobileEvidenceFreshnessEvaluation } from "../scripts/evaluate-mobile-evidence-freshness";

describe("mobile cross-reference autonomy report", () => {
  it("accepts the repo wiring that lets Codex refresh and validate browser/mobile evidence", () => {
    const wiring = evaluateMobileCrossReferenceWiring(
      {
        scripts: {
          "mobile:capture": "tsx scripts/capture-mobile-cross-reference.ts",
          "mobile:crossref": "tsx scripts/evaluate-mobile-cross-reference.ts",
          "mobile:crossref:status": "tsx scripts/report-mobile-cross-reference-autonomy.ts",
          "mobile:freshness": "tsx scripts/evaluate-mobile-evidence-freshness.ts"
        }
      },
      [
        "Browser/Mobile Cross-Reference",
        "npm run mobile:capture",
        "Controlled-Browser Fallback",
        "Chrome control runtime",
        "browser-client.mjs",
        "agent.browsers.get(\"extension\")",
        "Do not copy old artifacts",
        ".qa/iab-surface-compare/latest/",
        "npm run mobile:crossref",
        "npm run mobile:crossref:status",
        "npm run mobile:freshness"
      ].join("\n"),
      [
        "Browser/Mobile Interface Work",
        "npm run mobile:crossref:status",
        "docs/current_surface_contract.md",
        "docs/mobile_shell.md",
        "surface=mobile",
        "npm run mobile:local"
      ].join("\n"),
      () => true
    );

    expect(wiring.ready).toBe(true);
    expect(wiring.refreshCommands).toEqual([
      "npm run mobile:capture",
      "npm run mobile:crossref",
      "npm run mobile:freshness"
    ]);
  });

  it("reports ready when contract evidence, freshness, and workflow wiring all pass", () => {
    const evaluation = evaluateMobileCrossReferenceAutonomy({
      crossReference: crossReference({ ready: true }),
      freshness: freshness({ ready: true }),
      wiring: {
        ready: true,
        issues: [],
        refreshCommands: ["npm run mobile:capture", "npm run mobile:crossref", "npm run mobile:freshness"]
      }
    });
    const output = renderMobileCrossReferenceAutonomy(evaluation);

    expect(evaluation.ready).toBe(true);
    expect(evaluation.decision).toBe("ready for autonomous cross-reference");
    expect(output).toContain("Current browser/mobile contract evidence: ready");
    expect(output).toContain("Evidence freshness: fresh");
    expect(output).toContain("Repo refresh workflow: wired");
    expect(output).toContain("Use the controlled Chrome QA routes");
    expect(output).toContain("otherwise fail closed");
  });

  it("prioritizes missing workflow wiring over stale artifacts", () => {
    const evaluation = evaluateMobileCrossReferenceAutonomy({
      crossReference: crossReference({ ready: true }),
      freshness: freshness({ ready: false, issues: ["menu evidence stale"] }),
      wiring: {
        ready: false,
        issues: ["package script mobile:capture must be tsx scripts/capture-mobile-cross-reference.ts."],
        refreshCommands: ["npm run mobile:capture", "npm run mobile:crossref", "npm run mobile:freshness"]
      }
    });
    const output = renderMobileCrossReferenceAutonomy(evaluation);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.decision).toBe("repo workflow wiring is incomplete");
    expect(output).toContain("Workflow wiring issues:");
    expect(output).toContain("Freshness issues:");
  });

  it("rejects missing package scripts, missing script files, and missing docs", () => {
    const wiring = evaluateMobileCrossReferenceWiring(
      { scripts: { "mobile:crossref": "tsx scripts/evaluate-mobile-cross-reference.ts" } },
      "Browser/Mobile Cross-Reference",
      "Browser/Mobile Interface Work",
      (path) => path === "scripts/evaluate-mobile-cross-reference.ts"
    );

    expect(wiring.ready).toBe(false);
    expect(wiring.issues).toContain("package script mobile:capture must be tsx scripts/capture-mobile-cross-reference.ts.");
    expect(wiring.issues).toContain("package script mobile:crossref:status must be tsx scripts/report-mobile-cross-reference-autonomy.ts.");
    expect(wiring.issues).toContain("cross-reference script is missing: scripts/capture-mobile-cross-reference.ts.");
    expect(wiring.issues).toContain("docs/mobile_shell.md must document: npm run mobile:capture.");
    expect(wiring.issues).toContain(
      "AGENTS.md must document mobile cross-reference instruction: npm run mobile:crossref:status."
    );
  });

  it("keeps the live AGENTS.md instructions wired into autonomous browser/mobile checks", () => {
    const agentInstructions = readFileSync("AGENTS.md", "utf8");
    const wiring = evaluateMobileCrossReferenceWiring(
      {
        scripts: {
          "mobile:capture": "tsx scripts/capture-mobile-cross-reference.ts",
          "mobile:crossref": "tsx scripts/evaluate-mobile-cross-reference.ts",
          "mobile:crossref:status": "tsx scripts/report-mobile-cross-reference-autonomy.ts",
          "mobile:freshness": "tsx scripts/evaluate-mobile-evidence-freshness.ts"
        }
      },
      [
        "Browser/Mobile Cross-Reference",
        "npm run mobile:capture",
        "Controlled-Browser Fallback",
        "Chrome control runtime",
        "browser-client.mjs",
        "agent.browsers.get(\"extension\")",
        "Do not copy old artifacts",
        ".qa/iab-surface-compare/latest/",
        "npm run mobile:crossref",
        "npm run mobile:crossref:status",
        "npm run mobile:freshness"
      ].join("\n"),
      agentInstructions,
      () => true
    );

    expect(wiring.issues).not.toContain(
      "AGENTS.md must document mobile cross-reference instruction: npm run mobile:crossref:status."
    );
    expect(agentInstructions).toContain("Browser/Mobile Interface Work");
  });
});

function crossReference(options: { ready: boolean }): MobileCrossReferenceEvaluation {
  return {
    ready: options.ready,
    menu: {
      ready: options.ready,
      directory: ".qa/iab-surface-compare/latest",
      issues: options.ready ? [] : ["missing menu comparison"],
      checkedFiles: []
    },
    surface: {
      ready: options.ready,
      directory: ".qa/mobile-port-audit/latest",
      issues: [],
      checkedFiles: []
    },
    runtime: {
      ready: options.ready,
      directory: ".qa/mobile-runtime/latest",
      issues: [],
      checkedFiles: []
    }
  };
}

function freshness(options: { ready: boolean; issues?: string[] }): MobileEvidenceFreshnessEvaluation {
  return {
    ready: options.ready,
    issues: options.issues ?? [],
    checkedFiles: [],
    groups: []
  };
}
