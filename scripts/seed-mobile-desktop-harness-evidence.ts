import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { prepareMobileDeviceValidation } from "./prepare-mobile-device-validation";

export interface MobileDesktopHarnessEvidenceOptions {
  validationPath: string;
  templatePath: string;
  evidenceDir: string;
  sourcePath: string;
  artifactName: string;
  overwrite?: boolean;
}

export interface SeededMobileDesktopHarnessEvidence {
  validationFile: string;
  evidenceFile: string;
  sourceFile: string;
  validationCreated: boolean;
  artifactWritten: boolean;
  validationUpdated: boolean;
}

const DEFAULT_VALIDATION_PATH = "docs/mobile_device_validation_completed.md";
const DEFAULT_TEMPLATE_PATH = "docs/mobile_device_validation_completed_template.md";
const DEFAULT_EVIDENCE_DIR = "docs/mobile_device_evidence";
const DEFAULT_SOURCE_PATH = ".qa/mobile-port-audit/latest/browser-desktop-endless-pinned-simple-001.png";
const DEFAULT_ARTIFACT_NAME = "desktop-pinned-fixture.png";

const desktopTargetRow = [
  "Desktop browser harness",
  "Desktop 1280x720 browser harness",
  "desktop-pinned-fixture.png; endless mode pinned simple_001 fixture artifact from the desktop 1280x720 browser harness.",
  "Pass"
] as const;

const desktopCheckRow = [
  "Desktop browser harness still matches browser contract",
  "desktop-pinned-fixture.png shows the desktop 1280x720 browser harness in endless mode with pinned simple_001 fixture artifact; browser layout remains separate from mobile bottom-docked controls.",
  "Pass"
] as const;

const desktopInventoryValue =
  "desktop-pinned-fixture.png; desktop 1280x720 browser harness, endless mode, simple_001 pinned fixture artifact.";

export function seedMobileDesktopHarnessEvidence(
  options: MobileDesktopHarnessEvidenceOptions
): SeededMobileDesktopHarnessEvidence {
  const sourceFile = resolve(options.sourcePath);
  if (!existsSync(sourceFile)) {
    throw new Error(`Desktop harness source artifact is missing: ${sourceFile}`);
  }

  const prepared = prepareMobileDeviceValidation({
    outputPath: options.validationPath,
    templatePath: options.templatePath,
    evidenceDir: options.evidenceDir
  });
  const evidenceDir = resolve(options.evidenceDir);
  const evidenceFile = resolve(evidenceDir, options.artifactName);
  mkdirSync(dirname(evidenceFile), { recursive: true });

  const artifactWritten = options.overwrite === true || !existsSync(evidenceFile);
  if (artifactWritten) {
    copyFileSync(sourceFile, evidenceFile);
  }

  const validationFile = resolve(options.validationPath);
  const before = readFileSync(validationFile, "utf8");
  const after = seedDesktopHarnessRows(before, {
    artifactName: basename(evidenceFile),
    overwrite: options.overwrite === true
  });
  const validationUpdated = before !== after;
  if (validationUpdated) {
    writeFileSync(validationFile, after, "utf8");
  }

  return {
    validationFile,
    evidenceFile,
    sourceFile,
    validationCreated: prepared.created,
    artifactWritten,
    validationUpdated
  };
}

export function seedDesktopHarnessRows(
  markdown: string,
  options: { artifactName?: string; overwrite?: boolean } = {}
): string {
  const artifactName = options.artifactName ?? DEFAULT_ARTIFACT_NAME;
  const targetRow = withArtifactName(desktopTargetRow, artifactName);
  const checkRow = withArtifactName(desktopCheckRow, artifactName);
  const inventoryValue = desktopInventoryValue.replaceAll(DEFAULT_ARTIFACT_NAME, artifactName);
  let updated = replaceTableRow(
    markdown,
    "Desktop browser harness",
    tableRow(targetRow),
    options.overwrite === true
  );
  updated = replaceTableRow(
    updated,
    "Desktop browser harness still matches browser contract",
    tableRow(checkRow),
    options.overwrite === true
  );
  updated = replaceBulletValue(
    updated,
    "Desktop browser pinned fixture",
    inventoryValue,
    options.overwrite === true
  );
  return updated;
}

