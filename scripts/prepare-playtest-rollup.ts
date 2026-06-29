import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export interface PlaytestRollupSetupOptions {
  outputPath: string;
  templatePath: string;
  overwrite?: boolean;
}

export interface PreparedPlaytestRollup {
  file: string;
  created: boolean;
}

const DEFAULT_OUTPUT_PATH = "docs/playtest_rollup_completed.md";
const DEFAULT_TEMPLATE_PATH = "docs/playtest_rollup_template.md";

export function preparePlaytestRollup(options: PlaytestRollupSetupOptions): PreparedPlaytestRollup {
  const file = resolve(options.outputPath);
  const exists = existsSync(file);

  if (!exists || options.overwrite) {
    const template = readFileSync(resolve(options.templatePath), "utf8");
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, template, "utf8");
    return { file, created: true };
  }

  return { file, created: false };
}

export function renderPreparedPlaytestRollup(rollup: PreparedPlaytestRollup): string {
  const status = rollup.created ? "created" : "kept";
  return [
    "Tokenization Training playtest rollup file",
    "",
    `  ${status}: ${rollup.file}`
  ].join("\n");
}

export function parsePlaytestRollupSetupArgs(args: string[]): PlaytestRollupSetupOptions {
  return {
    outputPath: valueForFlag(args, "--output") ?? DEFAULT_OUTPUT_PATH,
    templatePath: valueForFlag(args, "--template") ?? DEFAULT_TEMPLATE_PATH,
    overwrite: args.includes("--overwrite")
  };
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
    "  npm run playtest:rollup",
    "  npm run playtest:rollup -- --output docs/playtest_rollup_completed.md",
    "",
    "Creates a completed-rollup file from docs/playtest_rollup_template.md.",
    "Existing files are kept unless --overwrite is passed."
  ].join("\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log(usage());
  } else {
    const rollup = preparePlaytestRollup(parsePlaytestRollupSetupArgs(process.argv.slice(2)));
    console.log(renderPreparedPlaytestRollup(rollup));
  }
}
