import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import {
  evaluateMobileDeviceValidation,
  type MobileValidationEvaluation
} from "./evaluate-mobile-device-validation";
import {
  evaluateIosSimulatorEvidence,
  type IosSimulatorEvidenceEvaluation
} from "./evaluate-ios-simulator-evidence";
import {
  evaluateMobileMenuComparison,
  type MobileMenuComparisonEvaluation
} from "./evaluate-mobile-cross-reference";
import {
  evaluateMobileRuntimeEvidence,
  type MobileRuntimeEvidenceEvaluation
} from "./evaluate-mobile-runtime-evidence";
import {
  evaluateMobileSurfaceEvidence,
  type MobileSurfaceEvidenceEvaluation
} from "./evaluate-mobile-surface-evidence";
import {
  evaluateMobileEvidenceFreshness,
  type MobileEvidenceFreshnessEvaluation
} from "./evaluate-mobile-evidence-freshness";

export interface MobileCompletionInputs {
  packageJson: { scripts?: Record<string, string> };
  optimizationReport: string;
  completionAudit: string;
  deviceEvaluation: MobileValidationEvaluation;
  simulatorEvaluation: IosSimulatorEvidenceEvaluation;
  menuEvaluation: MobileMenuComparisonEvaluation;
  surfaceEvaluation: MobileSurfaceEvidenceEvaluation;
  runtimeEvaluation: MobileRuntimeEvidenceEvaluation;
  freshnessEvaluation: MobileEvidenceFreshnessEvaluation;
}

export interface MobileCompletionEvaluation {
  complete: boolean;
  issues: string[];
  checks: MobileCompletionCheck[];
}

export interface MobileCompletionCheck {
  label: string;
  passed: boolean;
  detail: string;
}

const requiredPreflightScript =
  "npm run generate:fixtures && npm run test && npm run build && npm run build:ios-web && npm run mobile:crossref";
const requiredLocalContractScript = "npm run mobile:crossref && npm run mobile:simulator && npm run mobile:freshness";
const requiredCaptureScript = "tsx scripts/capture-mobile-cross-reference.ts";
const requiredCrossReferenceScript = "tsx scripts/evaluate-mobile-cross-reference.ts";
const requiredFreshnessScript = "tsx scripts/evaluate-mobile-evidence-freshness.ts";
const requiredSimulatorScript = "tsx scripts/evaluate-ios-simulator-evidence.ts";
const requiredPrepareScript = "tsx scripts/prepare-mobile-device-validation.ts";
const requiredDesktopEvidenceScript = "tsx scripts/seed-mobile-desktop-harness-evidence.ts";
const requiredPhysicalScript = "tsx scripts/report-mobile-physical-readiness.ts";
const requiredDeviceProbeScript = "tsx scripts/probe-mobile-device-access.ts";
const requiredStatusScript = "tsx scripts/report-mobile-status.ts";
const requiredValidateScript = "tsx scripts/evaluate-mobile-device-validation.ts";

