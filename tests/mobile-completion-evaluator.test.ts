import { describe, expect, it } from "vitest";
import {
  evaluateMobileCompletion,
  parseMobileCompletionArgs,
  renderMobileCompletionEvaluation
} from "../scripts/evaluate-mobile-completion";
import type { MobileMenuComparisonEvaluation } from "../scripts/evaluate-mobile-cross-reference";
import type { MobileValidationEvaluation } from "../scripts/evaluate-mobile-device-validation";
import type { MobileRuntimeEvidenceEvaluation } from "../scripts/evaluate-mobile-runtime-evidence";
import type { MobileSurfaceEvidenceEvaluation } from "../scripts/evaluate-mobile-surface-evidence";
import type { IosSimulatorEvidenceEvaluation } from "../scripts/evaluate-ios-simulator-evidence";
import type { MobileEvidenceFreshnessEvaluation } from "../scripts/evaluate-mobile-evidence-freshness";

const preflightScript =
  "npm run generate:fixtures && npm run test && npm run build && npm run build:ios-web && npm run mobile:crossref";

describe("mobile completion evaluator", () => {
  it("accepts completion only when local gates, physical validation, report, and audit all agree", () => {
    const evaluation = evaluateMobileCompletion({
      packageJson: packageJson(),
      optimizationReport: completeReport(),
      completionAudit: "Status: complete.\n\nAll mobile requirements are proven.",
      deviceEvaluation: readyDeviceValidation(),
      simulatorEvaluation: readySimulatorEvidence(),
      menuEvaluation: readyMenuComparison(),
      surfaceEvaluation: readySurfaceEvidence(),
      runtimeEvaluation: readyRuntimeEvidence(),
      freshnessEvaluation: readyFreshnessEvidence()
    });

    expect(evaluation.complete).toBe(true);
    expect(evaluation.issues).toEqual([]);
    expect(evaluation.checks.every((check) => check.passed)).toBe(true);
  });

  it("fails closed when physical evidence is missing and the audit still says not complete", () => {
    const evaluation = evaluateMobileCompletion({
      packageJson: packageJson(),
      optimizationReport: completeReport(),
      completionAudit: "Status: not complete.\n\nPhysical device evidence is missing.",
      deviceEvaluation: {
        ready: false,
        file: "docs/mobile_device_validation_completed.md",
        evidenceRoot: "docs/mobile_device_evidence",
        issues: ["Completed evidence file is missing."]
      },
      simulatorEvaluation: readySimulatorEvidence(),
      menuEvaluation: readyMenuComparison(),
      surfaceEvaluation: readySurfaceEvidence(),
      runtimeEvaluation: readyRuntimeEvidence(),
      freshnessEvaluation: readyFreshnessEvidence()
    });

    expect(evaluation.complete).toBe(false);
    expect(evaluation.issues).toContain(
      "physical device validation: npm run mobile:validate must pass on completed real-device evidence."
    );
    expect(evaluation.issues).toContain("physical device validation: Completed evidence file is missing.");
    expect(evaluation.issues).toContain(
      "completion audit status: docs/mobile_port_completion_audit.md must be updated from not complete to complete after physical evidence passes."
    );
  });

  it("fails closed when the desktop harness evidence helper is not wired", () => {
    const scripts = { ...packageJson().scripts };
    delete scripts["mobile:desktop-evidence"];
    const evaluation = evaluateMobileCompletion({
      packageJson: { scripts },
      optimizationReport: completeReport(),
      completionAudit: "Status: complete.\n\nAll mobile requirements are proven.",
      deviceEvaluation: readyDeviceValidation(),
      simulatorEvaluation: readySimulatorEvidence(),
      menuEvaluation: readyMenuComparison(),
      surfaceEvaluation: readySurfaceEvidence(),
      runtimeEvaluation: readyRuntimeEvidence(),
      freshnessEvaluation: readyFreshnessEvidence()
    });

    expect(evaluation.complete).toBe(false);
    expect(evaluation.issues).toContain(
      "desktop harness evidence command: package.json must expose npm run mobile:desktop-evidence for seeding the locally provable desktop browser harness evidence."
    );
  });

  it("fails closed when the physical validation workflow commands are not wired", () => {
    const scripts = { ...packageJson().scripts };
    delete scripts["mobile:prepare"];
    delete scripts["mobile:physical"];
    delete scripts["mobile:validate"];
    const evaluation = evaluateMobileCompletion({
      packageJson: { scripts },
      optimizationReport: completeReport(),
      completionAudit: "Status: complete.\n\nAll mobile requirements are proven.",
      deviceEvaluation: readyDeviceValidation(),
      simulatorEvaluation: readySimulatorEvidence(),
      menuEvaluation: readyMenuComparison(),
      surfaceEvaluation: readySurfaceEvidence(),
      runtimeEvaluation: readyRuntimeEvidence(),
      freshnessEvaluation: readyFreshnessEvidence()
    });

    expect(evaluation.complete).toBe(false);
    expect(evaluation.issues).toContain(
      "mobile device preparation command: package.json must expose npm run mobile:prepare for creating the local physical-device evidence packet."
    );
    expect(evaluation.issues).toContain(
      "physical readiness command: package.json must expose npm run mobile:physical for summarizing the remaining real-device validation pass."
    );
    expect(evaluation.issues).toContain(
      "physical validation command: package.json must expose npm run mobile:validate for checking completed real-device evidence."
    );
  });

  it("fails when the final report lacks concrete next optimization proposals", () => {
    const evaluation = evaluateMobileCompletion({
      packageJson: packageJson(),
      optimizationReport: [
        "## Current Recommendation",
        "## Live Status Authority",
        "This report is not a live status cache.",
        "Run `npm test` for current tests.",
        "Run `npm run mobile:status`; it is diagnostic only.",
        "Run `npm run mobile:completion` as the fail-closed authority.",
        "Historical screenshots never prove the current layout.",
        "## Evidence",
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
        "## Historical Captured Visual QA Read",
        "## Game Feel Alignment",
        "docs/game_design_reading_notes/swink_game_feel.md",
        "docs/game_design_concepts/02_text_cutting_game_feel.md",
        "## Remaining Gaps",
        "## Next Optimization Proposals",
        "1. One proposal only.",
        "## Completion Position",
        "npm run mobile:validate"
      ].join("\n"),
      completionAudit: "Status: complete.",
      deviceEvaluation: readyDeviceValidation(),
      simulatorEvaluation: readySimulatorEvidence(),
      menuEvaluation: readyMenuComparison(),
      surfaceEvaluation: readySurfaceEvidence(),
      runtimeEvaluation: readyRuntimeEvidence(),
      freshnessEvaluation: readyFreshnessEvidence()
    });

    expect(evaluation.complete).toBe(false);
    expect(evaluation.issues).toContain(
      "final report sections: docs/mobile_optimization_report.md must include recommendation, evidence, remaining gaps, next proposals, completion position, the live-status authority boundary, and no volatile live results."
    );
  });

  it("fails when the final report does not separate diagnostics from completion authority", () => {
    const evaluation = evaluateMobileCompletion({
      packageJson: packageJson(),
      optimizationReport: completeReport().replace(
        "Run `npm run mobile:status`; it is diagnostic only.",
        "Run `npm run mobile:status` as the completion authority."
      ),
      completionAudit: "Status: complete.\n\nAll mobile requirements are proven.",
      deviceEvaluation: readyDeviceValidation(),
      simulatorEvaluation: readySimulatorEvidence(),
      menuEvaluation: readyMenuComparison(),
      surfaceEvaluation: readySurfaceEvidence(),
      runtimeEvaluation: readyRuntimeEvidence(),
      freshnessEvaluation: readyFreshnessEvidence()
    });

    expect(evaluation.complete).toBe(false);
    expect(evaluation.issues).toContain(
      "final report sections: docs/mobile_optimization_report.md must include recommendation, evidence, remaining gaps, next proposals, completion position, the live-status authority boundary, and no volatile live results."
    );
  });

  it.each([
    "Latest full test result: 106 test files, 941 tests passed.",
    "Freshness gate currently passes.",
    "Temporary capture: /var/folders/example/screenshot.jpg"
  ])("fails when the final report embeds volatile live status: %s", (claim) => {
    const evaluation = evaluateMobileCompletion({
      packageJson: packageJson(),
      optimizationReport: `${completeReport()}\n${claim}`,
      completionAudit: "Status: complete.\n\nAll mobile requirements are proven.",
      deviceEvaluation: readyDeviceValidation(),
      simulatorEvaluation: readySimulatorEvidence(),
      menuEvaluation: readyMenuComparison(),
      surfaceEvaluation: readySurfaceEvidence(),
      runtimeEvaluation: readyRuntimeEvidence(),
      freshnessEvaluation: readyFreshnessEvidence()
    });

    expect(evaluation.complete).toBe(false);
    expect(evaluation.issues).toContain(
      "final report sections: docs/mobile_optimization_report.md must include recommendation, evidence, remaining gaps, next proposals, completion position, the live-status authority boundary, and no volatile live results."
    );
  });

  it("parses device-file arguments and renders command-line output", () => {
    expect(parseMobileCompletionArgs(["--device-file", "docs/custom.md"])).toEqual({ deviceFile: "docs/custom.md" });
    expect(parseMobileCompletionArgs(["--device-file=docs/inline.md"])).toEqual({ deviceFile: "docs/inline.md" });
    expect(parseMobileCompletionArgs([])).toEqual({ deviceFile: "docs/mobile_device_validation_completed.md" });

    const output = renderMobileCompletionEvaluation(
      evaluateMobileCompletion({
        packageJson: packageJson(),
        optimizationReport: completeReport(),
        completionAudit: "Status: not complete.",
        deviceEvaluation: {
          ready: false,
          file: "missing.md",
          evidenceRoot: "docs/mobile_device_evidence",
          issues: ["missing.md does not exist"]
        },
        simulatorEvaluation: readySimulatorEvidence(),
        menuEvaluation: readyMenuComparison(),
        surfaceEvaluation: readySurfaceEvidence(),
        runtimeEvaluation: readyRuntimeEvidence(),
        freshnessEvaluation: {
          ready: false,
          issues: ["runtime capture is older than Hud.ts"],
          checkedFiles: ["src/game/ui/Hud.ts", ".qa/mobile-runtime/latest/cua-flow-review.png"],
          groups: []
        }
      })
    );

    expect(output).toContain("Tokenizer Training mobile completion audit");
    expect(output).toContain("Decision: not complete");
    expect(output).toContain("- PASS mobile preflight command:");
    expect(output).toContain("- PASS mobile local contract command:");
    expect(output).toContain("- PASS mobile capture command:");
    expect(output).toContain("- PASS mobile cross-reference command:");
    expect(output).toContain("- PASS mobile evidence freshness command:");
    expect(output).toContain("- PASS iOS simulator command:");
    expect(output).toContain("- PASS mobile device preparation command:");
    expect(output).toContain("- PASS desktop harness evidence command:");
    expect(output).toContain("- PASS physical readiness command:");
    expect(output).toContain("- PASS mobile device probe command:");
    expect(output).toContain("- PASS mobile status command:");
    expect(output).toContain("- PASS physical validation command:");
    expect(output).toContain("- PASS iOS simulator evidence:");
    expect(output).toContain("- PASS mobile menu comparison:");
    expect(output).toContain("- FAIL mobile evidence freshness:");
    expect(output).toContain("- FAIL physical device validation:");
    expect(output).toContain("runtime capture is older than Hud.ts");
    expect(output).toContain("Issues:");
  });
});

