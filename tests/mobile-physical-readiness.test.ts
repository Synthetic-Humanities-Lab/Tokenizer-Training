import { describe, expect, it } from "vitest";
import {
  evaluateMobilePhysicalReadiness,
  parseMobilePhysicalReadinessArgs,
  renderMobilePhysicalReadiness
} from "../scripts/report-mobile-physical-readiness";
import type { IosSimulatorEvidenceEvaluation } from "../scripts/evaluate-ios-simulator-evidence";
import type { MobileMenuComparisonEvaluation } from "../scripts/evaluate-mobile-cross-reference";
import type { MobileValidationEvaluation } from "../scripts/evaluate-mobile-device-validation";
import type { MobileEvidenceFreshnessEvaluation } from "../scripts/evaluate-mobile-evidence-freshness";
import type { MobileRuntimeEvidenceEvaluation } from "../scripts/evaluate-mobile-runtime-evidence";
import type { MobileSurfaceEvidenceEvaluation } from "../scripts/evaluate-mobile-surface-evidence";

describe("mobile physical readiness reporter", () => {
  it("reports ready-for-device-pass when local evidence is fresh but physical validation is missing", () => {
    const evaluation = evaluateMobilePhysicalReadiness({
      deviceFile: "docs/mobile_device_validation_completed.md",
      evidenceRoot: "docs/mobile_device_evidence",
      simulatorEvaluation: readySimulator(),
      menuEvaluation: readyMenu(),
      surfaceEvaluation: readySurface(),
      runtimeEvaluation: readyRuntime(),
      freshnessEvaluation: readyFreshness(),
      deviceEvaluation: missingDeviceValidation()
    });
    const output = renderMobilePhysicalReadiness(evaluation);

    expect(evaluation.readyForDevicePass).toBe(true);
    expect(evaluation.physicalComplete).toBe(false);
    expect(output).toContain("Decision: ready for physical device pass");
    expect(output).toContain("Physical validation: incomplete");
    expect(output).toContain("iPhone SE/small phone portrait");
    expect(output).toContain("Audio silent on boot and plays after user action");
    expect(output).toContain("Input-feel metrics captured");
    expect(output).toContain("Small-phone menu");
    expect(output).toContain("Input-feel copied summary or trace");
    expect(output).toContain("npm run mobile:prepare");
    expect(output).toContain("npm run mobile:desktop-evidence");
    expect(output).toContain("npm run mobile:device-probe");
    expect(output).toContain("npm run mobile:completion");
  });

  it("fails readiness when a local evidence gate is not current", () => {
    const evaluation = evaluateMobilePhysicalReadiness({
      deviceFile: "docs/mobile_device_validation_completed.md",
      evidenceRoot: "docs/mobile_device_evidence",
      simulatorEvaluation: readySimulator(),
      menuEvaluation: readyMenu(),
      surfaceEvaluation: readySurface(),
      runtimeEvaluation: readyRuntime(),
      freshnessEvaluation: {
        ready: false,
        issues: ["simulator screenshot is older than WebAssets"],
        checkedFiles: [],
        groups: []
      },
      deviceEvaluation: missingDeviceValidation()
    });
    const output = renderMobilePhysicalReadiness(evaluation);

    expect(evaluation.readyForDevicePass).toBe(false);
    expect(output).toContain("Decision: local evidence not ready");
    expect(output).toContain("- FAIL mobile evidence freshness");
    expect(output).toContain("mobile evidence freshness: simulator screenshot is older than WebAssets");
  });

  it("summarizes a prepared phone evidence packet after desktop harness evidence is seeded", () => {
    const evaluation = evaluateMobilePhysicalReadiness({
      deviceFile: "docs/mobile_device_validation_completed.md",
      evidenceRoot: "docs/mobile_device_evidence",
      simulatorEvaluation: readySimulator(),
      menuEvaluation: readyMenu(),
      surfaceEvaluation: readySurface(),
      runtimeEvaluation: readyRuntime(),
      freshnessEvaluation: readyFreshness(),
      deviceEvaluation: {
        ready: false,
        file: "docs/mobile_device_validation_completed.md",
        evidenceRoot: "docs/mobile_device_evidence",
        issues: preparedPhoneOnlyPhysicalIssues()
      }
    });
    const output = renderMobilePhysicalReadiness(evaluation);

    expect(output).toContain("Prepared physical validation file exists but is not filled yet");
    expect(output).toContain("Fill phone Target Evidence, Physical Checklist, Evidence Inventory, and Final Decision.");
    expect(output).toContain("npm run mobile:validate for the row-by-row failure list");
    expect(output).not.toContain("iPhone SE/small phone portrait: verdict must be pass/yes/met/supported.");
    expect(output).not.toContain("Desktop browser harness: device/browser field is missing or generic.");
  });

  it("keeps non-template physical validation failures visible", () => {
    const evaluation = evaluateMobilePhysicalReadiness({
      deviceFile: "docs/mobile_device_validation_completed.md",
      evidenceRoot: "docs/mobile_device_evidence",
      simulatorEvaluation: readySimulator(),
      menuEvaluation: readyMenu(),
      surfaceEvaluation: readySurface(),
      runtimeEvaluation: readyRuntime(),
      freshnessEvaluation: readyFreshness(),
      deviceEvaluation: {
        ready: false,
        file: "docs/mobile_device_validation_completed.md",
        evidenceRoot: "docs/mobile_device_evidence",
        issues: ["Small-phone menu: referenced evidence artifact is missing: small-phone-menu.jpg"]
      }
    });

    expect(renderMobilePhysicalReadiness(evaluation)).toContain(
      "Small-phone menu: referenced evidence artifact is missing: small-phone-menu.jpg"
    );
  });

  it("parses custom physical readiness paths", () => {
    expect(parseMobilePhysicalReadinessArgs([
      "--device-file",
      "docs/custom.md",
      "--evidence-root=/tmp/evidence"
    ])).toEqual({
      deviceFile: "docs/custom.md",
      evidenceRoot: "/tmp/evidence"
    });
    expect(parseMobilePhysicalReadinessArgs([
      "--file=docs/inline.md",
      "--evidence-root",
      "docs/local_evidence"
    ])).toEqual({
      deviceFile: "docs/inline.md",
      evidenceRoot: "docs/local_evidence"
    });
  });
});

