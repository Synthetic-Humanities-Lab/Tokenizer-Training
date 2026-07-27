import { describe, expect, it } from "vitest";
import {
  evaluateMobileStatus,
  parseMobileStatusArgs,
  renderMobileStatus
} from "../scripts/report-mobile-status";
import type { MobileCompletionEvaluation } from "../scripts/evaluate-mobile-completion";
import type { MobileDeviceProbeEvaluation } from "../scripts/probe-mobile-device-access";
import type { MobilePhysicalReadinessEvaluation } from "../scripts/report-mobile-physical-readiness";

describe("mobile status report", () => {
  it("summarizes the current expected state when local evidence is ready but no phone is visible", () => {
    const status = evaluateMobileStatus(
      physicalReadiness({ readyForDevicePass: true, physicalComplete: false }),
      deviceProbe({ ready: false }),
      completion({ complete: false })
    );
    const output = renderMobileStatus(status);

    expect(status.complete).toBe(false);
    expect(status.desktopHarnessSeeded).toBe(false);
    expect(status.decision).toBe("local-ready, awaiting visible physical iOS device");
    expect(output).toContain("Local browser/mobile/simulator evidence: ready");
    expect(output).toContain("Desktop browser harness evidence: not seeded");
    expect(output).toContain("Physical iPhone/iPad visible to Xcode: no");
    expect(output).toContain("Physical evidence packet: incomplete");
    expect(output).toContain("Final completion gate: not complete");
    expect(output).toContain("connect a real iPhone/iPad");
    expect(output).toContain("npm run mobile:desktop-evidence");
    expect(output).toContain("No available physical iPhone or iPad is visible to Xcode.");
    expect(output).toContain("Completed evidence file is missing.");
  });

  it("prioritizes local evidence refresh before physical-device work", () => {
    const status = evaluateMobileStatus(
      physicalReadiness({ readyForDevicePass: false, physicalComplete: false }),
      deviceProbe({ ready: true }),
      completion({ complete: false })
    );

    expect(status.decision).toBe("local evidence needs refresh");
    expect(renderMobileStatus(status)).toContain("Refresh local browser/mobile/simulator artifacts");
  });

  it("reports device-visible state when physical evidence is still missing", () => {
    const status = evaluateMobileStatus(
      physicalReadiness({ readyForDevicePass: true, physicalComplete: false }),
      deviceProbe({ ready: true }),
      completion({ complete: false })
    );

    expect(status.decision).toBe("device visible, awaiting completed physical evidence");
    expect(renderMobileStatus(status)).toContain("capture physical artifacts");
    expect(renderMobileStatus(status)).toContain("npm run mobile:desktop-evidence");
  });

  it("summarizes a prepared but blank physical evidence packet", () => {
    const status = evaluateMobileStatus(
      physicalReadiness({
        readyForDevicePass: true,
        physicalComplete: false,
        deviceIssues: preparedBlankPhysicalIssues()
      }),
      deviceProbe({ ready: false }),
      completion({ complete: false })
    );
    const output = renderMobileStatus(status);

    expect(output).toContain("Prepared physical validation file exists but is not filled yet");
    expect(output).toContain("Run npm run mobile:validate for the row-by-row failure list.");
    expect(output).not.toContain("iPhone SE/small phone portrait: verdict must be pass/yes/met/supported.");
    expect(output).not.toContain("Evidence inventory missing: Desktop browser pinned fixture.");
  });

  it("summarizes a prepared phone evidence packet after desktop harness evidence is already seeded", () => {
    const status = evaluateMobileStatus(
      physicalReadiness({
        readyForDevicePass: true,
        physicalComplete: false,
        deviceIssues: preparedPhoneOnlyPhysicalIssues()
      }),
      deviceProbe({ ready: false }),
      completion({ complete: false })
    );
    const output = renderMobileStatus(status);

    expect(output).toContain("Prepared physical validation file exists but is not filled yet");
    expect(output).toContain("Fill Target Evidence, Physical Checklist, Evidence Inventory, and Final Decision.");
    expect(status.desktopHarnessSeeded).toBe(true);
    expect(output).toContain("Desktop browser harness evidence: seeded");
    expect(output).toContain("Desktop harness evidence is seeded.");
    expect(output).not.toContain("Run npm run mobile:desktop-evidence if the desktop harness row is not seeded");
    expect(output).not.toContain("iPhone SE/small phone portrait: verdict must be pass/yes/met/supported.");
    expect(output).not.toContain("Desktop browser harness: device/browser field is missing or generic.");
  });

  it("truncates long non-template physical validation issue lists", () => {
    const status = evaluateMobileStatus(
      physicalReadiness({
        readyForDevicePass: true,
        physicalComplete: false,
        deviceIssues: Array.from({ length: 10 }, (_, index) => `specific issue ${index + 1}`)
      }),
      deviceProbe({ ready: true }),
      completion({ complete: false })
    );
    const output = renderMobileStatus(status);

    expect(output).toContain("specific issue 1");
    expect(output).toContain("specific issue 8");
    expect(output).not.toContain("specific issue 9");
    expect(output).toContain("... 2 more physical validation issue(s); run npm run mobile:validate for the full list.");
  });

  it("parses status paths", () => {
    expect(parseMobileStatusArgs(["--device-file", "docs/custom.md", "--evidence-root=/tmp/evidence"])).toEqual({
      deviceFile: "docs/custom.md",
      evidenceRoot: "/tmp/evidence"
    });
    expect(parseMobileStatusArgs(["--file=docs/inline.md"])).toEqual({
      deviceFile: "docs/inline.md",
      evidenceRoot: "docs/mobile_device_evidence"
    });
  });
});