export function parseMobileDesktopHarnessEvidenceArgs(args: string[]): MobileDesktopHarnessEvidenceOptions {
  return {
    validationPath: valueForFlag(args, "--validation") ?? DEFAULT_VALIDATION_PATH,
    templatePath: valueForFlag(args, "--template") ?? DEFAULT_TEMPLATE_PATH,
    evidenceDir: valueForFlag(args, "--evidence-dir") ?? DEFAULT_EVIDENCE_DIR,
    sourcePath: valueForFlag(args, "--source") ?? DEFAULT_SOURCE_PATH,
    artifactName: valueForFlag(args, "--artifact") ?? DEFAULT_ARTIFACT_NAME,
    overwrite: args.includes("--overwrite")
  };
}

export function renderSeededMobileDesktopHarnessEvidence(
  result: SeededMobileDesktopHarnessEvidence
): string {
  return [
    "Tokenizer Training desktop browser harness evidence",
    "",
    `  validation file: ${result.validationFile}`,
    `  ${result.validationCreated ? "created" : "kept"} validation template`,
    `  source artifact: ${result.sourceFile}`,
    `  ${result.artifactWritten ? "wrote" : "kept"} evidence artifact: ${result.evidenceFile}`,
    `  ${result.validationUpdated ? "updated" : "kept"} desktop harness rows`,
    "",
    "This seeds only the locally provable desktop browser harness target.",
    "Real phone target rows, touch observations, audio observations, and final decision still require physical-device evidence."
  ].join("\n");
}

function replaceTableRow(markdown: string, rowLabel: string, replacement: string, overwrite: boolean): string {
  const lines = markdown.split(/\r?\n/);
  const index = lines.findIndex((line) => normalizedTableLabel(line) === rowLabel);
  if (index < 0) {
    return markdown;
  }

  if (!overwrite && !isBlankTableRow(lines[index])) {
    return markdown;
  }

  lines[index] = replacement;
  return lines.join("\n");
}

function replaceBulletValue(markdown: string, label: string, value: string, overwrite: boolean): string {
  const lines = markdown.split(/\r?\n/);
  const prefix = `- ${label}:`;
  const index = lines.findIndex((line) => line.trimStart().startsWith(prefix));
  if (index < 0) {
    return markdown;
  }

  const currentValue = lines[index].slice(lines[index].indexOf(prefix) + prefix.length).trim();
  if (!overwrite && currentValue.length > 0) {
    return markdown;
  }

  lines[index] = `- ${label}: ${value}`;
  return lines.join("\n");
}

function normalizedTableLabel(line: string): string {
  const cells = tableCells(line);
  return cells[0] ?? "";
}

function isBlankTableRow(line: string): boolean {
  const [, ...cells] = tableCells(line);
  return cells.every((cell) => cell.trim().length === 0);
}

function tableCells(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) {
    return [];
  }

  return trimmed.slice(1, -1).split("|").map((cell) => cell.trim());
}

function tableRow(cells: readonly string[]): string {
  return `| ${cells.join(" | ")} |`;
}

function withArtifactName(cells: readonly string[], artifactName: string): string[] {
  return cells.map((cell) => cell.replaceAll(DEFAULT_ARTIFACT_NAME, artifactName));
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

function usage(): string {
  return [
    "Usage:",
    "  npm run mobile:desktop-evidence",
    "  npm run mobile:desktop-evidence -- --overwrite",
    "  npm run mobile:desktop-evidence -- --source .qa/mobile-port-audit/latest/browser-desktop-endless-pinned-simple-001.png",
    "  npm run mobile:desktop-evidence -- --validation docs/mobile_device_validation_completed.md",
    "  npm run mobile:desktop-evidence -- --evidence-dir docs/mobile_device_evidence",
    "",
    "Copies the validated desktop pinned-fixture artifact into the physical evidence directory.",
    "Fills only the desktop browser harness rows in the completed validation file.",
    "Does not mark real-phone checks or the final decision as complete."
  ].join("\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log(usage());
  } else {
    try {
      const result = seedMobileDesktopHarnessEvidence(
        parseMobileDesktopHarnessEvidenceArgs(process.argv.slice(2))
      );
      console.log(renderSeededMobileDesktopHarnessEvidence(result));
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }
}
