import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export interface MobileDeviceValidationSetupOptions {
  outputPath: string;
  templatePath: string;
  evidenceDir?: string;
  observerTemplatePath?: string;
  inputFeelTemplatePath?: string;
  overwrite?: boolean;
}

export interface PreparedMobileDeviceValidation {
  file: string;
  evidenceDir: string;
  observerNoteFile: string;
  inputFeelSummaryFile: string;
  observerNoteCreated: boolean;
  observerNoteRefreshed: boolean;
  inputFeelSummaryCreated: boolean;
  inputFeelSummaryRefreshed: boolean;
  created: boolean;
}

const DEFAULT_OUTPUT_PATH = "docs/mobile_device_validation_completed.md";
const DEFAULT_TEMPLATE_PATH = "docs/mobile_device_validation_completed_template.md";
const DEFAULT_EVIDENCE_DIR = "docs/mobile_device_evidence";
const DEFAULT_OBSERVER_TEMPLATE_PATH = "docs/mobile_device_observer_note_template.md";
const DEFAULT_INPUT_FEEL_TEMPLATE_PATH = "docs/mobile_device_input_feel_summary_template.md";

export function prepareMobileDeviceValidation(
  options: MobileDeviceValidationSetupOptions
): PreparedMobileDeviceValidation {
  const file = resolve(options.outputPath);
  const evidenceDir = resolve(options.evidenceDir ?? DEFAULT_EVIDENCE_DIR);
  const observerNoteFile = resolve(evidenceDir, "observer-note.md");
  const inputFeelSummaryFile = resolve(evidenceDir, "input-feel-summary.md");
  const exists = existsSync(file);
  mkdirSync(evidenceDir, { recursive: true });
  const observerNote = createOrRefreshBlankTemplateFile(
    observerNoteFile,
    options.observerTemplatePath ?? DEFAULT_OBSERVER_TEMPLATE_PATH
  );
  const inputFeelSummary = createOrRefreshBlankTemplateFile(
    inputFeelSummaryFile,
    options.inputFeelTemplatePath ?? DEFAULT_INPUT_FEEL_TEMPLATE_PATH
  );

  if (!exists || options.overwrite) {
    const template = readFileSync(resolve(options.templatePath), "utf8");
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, template, "utf8");
    return {
      file,
      evidenceDir,
      observerNoteFile,
      inputFeelSummaryFile,
      observerNoteCreated: observerNote.created,
      observerNoteRefreshed: observerNote.refreshed,
      inputFeelSummaryCreated: inputFeelSummary.created,
      inputFeelSummaryRefreshed: inputFeelSummary.refreshed,
      created: true
    };
  }

  return {
    file,
    evidenceDir,
    observerNoteFile,
    inputFeelSummaryFile,
    observerNoteCreated: observerNote.created,
    observerNoteRefreshed: observerNote.refreshed,
    inputFeelSummaryCreated: inputFeelSummary.created,
    inputFeelSummaryRefreshed: inputFeelSummary.refreshed,
    created: false
  };
}

export function renderPreparedMobileDeviceValidation(validation: PreparedMobileDeviceValidation): string {
  const status = validation.created ? "created" : "kept";
  return [
    "Tokenizer Training mobile device validation file",
    "",
    `  ${status}: ${validation.file}`,
    `  evidence directory: ${validation.evidenceDir}`,
    `  ${evidenceTemplateStatus(validation.observerNoteCreated, validation.observerNoteRefreshed)} observer note: ${validation.observerNoteFile}`,
    `  ${evidenceTemplateStatus(validation.inputFeelSummaryCreated, validation.inputFeelSummaryRefreshed)} input-feel summary: ${validation.inputFeelSummaryFile}`,
    "",
    "The validation file and evidence directory are local physical-test artifacts ignored by Git.",
    "Put photos, screenshots, screen recordings, and observer notes in the evidence directory.",
    "Fill the validation file with those artifact filenames plus concrete notes, then run:",
    "  npm run mobile:validate"
  ].join("\n");
}

export function parseMobileDeviceValidationSetupArgs(args: string[]): MobileDeviceValidationSetupOptions {
  return {
    outputPath: valueForFlag(args, "--output") ?? DEFAULT_OUTPUT_PATH,
    templatePath: valueForFlag(args, "--template") ?? DEFAULT_TEMPLATE_PATH,
    evidenceDir: valueForFlag(args, "--evidence-dir") ?? DEFAULT_EVIDENCE_DIR,
    observerTemplatePath: valueForFlag(args, "--observer-template") ?? DEFAULT_OBSERVER_TEMPLATE_PATH,
    inputFeelTemplatePath: valueForFlag(args, "--input-feel-template") ?? DEFAULT_INPUT_FEEL_TEMPLATE_PATH,
    overwrite: args.includes("--overwrite")
  };
}

function createOrRefreshBlankTemplateFile(outputFile: string, templatePath: string): { created: boolean; refreshed: boolean } {
  const template = readFileSync(resolve(templatePath), "utf8");
  if (existsSync(outputFile)) {
    const existing = readFileSync(outputFile, "utf8");
    if (existing !== template && isBlankPreparedEvidenceTemplate(existing, template)) {
      writeFileSync(outputFile, template, "utf8");
      return { created: false, refreshed: true };
    }

    return { created: false, refreshed: false };
  }

  mkdirSync(dirname(outputFile), { recursive: true });
  writeFileSync(outputFile, template, "utf8");
  return { created: true, refreshed: false };
}

function isBlankPreparedEvidenceTemplate(existing: string, template: string): boolean {
  const templateLines = new Set(
    template
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
  );

  for (const rawLine of existing.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0 || templateLines.has(line)) {
      continue;
    }
    if (/^-\s+[^:]+:\s*$/.test(line)) {
      continue;
    }
    return false;
  }

  return true;
}

function evidenceTemplateStatus(created: boolean, refreshed: boolean): string {
  if (created) {
    return "created";
  }
  if (refreshed) {
    return "refreshed blank stale";
  }
  return "kept";
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
    "  npm run mobile:prepare",
    "  npm run mobile:prepare -- --output docs/mobile_device_validation_completed.md",
    "  npm run mobile:prepare -- --evidence-dir docs/mobile_device_evidence",
    "  npm run mobile:prepare -- --observer-template docs/mobile_device_observer_note_template.md",
    "  npm run mobile:prepare -- --input-feel-template docs/mobile_device_input_feel_summary_template.md",
    "",
    "Creates a completed mobile-device validation file from docs/mobile_device_validation_completed_template.md.",
    "Creates the physical evidence directory if it does not exist.",
    "Creates docs/mobile_device_evidence/observer-note.md from the observer-note template if absent.",
    "Creates docs/mobile_device_evidence/input-feel-summary.md from the input-feel template if absent.",
    "Refreshes existing observer/input-feel files only when they are still blank template-shaped files.",
    "Existing files are kept unless --overwrite is passed.",
    "After filling physical-device evidence, run npm run mobile:validate."
  ].join("\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log(usage());
  } else {
    const validation = prepareMobileDeviceValidation(parseMobileDeviceValidationSetupArgs(process.argv.slice(2)));
    console.log(renderPreparedMobileDeviceValidation(validation));
  }
}
