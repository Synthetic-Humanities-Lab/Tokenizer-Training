import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  parseMobileDeviceValidationSetupArgs,
  prepareMobileDeviceValidation,
  renderPreparedMobileDeviceValidation
} from "../scripts/prepare-mobile-device-validation";

function repoFile(path: string): string {
  return fileURLToPath(new URL(`../${path}`, import.meta.url));
}

describe("mobile device validation setup", () => {
  it("creates a completed validation file from the template without overwriting evidence", () => {
    const outputDir = mkdtempSync(join(tmpdir(), "tt-mobile-validation-"));
    const templatePath = repoFile("docs/mobile_device_validation_completed_template.md");
    const outputPath = join(outputDir, "mobile_device_validation_completed.md");
    const existingPath = join(outputDir, "existing_mobile_validation.md");
    const evidenceDir = join(outputDir, "evidence");
    writeFileSync(existingPath, "completed physical-device evidence", "utf8");

    const created = prepareMobileDeviceValidation({ outputPath, templatePath, evidenceDir });
    const kept = prepareMobileDeviceValidation({ outputPath: existingPath, templatePath, evidenceDir });

    expect(created.created).toBe(true);
    expect(readFileSync(outputPath, "utf8")).toContain("# Tokenizer Training Mobile Device Validation Completed");
    expect(readFileSync(outputPath, "utf8")).toContain("## Target Evidence");
    expect(readFileSync(outputPath, "utf8")).toContain("iPhone SE/small phone portrait");
    expect(readFileSync(outputPath, "utf8")).toContain("Evidence directory: docs/mobile_device_evidence");
    expect(readFileSync(outputPath, "utf8")).toContain("Mobile device validation passed");
    expect(existsSync(created.evidenceDir)).toBe(true);
    expect(existsSync(kept.evidenceDir)).toBe(true);
    expect(created.observerNoteCreated).toBe(true);
    expect(created.observerNoteRefreshed).toBe(false);
    expect(readFileSync(created.observerNoteFile, "utf8")).toContain("# Tokenizer Training Mobile Observer Note");
    expect(readFileSync(created.observerNoteFile, "utf8")).toContain("## Touch Latency And Trust");
    expect(created.inputFeelSummaryCreated).toBe(true);
    expect(created.inputFeelSummaryRefreshed).toBe(false);
    expect(readFileSync(created.inputFeelSummaryFile, "utf8")).toContain("# Tokenizer Training Mobile Input-Feel Summary");
    expect(readFileSync(created.inputFeelSummaryFile, "utf8")).toContain("First-cut latency observed/reported");
    expect(kept.created).toBe(false);
    expect(readFileSync(existingPath, "utf8")).toBe("completed physical-device evidence");
  });

  it("supports explicit overwrite when the operator needs a fresh blank validation file", () => {
    const outputDir = mkdtempSync(join(tmpdir(), "tt-mobile-validation-overwrite-"));
    const templatePath = repoFile("docs/mobile_device_validation_completed_template.md");
    const outputPath = join(outputDir, "mobile_device_validation_completed.md");
    writeFileSync(outputPath, "old validation evidence", "utf8");

    const validation = prepareMobileDeviceValidation({ outputPath, templatePath, overwrite: true });

    expect(validation.created).toBe(true);
    expect(readFileSync(outputPath, "utf8")).toContain("## Physical Checklist");
    expect(readFileSync(outputPath, "utf8")).not.toBe("old validation evidence");
  });

  it("refreshes stale blank evidence templates without overwriting filled observations", () => {
    const outputDir = mkdtempSync(join(tmpdir(), "tt-mobile-validation-refresh-"));
    const templatePath = repoFile("docs/mobile_device_validation_completed_template.md");
    const outputPath = join(outputDir, "mobile_device_validation_completed.md");
    const evidenceDir = join(outputDir, "evidence");
    const observerPath = join(evidenceDir, "observer-note.md");
    const inputFeelPath = join(evidenceDir, "input-feel-summary.md");

    mkdirSync(evidenceDir, { recursive: true });
    writeFileSync(outputPath, "kept validation", "utf8");
    writeFileSync(observerPath, [
      "# Tokenizer Training Mobile Observer Note",
      "",
      "## Touch Latency And Trust",
      "",
      "- Cuts appeared immediately enough to trust staged markers:",
      "",
      "## Audio And Mute",
      "",
      "- App launched silently:"
    ].join("\n"), "utf8");
    writeFileSync(inputFeelPath, [
      "# Tokenizer Training Mobile Input-Feel Summary",
      "",
      "## Required Metrics",
      "",
      "- First-cut latency observed/reported:"
    ].join("\n"), "utf8");

    const refreshed = prepareMobileDeviceValidation({ outputPath, templatePath, evidenceDir });

    expect(refreshed.created).toBe(false);
    expect(refreshed.observerNoteCreated).toBe(false);
    expect(refreshed.observerNoteRefreshed).toBe(true);
    expect(refreshed.inputFeelSummaryCreated).toBe(false);
    expect(refreshed.inputFeelSummaryRefreshed).toBe(true);
    expect(readFileSync(observerPath, "utf8")).toContain("## Input-Feel Metrics");
    expect(readFileSync(observerPath, "utf8")).toContain("App launched silently with no boot audio");
    expect(readFileSync(inputFeelPath, "utf8")).toContain("Touch-loupe clearance / finger visibility");

    writeFileSync(observerPath, "Observer note: thumb reach passed on iPhone hardware.", "utf8");
    const kept = prepareMobileDeviceValidation({ outputPath, templatePath, evidenceDir });

    expect(kept.observerNoteRefreshed).toBe(false);
    expect(readFileSync(observerPath, "utf8")).toBe("Observer note: thumb reach passed on iPhone hardware.");
  });

  it("parses setup arguments and renders next-command guidance", () => {
    const options = parseMobileDeviceValidationSetupArgs([
      "--output",
      "docs/custom_mobile_validation.md",
      "--template=docs/custom_mobile_template.md",
      "--evidence-dir",
      "docs/custom_mobile_evidence",
      "--observer-template",
      "docs/custom_observer_note.md",
      "--input-feel-template",
      "docs/custom_input_feel.md",
      "--overwrite"
    ]);

    expect(options).toEqual({
      outputPath: "docs/custom_mobile_validation.md",
      templatePath: "docs/custom_mobile_template.md",
      evidenceDir: "docs/custom_mobile_evidence",
      observerTemplatePath: "docs/custom_observer_note.md",
      inputFeelTemplatePath: "docs/custom_input_feel.md",
      overwrite: true
    });
    expect(renderPreparedMobileDeviceValidation(prepared())).toContain(
      "created: /tmp/mobile.md"
    );
    expect(renderPreparedMobileDeviceValidation(prepared({ observerNoteCreated: false, inputFeelSummaryCreated: false, created: false }))).toContain(
      "kept: /tmp/mobile.md"
    );
    expect(renderPreparedMobileDeviceValidation(prepared({ observerNoteCreated: false, observerNoteRefreshed: true }))).toContain(
      "refreshed blank stale observer note"
    );
    expect(renderPreparedMobileDeviceValidation(prepared())).toContain(
      "evidence directory: /tmp/evidence"
    );
    expect(renderPreparedMobileDeviceValidation(prepared())).toContain(
      "created observer note: /tmp/evidence/observer-note.md"
    );
    expect(renderPreparedMobileDeviceValidation(prepared())).toContain(
      "created input-feel summary: /tmp/evidence/input-feel-summary.md"
    );
    expect(renderPreparedMobileDeviceValidation(prepared())).toContain(
      "local physical-test artifacts ignored by Git"
    );
    expect(renderPreparedMobileDeviceValidation(prepared())).toContain(
      "npm run mobile:validate"
    );
  });
});

function prepared(overrides: Partial<ReturnType<typeof prepareMobileDeviceValidation>> = {}): ReturnType<typeof prepareMobileDeviceValidation> {
  return {
    file: "/tmp/mobile.md",
    evidenceDir: "/tmp/evidence",
    observerNoteFile: "/tmp/evidence/observer-note.md",
    inputFeelSummaryFile: "/tmp/evidence/input-feel-summary.md",
    observerNoteCreated: true,
    observerNoteRefreshed: false,
    inputFeelSummaryCreated: true,
    inputFeelSummaryRefreshed: false,
    created: true,
    ...overrides
  };
}
