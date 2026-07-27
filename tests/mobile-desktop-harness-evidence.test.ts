import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  parseMobileDesktopHarnessEvidenceArgs,
  renderSeededMobileDesktopHarnessEvidence,
  seedDesktopHarnessRows,
  seedMobileDesktopHarnessEvidence
} from "../scripts/seed-mobile-desktop-harness-evidence";

function repoFile(path: string): string {
  return fileURLToPath(new URL(`../${path}`, import.meta.url));
}

describe("mobile desktop harness evidence seeding", () => {
  it("creates local validation files and fills only the desktop harness evidence", () => {
    const outputDir = mkdtempSync(join(tmpdir(), "tt-mobile-desktop-evidence-"));
    const sourcePath = join(outputDir, "source.png");
    const validationPath = join(outputDir, "mobile_device_validation_completed.md");
    const evidenceDir = join(outputDir, "evidence");
    writeFileSync(sourcePath, "desktop harness artifact bytes");

    const result = seedMobileDesktopHarnessEvidence({
      validationPath,
      templatePath: repoFile("docs/mobile_device_validation_completed_template.md"),
      evidenceDir,
      sourcePath,
      artifactName: "desktop-pinned-fixture.png"
    });
    const validation = readFileSync(validationPath, "utf8");

    expect(result.validationCreated).toBe(true);
    expect(result.artifactWritten).toBe(true);
    expect(result.validationUpdated).toBe(true);
    expect(existsSync(join(evidenceDir, "desktop-pinned-fixture.png"))).toBe(true);
    expect(validation).toContain(
      "| Desktop browser harness | Desktop 1280x720 browser harness | desktop-pinned-fixture.png; endless mode pinned simple_001 fixture artifact from the desktop 1280x720 browser harness. | Pass |"
    );
    expect(validation).toContain(
      "| Desktop browser harness still matches browser contract | desktop-pinned-fixture.png shows the desktop 1280x720 browser harness in endless mode with pinned simple_001 fixture artifact; browser layout remains separate from mobile bottom-docked controls. | Pass |"
    );
    expect(validation).toContain(
      "- Desktop browser pinned fixture: desktop-pinned-fixture.png; desktop 1280x720 browser harness, endless mode, simple_001 pinned fixture artifact."
    );
    expect(validation).toContain("| iPhone SE/small phone portrait |  |  |  |");
    expect(validation).toContain("- Mobile device validation passed:");
    expect(validation).not.toContain("- Mobile device validation passed: Pass");
  });

  it("does not overwrite existing local evidence unless requested", () => {
    const template = readFileSync(repoFile("docs/mobile_device_validation_completed_template.md"), "utf8");
    const prefilled = seedDesktopHarnessRows(template, { overwrite: true }).replace(
      "Desktop 1280x720 browser harness",
      "Manual desktop browser note"
    );

    expect(seedDesktopHarnessRows(prefilled)).toContain("Manual desktop browser note");
    expect(seedDesktopHarnessRows(prefilled, { overwrite: true })).toContain(
      "Desktop 1280x720 browser harness"
    );
  });

  it("parses CLI arguments and renders a boundary-preserving summary", () => {
    expect(parseMobileDesktopHarnessEvidenceArgs([
      "--validation",
      "docs/custom.md",
      "--template=docs/custom-template.md",
      "--evidence-dir",
      "docs/custom-evidence",
      "--source",
      ".qa/custom.png",
      "--artifact=custom-desktop.png",
      "--overwrite"
    ])).toEqual({
      validationPath: "docs/custom.md",
      templatePath: "docs/custom-template.md",
      evidenceDir: "docs/custom-evidence",
      sourcePath: ".qa/custom.png",
      artifactName: "custom-desktop.png",
      overwrite: true
    });

    const rendered = renderSeededMobileDesktopHarnessEvidence({
      validationFile: "/tmp/mobile.md",
      evidenceFile: "/tmp/evidence/desktop-pinned-fixture.png",
      sourceFile: "/tmp/source.png",
      validationCreated: true,
      artifactWritten: true,
      validationUpdated: true
    });

    expect(rendered).toContain("desktop browser harness evidence");
    expect(rendered).toContain("created validation template");
    expect(rendered).toContain("wrote evidence artifact");
    expect(rendered).toContain("updated desktop harness rows");
    expect(rendered).toContain("Real phone target rows");
  });
});