function packageJson(): { scripts: Record<string, string> } {
  return {
    scripts: {
      "mobile:preflight": preflightScript,
      "mobile:local": "npm run mobile:crossref && npm run mobile:simulator && npm run mobile:freshness",
      "mobile:capture": "tsx scripts/capture-mobile-cross-reference.ts",
      "mobile:crossref": "tsx scripts/evaluate-mobile-cross-reference.ts",
      "mobile:freshness": "tsx scripts/evaluate-mobile-evidence-freshness.ts",
      "mobile:simulator": "tsx scripts/evaluate-ios-simulator-evidence.ts",
      "mobile:prepare": "tsx scripts/prepare-mobile-device-validation.ts",
      "mobile:desktop-evidence": "tsx scripts/seed-mobile-desktop-harness-evidence.ts",
      "mobile:physical": "tsx scripts/report-mobile-physical-readiness.ts",
      "mobile:device-probe": "tsx scripts/probe-mobile-device-access.ts",
      "mobile:status": "tsx scripts/report-mobile-status.ts",
      "mobile:validate": "tsx scripts/evaluate-mobile-device-validation.ts"
    }
  };
}

function completeReport(): string {
  return [
    "## Current Recommendation",
    "Keep the mobile shell around the Phaser/Vite game.",
    "## Live Status Authority",
    "This report is not a live status cache.",
    "Run `npm test` for current tests.",
    "Run `npm run mobile:status`; it is diagnostic only.",
    "Run `npm run mobile:completion` as the fail-closed authority.",
    "Historical screenshots never prove the current layout.",
    "## Evidence",
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
    "## Historical Captured Visual QA Read",
    "Short mobile menu",
    "Active mobile play",
    "## Game Feel Alignment",
    "docs/game_design_reading_notes/swink_game_feel.md",
    "docs/game_design_concepts/02_text_cutting_game_feel.md",
    "## Remaining Gaps",
    "No remaining gaps after physical validation.",
    "## Next Optimization Proposals",
    "1. Harden capture.",
    "2. Improve typography.",
    "3. Add storage inspection.",
    "## Completion Position",
    "npm run mobile:validate"
  ].join("\n");
}