function readySimulator(): IosSimulatorEvidenceEvaluation {
  return {
    ready: true,
    directory: ".qa/ios-simulator/latest",
    issues: [],
    checkedFiles: ["default-menu.jpg"]
  };
}

function readyMenu(): MobileMenuComparisonEvaluation {
  return {
    ready: true,
    directory: ".qa/iab-surface-compare/latest",
    issues: [],
    checkedFiles: ["comparison.json"]
  };
}

function readySurface(): MobileSurfaceEvidenceEvaluation {
  return {
    ready: true,
    directory: ".qa/mobile-port-audit/latest",
    issues: [],
    checkedFiles: ["surface.json"]
  };
}

function readyRuntime(): MobileRuntimeEvidenceEvaluation {
  return {
    ready: true,
    directory: ".qa/mobile-runtime/latest",
    issues: [],
    checkedFiles: ["runtime.json"]
  };
}

function readyFreshness(): MobileEvidenceFreshnessEvaluation {
  return {
    ready: true,
    issues: [],
    checkedFiles: ["src/game/ui/Hud.ts"],
    groups: []
  };
}

function missingDeviceValidation(): MobileValidationEvaluation {
  return {
    ready: false,
    file: "docs/mobile_device_validation_completed.md",
    evidenceRoot: "docs/mobile_device_evidence",
    issues: ["Completed evidence file is missing."]
  };
}

function preparedPhoneOnlyPhysicalIssues(): string[] {
  return [
    "iPhone SE/small phone portrait: device/browser field is missing or generic.",
    "iPhone SE/small phone portrait: evidence file or note is missing or generic.",
    "iPhone SE/small phone portrait: verdict must be pass/yes/met/supported.",
    "Standard portrait phone: device/browser field is missing or generic.",
    "Standard portrait phone: evidence file or note is missing or generic.",
    "Standard portrait phone: verdict must be pass/yes/met/supported.",
    "Large phone portrait: device/browser field is missing or generic.",
    "Large phone portrait: evidence file or note is missing or generic.",
    "Large phone portrait: verdict must be pass/yes/met/supported.",
    "Evidence inventory missing: Small-phone menu.",
    "Evidence inventory missing: Input-feel copied summary or trace.",
    "Final decision must mark Mobile device validation passed as yes/pass/met."
  ];
}