export function evaluateMobileCompletion(inputs: MobileCompletionInputs): MobileCompletionEvaluation {
  const checks: MobileCompletionCheck[] = [];
  const issues: string[] = [];

  addCheck(
    checks,
    issues,
    "mobile preflight command",
    inputs.packageJson.scripts?.["mobile:preflight"] === requiredPreflightScript,
    "package.json must keep the full local mobile gate wired to npm run mobile:preflight."
  );
  addCheck(
    checks,
    issues,
    "mobile local contract command",
    inputs.packageJson.scripts?.["mobile:local"] === requiredLocalContractScript,
    "package.json must expose npm run mobile:local as the one-command local browser/mobile/simulator parity gate."
  );
  addCheck(
    checks,
    issues,
    "mobile capture command",
    inputs.packageJson.scripts?.["mobile:capture"] === requiredCaptureScript,
    "package.json must expose npm run mobile:capture for autonomous browser/mobile evidence refresh."
  );
  addCheck(
    checks,
    issues,
    "mobile cross-reference command",
    inputs.packageJson.scripts?.["mobile:crossref"] === requiredCrossReferenceScript,
    "package.json must expose npm run mobile:crossref for browser/mobile interface comparison."
  );
  addCheck(
    checks,
    issues,
    "mobile evidence freshness command",
    inputs.packageJson.scripts?.["mobile:freshness"] === requiredFreshnessScript,
    "package.json must expose npm run mobile:freshness so stale browser/mobile/simulator evidence cannot close the port."
  );
  addCheck(
    checks,
    issues,
    "iOS simulator command",
    inputs.packageJson.scripts?.["mobile:simulator"] === requiredSimulatorScript,
    "package.json must expose npm run mobile:simulator for native shell screenshot evidence."
  );
  addCheck(
    checks,
    issues,
    "mobile device preparation command",
    inputs.packageJson.scripts?.["mobile:prepare"] === requiredPrepareScript,
    "package.json must expose npm run mobile:prepare for creating the local physical-device evidence packet."
  );
  addCheck(
    checks,
    issues,
    "desktop harness evidence command",
    inputs.packageJson.scripts?.["mobile:desktop-evidence"] === requiredDesktopEvidenceScript,
    "package.json must expose npm run mobile:desktop-evidence for seeding the locally provable desktop browser harness evidence."
  );
  addCheck(
    checks,
    issues,
    "physical readiness command",
    inputs.packageJson.scripts?.["mobile:physical"] === requiredPhysicalScript,
    "package.json must expose npm run mobile:physical for summarizing the remaining real-device validation pass."
  );
  addCheck(
    checks,
    issues,
    "mobile device probe command",
    inputs.packageJson.scripts?.["mobile:device-probe"] === requiredDeviceProbeScript,
    "package.json must expose npm run mobile:device-probe so physical hardware visibility is checked before the phone pass."
  );
  addCheck(
    checks,
    issues,
    "mobile status command",
    inputs.packageJson.scripts?.["mobile:status"] === requiredStatusScript,
    "package.json must expose npm run mobile:status for non-destructive mobile-port handoff/status reporting."
  );
  addCheck(
    checks,
    issues,
    "physical validation command",
    inputs.packageJson.scripts?.["mobile:validate"] === requiredValidateScript,
    "package.json must expose npm run mobile:validate for checking completed real-device evidence."
  );
  addCheck(
    checks,
    issues,
    "iOS simulator evidence",
    inputs.simulatorEvaluation.ready,
    "npm run mobile:simulator must pass against current native shell screenshots."
  );
  for (const issue of inputs.simulatorEvaluation.issues) {
    issues.push(`iOS simulator evidence: ${issue}`);
  }

  addCheck(
    checks,
    issues,
    "mobile menu comparison",
    inputs.menuEvaluation.ready,
    "npm run mobile:crossref must pass its browser/mobile menu comparison."
  );
  for (const issue of inputs.menuEvaluation.issues) {
    issues.push(`mobile menu comparison: ${issue}`);
  }

  addCheck(
    checks,
    issues,
    "mobile surface evidence",
    inputs.surfaceEvaluation.ready,
    "npm run mobile:surface must pass against current browser/mobile surface artifacts."
  );
  for (const issue of inputs.surfaceEvaluation.issues) {
    issues.push(`mobile surface evidence: ${issue}`);
  }

  addCheck(
    checks,
    issues,
    "mobile runtime evidence",
    inputs.runtimeEvaluation.ready,
    "npm run mobile:runtime must pass against tutorial/endless runtime artifacts."
  );
  for (const issue of inputs.runtimeEvaluation.issues) {
    issues.push(`mobile runtime evidence: ${issue}`);
  }

  addCheck(
    checks,
    issues,
    "mobile evidence freshness",
    inputs.freshnessEvaluation.ready,
    "npm run mobile:freshness must pass so screenshots and QA JSON are newer than the source files they prove."
  );
  for (const issue of inputs.freshnessEvaluation.issues) {
    issues.push(`mobile evidence freshness: ${issue}`);
  }

  addCheck(
    checks,
    issues,
    "physical device validation",
    inputs.deviceEvaluation.ready,
    "npm run mobile:validate must pass on completed real-device evidence."
  );
  for (const issue of inputs.deviceEvaluation.issues) {
    issues.push(`physical device validation: ${issue}`);
  }

  addCheck(
    checks,
    issues,
    "final report sections",
    hasFinalReportShape(inputs.optimizationReport),
    "docs/mobile_optimization_report.md must include recommendation, evidence, remaining gaps, next proposals, completion position, the live-status authority boundary, and no volatile live results."
  );
  addCheck(
    checks,
    issues,
    "completion audit status",
    /^Status:\s*complete\./m.test(inputs.completionAudit) && !/^Status:\s*not complete\./m.test(inputs.completionAudit),
    "docs/mobile_port_completion_audit.md must be updated from not complete to complete after physical evidence passes."
  );

  return {
    complete: checks.every((check) => check.passed),
    issues,
    checks
  };
}

export function renderMobileCompletionEvaluation(evaluation: MobileCompletionEvaluation): string {
  const lines = [
    "Tokenizer Training mobile completion audit",
    `Decision: ${evaluation.complete ? "complete" : "not complete"}`,
    "",
    "Checks:"
  ];

  for (const check of evaluation.checks) {
    lines.push(`- ${check.passed ? "PASS" : "FAIL"} ${check.label}: ${check.detail}`);
  }

  if (evaluation.issues.length > 0) {
    lines.push("", "Issues:");
    for (const issue of evaluation.issues) {
      lines.push(`- ${issue}`);
    }
  }

  return lines.join("\n");
}

