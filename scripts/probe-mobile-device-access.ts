import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export interface MobileDeviceProbeCommandResult {
  command: string;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  error?: string;
}

export interface XcdeviceRecord {
  name?: string;
  identifier?: string;
  platform?: string;
  simulator?: boolean;
  available?: boolean;
  modelName?: string;
  operatingSystemVersion?: string;
}

export interface MobileDeviceProbeDevice {
  name: string;
  identifier: string;
  platform: string;
  available: boolean;
  operatingSystemVersion: string;
}

export interface MobileDeviceProbeEvaluation {
  ready: boolean;
  command: MobileDeviceProbeCommandResult;
  devices: MobileDeviceProbeDevice[];
  rawDeviceCount: number;
  issues: string[];
  warnings: string[];
}

export function evaluateMobileDeviceProbe(command: MobileDeviceProbeCommandResult): MobileDeviceProbeEvaluation {
  const issues: string[] = [];
  const warnings: string[] = [];
  const records = parseXcdeviceList(command.stdout, issues);
  const devices = records.filter(isPhysicalMobileDevice).map(toProbeDevice);
  const availableDevices = devices.filter((device) => device.available);

  if (command.exitCode !== 0 && records.length === 0) {
    issues.push(`Device probe command failed with exit code ${String(command.exitCode)}.`);
  } else if (command.exitCode !== 0) {
    warnings.push(`Device probe command exited with ${String(command.exitCode)} but returned parseable device data.`);
  }

  if (command.error) {
    warnings.push(`Device probe command error: ${command.error}.`);
  }

  const diagnostic = firstDiagnostic(command.stderr);
  if (diagnostic) {
    warnings.push(deviceProbeDiagnosticWarning(diagnostic));
  }

  if (availableDevices.length === 0) {
    if (devices.length > 0) {
      issues.push(`Physical iOS/iPadOS device is visible but unavailable to Xcode: ${unavailableDeviceSummary(devices)}.`);
    }
    issues.push("No available physical iPhone or iPad is visible to Xcode.");
  }

  return {
    ready: availableDevices.length > 0,
    command,
    devices,
    rawDeviceCount: records.length,
    issues,
    warnings
  };
}

export function renderMobileDeviceProbeEvaluation(evaluation: MobileDeviceProbeEvaluation): string {
  const lines = [
    "Tokenizer Training mobile device access probe",
    `Decision: ${evaluation.ready ? "physical iOS/iPadOS device visible" : "no physical iOS/iPadOS device visible"}`,
    `Command: ${evaluation.command.command}`,
    `Parsed device records: ${evaluation.rawDeviceCount}`,
    "",
    "Visible physical iOS/iPadOS devices:"
  ];

  if (evaluation.devices.length === 0) {
    lines.push("- none");
  } else {
    for (const device of evaluation.devices) {
      lines.push(
        `- ${device.available ? "available" : "unavailable"} ${device.name} (${device.platform}, ${device.operatingSystemVersion}) ${device.identifier}`
      );
    }
  }

  if (evaluation.issues.length > 0) {
    lines.push("", "Issues:");
    for (const issue of evaluation.issues) {
      lines.push(`- ${issue}`);
    }
    lines.push(`- ${deviceProbeNextAction(evaluation)}`);
  }

  if (evaluation.warnings.length > 0) {
    lines.push("", "Warnings:");
    for (const warning of evaluation.warnings) {
      lines.push(`- ${warning}`);
    }
  }

  return lines.join("\n");
}

export function parseXcdeviceList(output: string, issues: string[] = []): XcdeviceRecord[] {
  const arrayMatch = /(^|\n)\s*\[/.exec(output);
  const start = arrayMatch ? arrayMatch.index + arrayMatch[0].lastIndexOf("[") : -1;
  const end = output.lastIndexOf("]");
  if (start < 0 || end <= start) {
    issues.push("Could not find a JSON device array in xcrun xcdevice list output.");
    return [];
  }

  try {
    const parsed = JSON.parse(output.slice(start, end + 1));
    if (!Array.isArray(parsed)) {
      issues.push("xcrun xcdevice list output JSON was not an array.");
      return [];
    }
    return parsed.filter((record): record is XcdeviceRecord => record && typeof record === "object");
  } catch (error) {
    issues.push(`Could not parse xcrun xcdevice list JSON: ${error instanceof Error ? error.message : String(error)}.`);
    return [];
  }
}

export function runXcdeviceList(): MobileDeviceProbeCommandResult {
  const result = spawnSync("xcrun", ["xcdevice", "list"], {
    encoding: "utf8",
    timeout: 20_000
  });

  return {
    command: "xcrun xcdevice list",
    exitCode: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    error: result.error?.message
  };
}

function isPhysicalMobileDevice(record: XcdeviceRecord): boolean {
  if (record.simulator) {
    return false;
  }

  const searchable = [record.platform, record.modelName, record.name].filter(Boolean).join(" ").toLowerCase();
  return /iphone|ipad|iphoneos|ipados/.test(searchable);
}

function toProbeDevice(record: XcdeviceRecord): MobileDeviceProbeDevice {
  return {
    name: record.name ?? record.modelName ?? "Unnamed iOS device",
    identifier: record.identifier ?? "unknown-id",
    platform: record.platform ?? "unknown-platform",
    available: record.available === true,
    operatingSystemVersion: record.operatingSystemVersion ?? "unknown OS"
  };
}

function unavailableDeviceSummary(devices: MobileDeviceProbeDevice[]): string {
  return devices
    .filter((device) => !device.available)
    .map((device) => `${device.name} (${device.platform}, ${device.operatingSystemVersion}) ${device.identifier}`)
    .join("; ");
}

function deviceProbeNextAction(evaluation: MobileDeviceProbeEvaluation): string {
  if (evaluation.devices.some((device) => !device.available)) {
    return "Unlock the listed iPhone/iPad, trust this Mac, enable Developer Mode if required, resolve any Xcode device pairing prompt, then rerun this probe.";
  }

  return "Connect a real iPhone/iPad, unlock it, trust this Mac, enable Developer Mode if required, then rerun this probe.";
}

function firstDiagnostic(stderr: string): string {
  return stderr
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean)
    ?.slice(0, 240) ?? "";
}

function deviceProbeDiagnosticWarning(diagnostic: string): string {
  const cleaned = diagnostic.replace(/[.。]\s*$/, "");
  if (/CoreSimulatorService/i.test(diagnostic)) {
    return `Simulator-service diagnostic while probing devices: ${cleaned}. Physical-device visibility is still decided from parsed xcdevice records.`;
  }

  return `Device probe diagnostics: ${cleaned}`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const evaluation = evaluateMobileDeviceProbe(runXcdeviceList());
  console.log(renderMobileDeviceProbeEvaluation(evaluation));
  process.exit(evaluation.ready ? 0 : 1);
}
