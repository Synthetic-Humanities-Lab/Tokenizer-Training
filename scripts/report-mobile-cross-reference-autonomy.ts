import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import {
  evaluateMobileCrossReference,
  type MobileCrossReferenceEvaluation
} from "./evaluate-mobile-cross-reference";
import {
  evaluateMobileEvidenceFreshness,
  type MobileEvidenceFreshnessEvaluation
} from "./evaluate-mobile-evidence-freshness";

interface PackageJson {
  scripts?: Record<string, string>;
}

export interface MobileCrossReferenceWiringEvaluation {
  ready: boolean;
  issues: string[];
  refreshCommands: string[];
}

export interface MobileCrossReferenceAutonomyEvaluation {
  ready: boolean;
  decision: string;
  crossReference: MobileCrossReferenceEvaluation;
  freshness: MobileEvidenceFreshnessEvaluation;
  wiring: MobileCrossReferenceWiringEvaluation;
}

const requiredScripts = {
  "mobile:capture": "tsx scripts/capture-mobile-cross-reference.ts",
  "mobile:crossref": "tsx scripts/evaluate-mobile-cross-reference.ts",
  "mobile:crossref:status": "tsx scripts/report-mobile-cross-reference-autonomy.ts",
  "mobile:freshness": "tsx scripts/evaluate-mobile-evidence-freshness.ts"
} as const;

const requiredShellDocPhrases = [
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
] as const;

const requiredAgentInstructionPhrases = [
  "Browser/Mobile Interface Work",
  "npm run mobile:crossref:status",
  "docs/current_surface_contract.md",
  "docs/mobile_shell.md",
  "surface=mobile",
  "npm run mobile:local"
] as const;

export function evaluateMobileCrossReferenceWiring(
  packageJson: PackageJson,
  shellDoc: string,
  agentInstructions: string,
  scriptExists: (path: string) => boolean = existsSync
): MobileCrossReferenceWiringEvaluation {
  const issues: string[] = [];

  for (const [name, command] of Object.entries(requiredScripts)) {
    if (packageJson.scripts?.[name] !== command) {
      issues.push(`package script ${name} must be ${command}.`);
    }
  }

  for (const command of Object.values(requiredScripts)) {
    const scriptPath = command.replace(/^tsx /, "");
    if (!scriptExists(scriptPath)) {
      issues.push(`cross-reference script is missing: ${scriptPath}.`);
    }
  }

  for (const phrase of requiredShellDocPhrases) {
    if (!shellDoc.includes(phrase)) {
      issues.push(`docs/mobile_shell.md must document: ${phrase}.`);
    }
  }

  for (const phrase of requiredAgentInstructionPhrases) {
    if (!agentInstructions.includes(phrase)) {
      issues.push(`AGENTS.md must document mobile cross-reference instruction: ${phrase}.`);
    }
  }

  return {
    ready: issues.length === 0,
    issues,
    refreshCommands: [
      "npm run mobile:capture",
      "npm run mobile:crossref",
      "npm run mobile:freshness"
    ]
  };
}

export function evaluateMobileCrossReferenceAutonomy(inputs: {
  crossReference: MobileCrossReferenceEvaluation;
  freshness: MobileEvidenceFreshnessEvaluation;
  wiring: MobileCrossReferenceWiringEvaluation;
}): MobileCrossReferenceAutonomyEvaluation {
  const ready = inputs.crossReference.ready && inputs.freshness.ready && inputs.wiring.ready;

  return {
    ready,
    decision: crossReferenceAutonomyDecision(inputs.crossReference, inputs.freshness, inputs.wiring),
    crossReference: inputs.crossReference,
    freshness: inputs.freshness,
    wiring: inputs.wiring
  };
}

export function renderMobileCrossReferenceAutonomy(
  evaluation: MobileCrossReferenceAutonomyEvaluation
): string {
  const lines = [
    "Tokenizer Training autonomous browser/mobile cross-reference",
    `Decision: ${evaluation.decision}`,
    "",
    `Current browser/mobile contract evidence: ${evaluation.crossReference.ready ? "ready" : "incomplete"}`,
    `Evidence freshness: ${evaluation.freshness.ready ? "fresh" : "stale or incomplete"}`,
    `Repo refresh workflow: ${evaluation.wiring.ready ? "wired" : "not wired"}`,
    "",
    "Canonical refresh path:",
    ...evaluation.wiring.refreshCommands.map((command) => `- ${command}`),
    "",
    "Fallback when browser subprocess capture is blocked:",
    "- Use the controlled Chrome QA routes in docs/mobile_shell.md when local navigation is allowed; otherwise fail closed and leave browser evidence incomplete."
  ];

  appendIssues(lines, "Cross-reference issues", [
    ...evaluation.crossReference.menu.issues.map((issue) => `menu: ${issue}`),
    ...evaluation.crossReference.surface.issues.map((issue) => `surface: ${issue}`),
    ...evaluation.crossReference.runtime.issues.map((issue) => `runtime: ${issue}`)
  ]);
  appendIssues(lines, "Freshness issues", evaluation.freshness.issues);
  appendIssues(lines, "Workflow wiring issues", evaluation.wiring.issues);

  return lines.join("\n");
}

function crossReferenceAutonomyDecision(
  crossReference: MobileCrossReferenceEvaluation,
  freshness: MobileEvidenceFreshnessEvaluation,
  wiring: MobileCrossReferenceWiringEvaluation
): string {
  if (!wiring.ready) {
    return "repo workflow wiring is incomplete";
  }
  if (!crossReference.ready) {
    return "captured browser/mobile evidence is incomplete";
  }
  if (!freshness.ready) {
    return "captured browser/mobile evidence needs refresh";
  }
  return "ready for autonomous cross-reference";
}

function appendIssues(lines: string[], heading: string, issues: string[]): void {
  if (issues.length === 0) {
    return;
  }

  lines.push("", `${heading}:`);
  for (const issue of issues) {
    lines.push(`- ${issue}`);
  }
}

function readPackageJson(): PackageJson {
  return JSON.parse(readFileSync("package.json", "utf8")) as PackageJson;
}

function readShellDoc(): string {
  return readFileSync("docs/mobile_shell.md", "utf8");
}

function readAgentInstructions(): string {
  return readFileSync("AGENTS.md", "utf8");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const evaluation = evaluateMobileCrossReferenceAutonomy({
    crossReference: evaluateMobileCrossReference(),
    freshness: evaluateMobileEvidenceFreshness(),
    wiring: evaluateMobileCrossReferenceWiring(readPackageJson(), readShellDoc(), readAgentInstructions())
  });

  console.log(renderMobileCrossReferenceAutonomy(evaluation));
  process.exitCode = evaluation.ready ? 0 : 1;
}