export function parseMobileCompletionArgs(args: string[]): { deviceFile: string } {
  const defaultDeviceFile = "docs/mobile_device_validation_completed.md";
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--device-file") {
      return { deviceFile: args[index + 1] ?? defaultDeviceFile };
    }
    if (arg.startsWith("--device-file=")) {
      return { deviceFile: arg.slice("--device-file=".length) };
    }
  }

  return { deviceFile: defaultDeviceFile };
}

function addCheck(
  checks: MobileCompletionCheck[],
  issues: string[],
  label: string,
  passed: boolean,
  detail: string
): void {
  checks.push({ label, passed, detail });
  if (!passed) {
    issues.push(`${label}: ${detail}`);
  }
}

function hasFinalReportShape(report: string): boolean {
  return [
    "## Current Recommendation",
    "## Live Status Authority",
    "## Evidence",
    "## Historical Captured Visual QA Read",
    "## Game Feel Alignment",
    "## Remaining Gaps",
    "## Next Optimization Proposals",
    "## Completion Position",
    "npm run mobile:preflight",
    "npm run mobile:local",
    "npm run mobile:capture",
    "npm run mobile:crossref",
    "npm run mobile:freshness",
    "npm run mobile:simulator",
    "npm run mobile:prepare",
    "npm run mobile:desktop-evidence",
    "npm run mobile:physical",
    "npm run mobile:device-probe",
    "npm run mobile:status",
    "npm run mobile:validate",
    "docs/game_design_reading_notes/swink_game_feel.md",
    "docs/game_design_concepts/02_text_cutting_game_feel.md"
  ].every((required) => report.includes(required))
    && hasLiveStatusAuthority(report)
    && lacksVolatileLiveStatusClaims(report)
    && numberedProposalCount(report) >= 3;
}

function hasLiveStatusAuthority(report: string): boolean {
  const heading = "## Live Status Authority";
  const sectionStart = report.indexOf(heading);
  if (sectionStart === -1) {
    return false;
  }
  const bodyStart = sectionStart + heading.length;
  const nextHeading = report.indexOf("\n## ", bodyStart);
  const section = report.slice(bodyStart, nextHeading === -1 ? undefined : nextHeading);

  return /not a live status cache/i.test(section)
    && /`npm test`/.test(section)
    && /`npm run mobile:status`.*diagnostic only/i.test(section)
    && /`npm run mobile:completion`.*fail-closed authority/i.test(section)
    && /historical screenshots.*never prove the current layout/i.test(section);
}

function lacksVolatileLiveStatusClaims(report: string): boolean {
  return !/\b\d+\s+test files?\b/i.test(report)
    && !/\b\d+\s+tests?\s+(?:pass|passed)\b/i.test(report)
    && !/\bcurrently passes\b/i.test(report)
    && !/\bfreshness(?:\s+gate)?\s+(?:currently\s+)?passes\b/i.test(report)
    && !/\b(?:all|the|local|validation|mobile)\s+gates? passed\b/i.test(report)
    && !/\/(?:private\/)?var\/folders\//.test(report);
}

function numberedProposalCount(report: string): number {
  return (report.match(/^\d+\.\s+/gm) ?? []).length;
}

function readDeviceEvaluation(deviceFile: string): MobileValidationEvaluation {
  if (!existsSync(deviceFile)) {
    return {
      ready: false,
      file: deviceFile,
      evidenceRoot: "docs/mobile_device_evidence",
      issues: [
        `Completed evidence file is missing. Run npm run mobile:prepare, fill ${deviceFile} with physical-device evidence, then run npm run mobile:validate.`
      ]
    };
  }

  return evaluateMobileDeviceValidation(readFileSync(deviceFile, "utf8"), deviceFile);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { deviceFile } = parseMobileCompletionArgs(process.argv.slice(2));
  const evaluation = evaluateMobileCompletion({
    packageJson: JSON.parse(readFileSync("package.json", "utf8")) as { scripts?: Record<string, string> },
    optimizationReport: readFileSync("docs/mobile_optimization_report.md", "utf8"),
    completionAudit: readFileSync("docs/mobile_port_completion_audit.md", "utf8"),
    deviceEvaluation: readDeviceEvaluation(deviceFile),
    simulatorEvaluation: evaluateIosSimulatorEvidence(),
    menuEvaluation: evaluateMobileMenuComparison(),
    surfaceEvaluation: evaluateMobileSurfaceEvidence(),
    runtimeEvaluation: evaluateMobileRuntimeEvidence(),
    freshnessEvaluation: evaluateMobileEvidenceFreshness()
  });

  console.log(renderMobileCompletionEvaluation(evaluation));
  process.exit(evaluation.complete ? 0 : 1);
}
