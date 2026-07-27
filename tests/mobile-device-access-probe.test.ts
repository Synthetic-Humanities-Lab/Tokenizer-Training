import { describe, expect, it } from "vitest";
import {
  evaluateMobileDeviceProbe,
  parseXcdeviceList,
  renderMobileDeviceProbeEvaluation,
  type MobileDeviceProbeCommandResult
} from "../scripts/probe-mobile-device-access";

describe("mobile device access probe", () => {
  it("passes only when a physical iPhone or iPad is available", () => {
    const evaluation = evaluateMobileDeviceProbe(commandWithOutput(JSON.stringify([
      {
        name: "Doug's iPhone",
        identifier: "00008110-001C195E0E91801E",
        platform: "com.apple.platform.iphoneos",
        simulator: false,
        available: true,
        modelName: "iPhone 15",
        operatingSystemVersion: "26.5"
      },
      {
        name: "iPhone 17",
        identifier: "SIM-1",
        platform: "com.apple.platform.iphonesimulator",
        simulator: true,
        available: true,
        modelName: "iPhone 17"
      }
    ])));

    expect(evaluation.ready).toBe(true);
    expect(evaluation.devices).toHaveLength(1);
    expect(evaluation.devices[0]?.name).toBe("Doug's iPhone");
    expect(evaluation.issues).toEqual([]);
  });

  it("fails closed when xcdevice sees only the Mac", () => {
    const evaluation = evaluateMobileDeviceProbe(commandWithOutput(JSON.stringify([
      {
        name: "My Mac",
        identifier: "00006034-001410DC26E1001C",
        platform: "com.apple.platform.macosx",
        simulator: false,
        available: true,
        modelName: "MacBook Pro"
      }
    ])));
    const output = renderMobileDeviceProbeEvaluation(evaluation);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.devices).toEqual([]);
    expect(evaluation.issues).toContain("No available physical iPhone or iPad is visible to Xcode.");
    expect(output).toContain("Decision: no physical iOS/iPadOS device visible");
    expect(output).toContain("Connect a real iPhone/iPad");
  });

  it("distinguishes unavailable physical devices from absent physical devices", () => {
    const evaluation = evaluateMobileDeviceProbe(commandWithOutput(JSON.stringify([
      {
        name: "Doug's iPhone",
        identifier: "00008110-001C195E0E91801E",
        platform: "com.apple.platform.iphoneos",
        simulator: false,
        available: false,
        modelName: "iPhone 15",
        operatingSystemVersion: "26.5"
      }
    ])));
    const output = renderMobileDeviceProbeEvaluation(evaluation);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.devices).toHaveLength(1);
    expect(evaluation.devices[0]?.available).toBe(false);
    expect(evaluation.issues).toContain(
      "Physical iOS/iPadOS device is visible but unavailable to Xcode: Doug's iPhone (com.apple.platform.iphoneos, 26.5) 00008110-001C195E0E91801E."
    );
    expect(output).toContain("- unavailable Doug's iPhone");
    expect(output).toContain("resolve any Xcode device pairing prompt");
  });

  it("parses JSON arrays after xcdevice diagnostic logs", () => {
    const command = commandWithOutput([
      "2026-06-30 xcdevice[11038] CoreSimulatorService connection became invalid.",
      "[",
      "{\"name\":\"My Mac\",\"platform\":\"com.apple.platform.macosx\",\"simulator\":false,\"available\":true},",
      "{\"name\":\"QA iPad\",\"platform\":\"com.apple.platform.iphoneos\",\"simulator\":false,\"available\":true,\"modelName\":\"iPad\"}",
      "]"
    ].join("\n"));
    const records = parseXcdeviceList(command.stdout);
    const evaluation = evaluateMobileDeviceProbe({
      ...command,
      stderr: "CoreSimulatorService connection became invalid."
    });

    expect(records).toHaveLength(2);
    expect(records[1]?.name).toBe("QA iPad");
    expect(evaluation.ready).toBe(true);
    expect(evaluation.warnings).toContain(
      "Simulator-service diagnostic while probing devices: CoreSimulatorService connection became invalid. Physical-device visibility is still decided from parsed xcdevice records."
    );
  });

  it("reports command and parse failures without claiming device readiness", () => {
    const evaluation = evaluateMobileDeviceProbe({
      command: "xcrun xcdevice list",
      exitCode: 1,
      stdout: "not json",
      stderr: "CoreDevice failed to initialize",
      error: "spawn timeout"
    });

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain("Could not find a JSON device array in xcrun xcdevice list output.");
    expect(evaluation.issues).toContain("Device probe command failed with exit code 1.");
    expect(evaluation.warnings).toContain("Device probe command error: spawn timeout.");
    expect(evaluation.warnings).toContain("Device probe diagnostics: CoreDevice failed to initialize");
  });
});

function commandWithOutput(stdout: string): MobileDeviceProbeCommandResult {
  return {
    command: "xcrun xcdevice list",
    exitCode: 0,
    stdout,
    stderr: ""
  };
}
