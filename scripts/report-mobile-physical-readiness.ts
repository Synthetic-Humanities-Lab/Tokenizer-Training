import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import {
  evaluateIosSimulatorEvidence,
  type IosSimulatorEvidenceEvaluation
} from "./evaluate-ios-simulator-evidence";
import {
  evaluateMobileMenuComparison,
  type MobileMenuComparisonEvaluation
} from "./evaluate-mobile-cross-reference";
import {
  evaluateMobileDeviceValidation,
  requiredEvidenceInventory,
  requiredMobileChecks,
  requiredMobileTargets,
  type MobileValidationEvaluation
} from "./evaluate-mobile-device-validation";
import {
  evaluateMobileEvidenceFreshness,
  type MobileEvidenceFreshnessEvaluation
} from "./evaluate-mobile-evidence-freshness";
import {
  evaluateMobileRuntimeEvidence,
  type MobileRuntimeEvidenceEvaluation
} from "./evaluate-mobile-runtime-evidence";
import {
  evaluateMobileSurfaceEvidence,
  type MobileSurfaceEvidenceEvaluation
} from "./evaluate-mobile-surface-evidence";

export interface MobilePhysicalReadinessInputs {
  deviceFile: string;
  evidenceRoot: string;
  simulatorEvaluation: IosSimulatorEvidenceEvaluation;
  menuEvaluation: MobileMenuComparisonEvaluation;
  surfaceEvaluation: MobileSurfaceEvidenceEvaluation;
  runtimeEvaluation: MobileRuntimeEvidenceEvaluation;
  freshnessEvaluation: MobileEvidenceFreshnessEvaluation;
  deviceEvaluation: MobileValidationEvaluation;
}

export interface MobilePhysicalReadinessEvaluation {
  readyForDevicePass: boolean;
  physicalComplete: boolean;
  issues: string[];
  inputs: MobilePhysicalReadinessInputs;
}

export function evaluateMobilePhysicalReadiness(
  inputs: MobilePhysicalReadinessInputs
): MobilePhysicalReadinessEvaluation {
  const localChecks = [
    inputs.simulatorEvaluation,
    inputs.menuEvaluation,
    inputs.surfaceEvaluation,
    inputs.runtimeEvaluation,
    inputs.freshnessEvaluation
  ];
  const issues = [
    ...inputs.simulatorEvaluation.issues.map((issue) => `iOS simulator evidence: ${issue}`),
    ...inputs.menuEvaluation.issues.map((issue) => `mobile menu comparison: ${issue}`),
    ...inputs.surfaceEvaluation.issues.map((issue) => `mobile surface evidence: ${issue}`),
    ...inputs.runtimeEvaluation.issues.map((issue) => `mobile runtime evidence: ${issue}`),
    ...inputs.freshnessEvaluation.issues.map((issue) => `mobile evidence freshness: ${issue}`)
  ];

  return {
    readyForDevicePass: localChecks.every((check) => check.ready),
    physicalComplete: inputs.deviceEvaluation.ready,
    issues,
    inputs
  };
}

export function renderMobilePhysicalReadiness(evaluation: MobilePhysicalReadinessEvaluation): string {
  const { inputs } = evaluation;
  const lines = [
    "Tokenizer Training physical-device readiness",
    `Decision: ${evaluation.readyForDevicePass ? "ready for physical device pass" : "local evidence not ready"}`,
    "",
    "Local gates:",
    gateLine("iOS simulator evidence", inputs.simulatorEvaluation.ready),
    gateLine("mobile menu comparison", inputs.menuEvaluation.ready),
    gateLine("mobile surface evidence", inputs.surfaceEvaluation.ready),
    gateLine("mobile runtime evidence", inputs.runtimeEvaluation.ready),
    gateLine("mobile evidence freshness", inputs.freshnessEvaluation.ready),
    "",
    `Physical validation: ${evaluation.physicalComplete ? "complete" : "incomplete"}`,
    `Completed file: ${inputs.deviceFile}`,
    `Evidence root: ${inputs.evidenceRoot}`
  ];

  if (!evaluation.physicalComplete) {
    lines.push(
      "",
      "Physical targets to prove:",
      ...requiredMobileTargets.map((target) => `- ${target}`),
      "",
      "Required physical checks:",
      ...requiredMobileChecks.map((check) => `- ${check}`),
      "",
      "Required evidence inventory:",
      ...requiredEvidenceInventory.map((item) => `- ${item}`),
      "",
      "Next commands:",
      "1. npm run mobile:prepare",
      "2. npm run mobile:desktop-evidence",
      "3. npm run mobile:device-probe",
      "4. Save physical artifacts in docs/mobile_device_evidence/",
      "5. Fill docs/mobile_device_validation_completed.md",
      "6. npm run mobile:validate",
      "7. npm run mobile:freshness",
      "8. npm run mobile:completion"
    );
  }

  if (evaluation.issues.length > 0) {
    lines.push("", "Local evidence issues:");
    for (const issue of evaluation.issues) {
      lines.push(`- ${issue}`);
    }
  }

  if (!inputs.deviceEvaluation.ready && inputs.deviceEvaluation.issues.length > 0) {
    lines.push("", "Physical validation issues:");
    lines.push(...physicalValidationIssueLines(inputs.deviceEvaluation.issues, inputs.deviceFile));
  }

  return lines.join("\n");
}

