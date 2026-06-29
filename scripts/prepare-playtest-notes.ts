import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export interface PlaytestNoteSetupOptions {
  count: number;
  outputDir: string;
  templatePath: string;
  overwrite?: boolean;
}

export interface PreparedPlaytestNote {
  file: string;
  created: boolean;
}

const DEFAULT_COUNT = 5;
const DEFAULT_OUTPUT_DIR = "docs/playtests";
const DEFAULT_TEMPLATE_PATH = "docs/playtest_session_notes_template.md";

export function preparePlaytestNotes(options: PlaytestNoteSetupOptions): PreparedPlaytestNote[] {
  const count = Math.max(1, Math.floor(options.count));
  const outputDir = resolve(options.outputDir);
  const template = readFileSync(resolve(options.templatePath), "utf8");
  const notes: PreparedPlaytestNote[] = [];

  mkdirSync(outputDir, { recursive: true });

  for (let index = 1; index <= count; index += 1) {
    const file = join(outputDir, `session-${index}.md`);
    const exists = existsSync(file);
    if (!exists || options.overwrite) {
      writeFileSync(file, sessionTemplateForIndex(template, index), "utf8");
      notes.push({ file, created: true });
      continue;
    }

    notes.push({ file, created: false });
  }

  return notes;
}

export function renderPreparedPlaytestNotes(notes: PreparedPlaytestNote[]): string {
  return [
    "Tokenization Training playtest note files",
    "",
    ...notes.map((note) => {
      const status = note.created ? "created" : "kept";
      return `  ${status}: ${note.file}`;
    })
  ].join("\n");
}

export function parsePlaytestNoteSetupArgs(args: string[]): PlaytestNoteSetupOptions {
  return {
    count: Number.parseInt(valueForFlag(args, "--count") ?? String(DEFAULT_COUNT), 10) || DEFAULT_COUNT,
    outputDir: valueForFlag(args, "--dir") ?? DEFAULT_OUTPUT_DIR,
    templatePath: valueForFlag(args, "--template") ?? DEFAULT_TEMPLATE_PATH,
    overwrite: args.includes("--overwrite")
  };
}

function sessionTemplateForIndex(template: string, index: number): string {
  const withTesterId = template.replace(/^- Tester ID:\s*$/m, `- Tester ID: P${index}`);

  if (index !== 1) {
    return withTesterId;
  }

  const mobileGateTemplate = withTesterId
    .replace(/^- Input: mouse \/ touch \/ pen \/ trackpad \/ mixed$/m, "- Input: touch / pen / mixed")
    .replace(/^- Network: same-machine \/ LAN$/m, "- Network: LAN")
    .replace(
      /^- Visual evidence: screenshot \/ photo \/ screen recording \/ observer notes \/ none$/m,
      "- Visual evidence: screenshot / photo / screen recording / observer notes"
    );

  return mobileGateTemplate.replace(
    /^## Session Metadata$/m,
    [
      "## Session Requirement",
      "",
      "This prepared note is the required real phone/tablet touch session until",
      "`npm run playtest:status` reports that the mobile gate is satisfied. Do not",
      "fill this file from a desktop, same-machine, localhost, emulator, or trackpad",
      "run. Leave it blank until the physical-device session can be run with",
      "`Network: LAN`, a non-localhost `Launch URL`, and concrete readability",
      "evidence.",
      "The metadata scaffold below intentionally removes desktop, same-machine,",
      "and no-evidence options for this required mobile-gate note.",
      "",
      "## Session Metadata"
    ].join("\n")
  );
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
    "  npm run playtest:notes",
    "  npm run playtest:notes -- --dir docs/playtests --count 5",
    "",
    "Creates session-N.md files from docs/playtest_session_notes_template.md.",
    "Existing files are kept unless --overwrite is passed."
  ].join("\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log(usage());
  } else {
    const notes = preparePlaytestNotes(parsePlaytestNoteSetupArgs(process.argv.slice(2)));
    console.log(renderPreparedPlaytestNotes(notes));
  }
}
