import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  parsePlaytestRollupSetupArgs,
  preparePlaytestRollup,
  renderPreparedPlaytestRollup
} from "../scripts/prepare-playtest-rollup";

function repoFile(path: string): string {
  return fileURLToPath(new URL(`../${path}`, import.meta.url));
}

describe("playtest rollup setup", () => {
  it("creates a completed rollup file from the template without overwriting existing evidence", () => {
    const outputDir = mkdtempSync(join(tmpdir(), "mtt-rollup-"));
    const templatePath = repoFile("docs/playtest_rollup_template.md");
    const outputPath = join(outputDir, "playtest_rollup_completed.md");
    const existingPath = join(outputDir, "existing_rollup.md");
    writeFileSync(existingPath, "completed playtest rollup evidence", "utf8");

    const created = preparePlaytestRollup({ outputPath, templatePath });
    const kept = preparePlaytestRollup({ outputPath: existingPath, templatePath });

    expect(created.created).toBe(true);
    expect(readFileSync(outputPath, "utf8")).toContain("## Principle Embodiment Audit");
    expect(readFileSync(outputPath, "utf8")).toContain("Engagement and degraded visual intent observed");
    expect(readFileSync(outputPath, "utf8")).toContain("npm run playtest:evaluate-rollup");
    expect(kept.created).toBe(false);
    expect(readFileSync(existingPath, "utf8")).toBe("completed playtest rollup evidence");
  });

  it("supports explicit overwrite when the facilitator needs a fresh blank rollup", () => {
    const outputDir = mkdtempSync(join(tmpdir(), "mtt-rollup-overwrite-"));
    const templatePath = repoFile("docs/playtest_rollup_template.md");
    const outputPath = join(outputDir, "playtest_rollup_completed.md");
    writeFileSync(outputPath, "old rollup", "utf8");

    const rollup = preparePlaytestRollup({ outputPath, templatePath, overwrite: true });

    expect(rollup.created).toBe(true);
    expect(readFileSync(outputPath, "utf8")).toContain("# Tokenizer Training Playtest Rollup");
    expect(readFileSync(outputPath, "utf8")).not.toBe("old rollup");
  });

  it("parses setup arguments and renders created/kept output clearly", () => {
    const options = parsePlaytestRollupSetupArgs([
      "--output",
      "docs/custom_rollup.md",
      "--template=docs/custom_template.md",
      "--overwrite"
    ]);

    expect(options).toEqual({
      outputPath: "docs/custom_rollup.md",
      templatePath: "docs/custom_template.md",
      overwrite: true
    });
    expect(renderPreparedPlaytestRollup({ file: "/tmp/rollup.md", created: true })).toContain(
      "created: /tmp/rollup.md"
    );
    expect(renderPreparedPlaytestRollup({ file: "/tmp/rollup.md", created: false })).toContain(
      "kept: /tmp/rollup.md"
    );
  });
});