export function parseMobilePhysicalReadinessArgs(args: string[]): { deviceFile: string; evidenceRoot: string } {
  let deviceFile = "docs/mobile_device_validation_completed.md";
  let evidenceRoot = "docs/mobile_device_evidence";

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--device-file" || arg === "--file") {
      deviceFile = args[index + 1] ?? deviceFile;
      index += 1;
      continue;
    }
    if (arg.startsWith("--device-file=")) {
      deviceFile = arg.slice("--device-file=".length);
      continue;
    }
    if (arg.startsWith("--file=")) {
      deviceFile = arg.slice("--file=".length);
      continue;
    }
    if (arg === "--evidence-root") {
      evidenceRoot = args[index + 1] ?? evidenceRoot;
      index += 1;
      continue;
    }
    if (arg.startsWith("--evidence-root=")) {
      evidenceRoot = arg.slice("--evidence-root=".length);
    }
  }

  return { deviceFile, evidenceRoot };
}

function gateLine(label: string, passed: boolean): string {
  return `- ${passed ? "PASS" : "FAIL"} ${label}`;
}

function physicalValidationIssueLines(issues: string[], deviceFile: string): string[] {
  if (looksLikePreparedBlankPhysicalPacket(issues)) {
    return [
      `- Prepared physical validation file exists but is not filled yet: ${deviceFile}`,
      "- Fill phone Target Evidence, Physical Checklist, Evidence Inventory, and Final Decision.",
      "- Run npm run mobile:validate for the row-by-row failure list."
    ];
  }

  return issues.map((issue) => `- ${issue}`);
}

function looksLikePreparedBlankPhysicalPacket(issues: string[]): boolean {
  return [
    "iPhone SE/small phone portrait: device/browser field is missing or generic.",
    "Standard portrait phone: device/browser field is missing or generic.",
    "Large phone portrait: device/browser field is missing or generic.",
    "Evidence inventory missing: Small-phone menu.",
    "Evidence inventory missing: Input-feel copied summary or trace.",
    "Final decision must mark Mobile device validation passed as yes/pass/met."
  ].every((expectedIssue) => issues.includes(expectedIssue));
}

function readDeviceEvaluation(deviceFile: string, evidenceRoot: string): MobileValidationEvaluation {
  if (!existsSync(deviceFile)) {
    return {
      ready: false,
      file: deviceFile,
      evidenceRoot,
      issues: [
        `Completed evidence file is missing. Run npm run mobile:prepare, fill ${deviceFile}, then run npm run mobile:validate.`
      ]
    };
  }

  return evaluateMobileDeviceValidation(readFileSync(deviceFile, "utf8"), deviceFile, { evidenceRoot });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { deviceFile, evidenceRoot } = parseMobilePhysicalReadinessArgs(process.argv.slice(2));
  const evaluation = evaluateMobilePhysicalReadiness({
    deviceFile,
    evidenceRoot,
    simulatorEvaluation: evaluateIosSimulatorEvidence(),
    menuEvaluation: evaluateMobileMenuComparison(),
    surfaceEvaluation: evaluateMobileSurfaceEvidence(),
    runtimeEvaluation: evaluateMobileRuntimeEvidence(),
    freshnessEvaluation: evaluateMobileEvidenceFreshness(),
    deviceEvaluation: readDeviceEvaluation(deviceFile, evidenceRoot)
  });

  console.log(renderMobilePhysicalReadiness(evaluation));
  process.exit(evaluation.readyForDevicePass ? 0 : 1);
}