function physicalReadiness(options: {
  readyForDevicePass: boolean;
  physicalComplete: boolean;
  deviceIssues?: string[];
}): MobilePhysicalReadinessEvaluation {
  return {
    readyForDevicePass: options.readyForDevicePass,
    physicalComplete: options.physicalComplete,
    issues: options.readyForDevicePass ? [] : ["mobile evidence freshness: stale artifact"],
    inputs: {
      deviceFile: "docs/mobile_device_validation_completed.md",
      evidenceRoot: "docs/mobile_device_evidence",
      simulatorEvaluation: { ready: options.readyForDevicePass, directory: ".qa/ios-simulator/latest", issues: [], checkedFiles: [] },
      menuEvaluation: { ready: options.readyForDevicePass, directory: ".qa/iab-surface-compare/latest", issues: [], checkedFiles: [] },
      surfaceEvaluation: { ready: options.readyForDevicePass, directory: ".qa/mobile-port-audit/latest", issues: [], checkedFiles: [] },
      runtimeEvaluation: { ready: options.readyForDevicePass, directory: ".qa/mobile-runtime/latest", issues: [], checkedFiles: [] },
      freshnessEvaluation: { ready: options.readyForDevicePass, issues: [], checkedFiles: [], groups: [] },
      deviceEvaluation: {
        ready: options.physicalComplete,
        file: "docs/mobile_device_validation_completed.md",
        evidenceRoot: "docs/mobile_device_evidence",
        issues: options.physicalComplete ? [] : options.deviceIssues ?? ["Completed evidence file is missing."]
      }
    }
  };
}

function deviceProbe(options: { ready: boolean }): MobileDeviceProbeEvaluation {
  return {
    ready: options.ready,
    command: {
      command: "xcrun xcdevice list",
      exitCode: 0,
      stdout: "[]",
      stderr: ""
    },
    devices: options.ready
      ? [{
        name: "QA iPhone",
        identifier: "device-id",
        platform: "com.apple.platform.iphoneos",
        available: true,
        operatingSystemVersion: "26.5"
      }]
      : [],
    rawDeviceCount: options.ready ? 1 : 0,
    issues: options.ready ? [] : ["No available physical iPhone or iPad is visible to Xcode."],
    warnings: []
  };
}

function completion(options: { complete: boolean }): MobileCompletionEvaluation {
  return {
    complete: options.complete,
    issues: options.complete ? [] : ["physical device validation: missing"],
    checks: []
  };
}

function preparedBlankPhysicalIssues(): string[] {
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
    "Desktop browser harness: device/browser field is missing or generic.",
    "Desktop browser harness: evidence file or note is missing or generic.",
    "Desktop browser harness: verdict must be pass/yes/met/supported.",
    "Evidence inventory missing: Small-phone menu.",
    "Evidence inventory missing: Input-feel copied summary or trace.",
    "Evidence inventory missing: Desktop browser pinned fixture.",
    "Final decision must mark Mobile device validation passed as yes/pass/met."
  ];
}

function preparedPhoneOnlyPhysicalIssues(): string[] {
  return preparedBlankPhysicalIssues().filter((issue) => (
    !issue.startsWith("Desktop browser harness:")
    && issue !== "Evidence inventory missing: Desktop browser pinned fixture."
  ));
}
