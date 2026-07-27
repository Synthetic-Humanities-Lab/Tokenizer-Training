import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import {
  evaluateIosSimulatorEvidence
} from "./evaluate-ios-simulator-evidence";
import {
  evaluateMobileCompletion,
  type MobileCompletionEvaluation
} from "./evaluate-mobile-completion";
import {
  evaluateMobileMenuComparison
} from "./evaluate-mobile-cross-reference";
import {
  evaluateMobileDeviceValidation,
  type MobileValidationEvaluation
} from "./evaluate-mobile-device-validation";
import {
  evaluateMobileEvidenceFreshness
} from "./evaluate-mobile-evidence-freshness";
import {
  evaluateMobileRuntimeEvidence
} from "./evaluate-mobile-runtime-evidence";
import {
  evaluateMobileSurfaceEvidence
} from "./evaluate-mobile-surface-evidence";
import {
  evaluateMobileDeviceProbe,
  runXcdeviceList,
  type MobileDeviceProbeEvaluation
} from "./probe-mobile-device-access";
import {
  evaluateMobilePhysicalReadiness,
  type MobilePhysicalReadinessEvaluation
} from "./report-mobile-physical-readiness";

export interface MobileStatusEvaluation {
  readyForDevicePass: boolean;
  deviceVisible: boolean;
  desktopHarnessSeeded: boolean;
  physicalComplete: boolean;
  complete: boolean;
  decision: string;
  physical: MobilePhysicalReadinessEvaluation;
  deviceProbe: MobileDeviceProbeEvaluation;
  completion: MobileCompletionEvaluation;
}

export interface MobileStatusOptions {
  deviceFile: string;
  evidenceRoot: string;
}

const defaultOptions: MobileStatusOptions = {
  deviceFile: "docs/mobile_device_validation_completed.md",
  evidenceRoot: "docs/mobile_device_evidence"
};
const maxPhysicalValidationIssueLines = 8;

export function evaluateMobileStatus(
  physical: MobilePhysicalReadinessEvaluation,
  deviceProbe: MobileDeviceProbeEvaluation,
  completion: MobileCompletionEvaluation
): MobileStatusEvaluation {
  const readyForDevicePass = physical.readyForDevicePass;
  const deviceVisible = deviceProbe.ready;
  const desktopHarnessSeeded = desktopHarnessEvidenceSeeded(physical.inputs.deviceEvaluation.issues);
  const physicalComplete = physical.physicalComplete;
  const complete = completion.complete;

  return {
    readyForDevicePass,
    deviceVisible,
    desktopHarnessSeeded,
    physicalComplete,
    complete,
    decision: statusDecision({ readyForDevicePass, deviceVisible, physicalComplete, complete }),
    physical,
    deviceProbe,
    completion
  };
}

export function renderMobileStatus(evaluation: MobileStatusEvaluation): string {
  const lines = [
    "Tokenizer Training mobile port status",
    `Decision: ${evaluation.decision}`,
    "",
    `Local browser/mobile/simulator evidence: ${evaluation.readyForDevicePass ? "ready" : "not ready"}`,
    `Desktop browser harness evidence: ${evaluation.desktopHarnessSeeded ? "seeded" : "not seeded"}`,
    `Physical iPhone/iPad visible to Xcode: ${evaluation.deviceVisible ? "yes" : "no"}`,
    `Physical evidence packet: ${evaluation.physicalComplete ? "complete" : "incomplete"}`,
    `Final completion gate: ${evaluation.complete ? "complete" : "not complete"}`,
    "",
    "Next action:",
    nextAction(evaluation)
  ];

  if (!evaluation.readyForDevicePass && evaluation.physical.issues.length > 0) {
    lines.push("", "Local evidence issues:", ...evaluation.physical.issues.map((issue) => `- ${issue}`));
  }

  if (!evaluation.deviceVisible && evaluation.deviceProbe.issues.length > 0) {
    lines.push("", "Device probe issues:", ...evaluation.deviceProbe.issues.map((issue) => `- ${issue}`));
  }

  if (!evaluation.physicalComplete && evaluation.physical.inputs.deviceEvaluation.issues.length > 0) {
    lines.push(
      "",
      "Physical validation issues:",
      ...physicalValidationIssueLines(
        evaluation.physical.inputs.deviceEvaluation.issues,
        evaluation.physical.inputs.deviceFile
      )
    );
  }

  return lines.join("\n");
}

export function parseMobileStatusArgs(args: string[]): MobileStatusOptions {
  return {
    deviceFile: valueForFlag(args, "--device-file") ?? valueForFlag(args, "--file") ?? defaultOptions.deviceFile,
    evidenceRoot: valueForFlag(args, "--evidence-root") ?? defaultOptions.evidenceRoot
  };
}