function readyDeviceValidation(): MobileValidationEvaluation {
  return {
    ready: true,
    file: "docs/mobile_device_validation_completed.md",
    evidenceRoot: "docs/mobile_device_evidence",
    issues: []
  };
}

function readySimulatorEvidence(): IosSimulatorEvidenceEvaluation {
  return {
    ready: true,
    directory: ".qa/ios-simulator/latest",
    issues: [],
    checkedFiles: ["default-menu.jpg"]
  };
}

function readyMenuComparison(): MobileMenuComparisonEvaluation {
  return {
    ready: true,
    directory: ".qa/iab-surface-compare/latest",
    issues: [],
    checkedFiles: ["comparison.json"]
  };
}

function readySurfaceEvidence(): MobileSurfaceEvidenceEvaluation {
  return {
    ready: true,
    directory: ".qa/mobile-port-audit/latest",
    issues: [],
    checkedFiles: ["surface.json"]
  };
}

function readyRuntimeEvidence(): MobileRuntimeEvidenceEvaluation {
  return {
    ready: true,
    directory: ".qa/mobile-runtime/latest",
    issues: [],
    checkedFiles: ["runtime.json"]
  };
}

function readyFreshnessEvidence(): MobileEvidenceFreshnessEvaluation {
  return {
    ready: true,
    issues: [],
    checkedFiles: ["src/game/ui/Hud.ts", ".qa/mobile-runtime/latest/cua-flow-review.png"],
    groups: []
  };
}