function statusDecision(state: {
  readyForDevicePass: boolean;
  deviceVisible: boolean;
  physicalComplete: boolean;
  complete: boolean;
}): string {
  if (state.complete) {
    return "complete";
  }
  if (!state.readyForDevicePass) {
    return "local evidence needs refresh";
  }
  if (!state.deviceVisible) {
    return "local-ready, awaiting visible physical iOS device";
  }
  if (!state.physicalComplete) {
    return "device visible, awaiting completed physical evidence";
  }
  return "physical evidence present, completion audit still not closed";
}

function nextAction(evaluation: MobileStatusEvaluation): string {
  if (!evaluation.readyForDevicePass) {
    return "Refresh local browser/mobile/simulator artifacts, then run npm run mobile:local.";
  }
  if (!evaluation.deviceVisible) {
    if (evaluation.desktopHarnessSeeded) {
      return "Desktop harness evidence is seeded. Connect a real iPhone/iPad, unlock it, trust this Mac, enable Developer Mode if required, and run npm run mobile:device-probe.";
    }
    return "Run npm run mobile:desktop-evidence if the desktop harness row is not seeded, then connect a real iPhone/iPad, unlock it, trust this Mac, enable Developer Mode if required, and run npm run mobile:device-probe.";
  }
  if (!evaluation.physicalComplete) {
    return "Run npm run mobile:prepare and npm run mobile:desktop-evidence, capture physical artifacts, fill docs/mobile_device_validation_completed.md, then run npm run mobile:validate.";
  }
  if (!evaluation.complete) {
    return "Run npm run mobile:freshness and npm run mobile:completion; update docs/mobile_port_completion_audit.md only after the completion gate passes.";
  }
  return "No required mobile-port work remains.";
}

function physicalValidationIssueLines(issues: string[], deviceFile: string): string[] {
  if (looksLikePreparedBlankPhysicalPacket(issues)) {
    return [
      `- Prepared physical validation file exists but is not filled yet: ${deviceFile}`,
      "- Fill Target Evidence, Physical Checklist, Evidence Inventory, and Final Decision.",
      "- Run npm run mobile:validate for the row-by-row failure list."
    ];
  }

  const visibleIssues = issues.slice(0, maxPhysicalValidationIssueLines).map((issue) => `- ${issue}`);
  if (issues.length > maxPhysicalValidationIssueLines) {
    visibleIssues.push(
      `- ... ${issues.length - maxPhysicalValidationIssueLines} more physical validation issue(s); run npm run mobile:validate for the full list.`
    );
  }

  return visibleIssues;
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

function desktopHarnessEvidenceSeeded(issues: string[]): boolean {
  if (issues.some((issue) => issue.startsWith("Completed evidence file is missing."))) {
    return false;
  }

  return !issues.some((issue) => (
    issue.startsWith("Desktop browser harness:")
    || issue === "Evidence inventory missing: Desktop browser pinned fixture."
    || issue.includes("desktop-pinned-fixture.png")
  ));
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

function valueForFlag(args: string[], flag: string): string | undefined {
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === flag && args[index + 1]) {
      return args[index + 1];
    }
    if (value.startsWith(`${flag}=`)) {
      return value.slice(flag.length + 1);
    }
  }

  return undefined;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { deviceFile, evidenceRoot } = parseMobileStatusArgs(process.argv.slice(2));
  const simulatorEvaluation = evaluateIosSimulatorEvidence();
  const menuEvaluation = evaluateMobileMenuComparison();
  const surfaceEvaluation = evaluateMobileSurfaceEvidence();
  const runtimeEvaluation = evaluateMobileRuntimeEvidence();
  const freshnessEvaluation = evaluateMobileEvidenceFreshness();
  const deviceEvaluation = readDeviceEvaluation(deviceFile, evidenceRoot);
  const physical = evaluateMobilePhysicalReadiness({
    deviceFile,
    evidenceRoot,
    simulatorEvaluation,
    menuEvaluation,
    surfaceEvaluation,
    runtimeEvaluation,
    freshnessEvaluation,
    deviceEvaluation
  });
  const deviceProbe = evaluateMobileDeviceProbe(runXcdeviceList());
  const completion = evaluateMobileCompletion({
    packageJson: JSON.parse(readFileSync("package.json", "utf8")) as { scripts?: Record<string, string> },
    optimizationReport: readFileSync("docs/mobile_optimization_report.md", "utf8"),
    completionAudit: readFileSync("docs/mobile_port_completion_audit.md", "utf8"),
    deviceEvaluation,
    simulatorEvaluation,
    menuEvaluation,
    surfaceEvaluation,
    runtimeEvaluation,
    freshnessEvaluation
  });

  console.log(renderMobileStatus(evaluateMobileStatus(physical, deviceProbe, completion)));
}
