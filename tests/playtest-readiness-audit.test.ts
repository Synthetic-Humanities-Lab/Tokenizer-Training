import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  auditLocalEvidencePackage,
  auditPlaytestReadiness,
  checkReadinessFileRequirement,
  renderLocalEvidenceAudit,
  renderPlaytestReadinessAudit,
  rollupSessionConsistencyIssues,
  validatePngBuffer
} from "../scripts/audit-playtest-readiness";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));

describe("playtest readiness audit", () => {
  it("passes the local package checks in the current repo but blocks on unfinished user evidence", () => {
    const audit = auditPlaytestReadiness({ rootDir: repoRoot });

    expect(audit.localFiles.every((file) => file.ok)).toBe(true);
    expect(audit.localFiles.some((file) => file.path === "docs/playtest_day_checklist.md" && file.ok)).toBe(true);
    expect(audit.ready).toBe(false);
    expect(audit.sessionEvaluation?.ready).toBe(false);
    expect(audit.rollupEvaluation).toBeUndefined();
    expect(audit.issues).toContain("session evidence gate failed; run `npm run playtest:evaluate -- <five completed notes>` for details");
    expect(audit.issues).toContain("missing completed playtest rollup: docs/playtest_rollup_completed.md");
  });

  it("passes the local-only evidence audit in the current repo before external sessions exist", () => {
    const audit = auditLocalEvidencePackage(repoRoot);
    const rendered = renderLocalEvidenceAudit(audit);

    expect(audit.ready).toBe(true);
    expect(audit.issues).toEqual([]);
    expect(rendered).toContain("Tokenization Training local evidence audit");
    expect(rendered).toContain("Decision: local package ready for user-session preflight");
    expect(rendered).toContain("Local evidence package: PASS");
    expect(rendered).toContain("docs/game_design_reading_notes/chapter_note_manifest.md");
    expect(rendered).toContain("docs/economy_tuning_audit.md");
    expect(rendered).toContain("docs/objective_completion_audit.md");
    expect(rendered).toContain("docs/browser_qa_2026-06-07.md");
    expect(rendered).toContain("2026-06-07-latest-canvas-small-phone-tutorial-active.png");
    expect(rendered).toContain("2026-06-07-tight-toast-small-phone-tutorial-active.png");
    expect(rendered).toContain("2026-06-07-post-ui-byte-route-portrait.png");
  });

  it("renders the executable next steps without claiming broad readiness", () => {
    const audit = auditPlaytestReadiness({ rootDir: repoRoot });
    const rendered = renderPlaytestReadinessAudit(audit);

    expect(rendered).toContain("Decision: collect user evidence before broader playtest");
    expect(rendered).toContain("Local evidence package: PASS");
    expect(rendered).toContain("Session evidence gate: FAIL");
    expect(rendered).toContain("Rollup evidence gate: FAIL");
    expect(rendered).toContain("Session files: 5/5");
    expect(rendered).toContain("Completed notes: 0/5");
    expect(rendered).toContain("Completed real mobile/touch notes: 0");
    expect(rendered).not.toContain("Sessions: 5/5");
    expect(rendered).toContain("npm run playtest:preflight");
    expect(rendered).toContain("npm run playtest:audit:local");
    expect(rendered).toContain("at least one real phone/tablet touch session");
    expect(rendered).toContain("npm run playtest:evaluate -- docs/playtests/session-1.md");
    expect(rendered).toContain("npm run playtest:evaluate-rollup -- docs/playtest_rollup_completed.md");
  });

  it("surfaces missing local artifacts instead of treating evaluator failures as the only gate", () => {
    const root = mkdtempSync(join(tmpdir(), "mtt-readiness-"));
    writeFileSync(join(root, "rollup.md"), "# incomplete rollup\n");
    const audit = auditPlaytestReadiness({
      rootDir: root,
      sessionFiles: [],
      rollupFile: "rollup.md"
    });

    expect(audit.ready).toBe(false);
    expect(audit.localFiles.some((file) => !file.ok)).toBe(true);
    expect(audit.issues.some((issue) => issue.includes("missing required readiness artifact"))).toBe(true);
  });

  it("rejects completed rollups that do not match the evaluated session notes", () => {
    const issues = rollupSessionConsistencyIssues(
      {
        sessions: [
          {
            file: "docs/playtests/session-1.md",
            metadata: { runId: "mtt-20260606-100001z", input: "touch" },
            copiedSummary: "Tokenization Training playtest summary\nStart: handoff screen\n"
          },
          {
            file: "docs/playtests/session-2.md",
            metadata: { runId: "mtt-20260606-100002z", input: "mouse" },
            copiedSummary: "Tokenization Training playtest summary\nStart: handoff screen\n"
          }
        ],
        tallies: [
          {
            criterion: { id: "firstAction", label: "First tutorial action without outside instruction" },
            passed: 1,
            evaluatedSessions: 2
          }
        ]
      } as any,
      {
        rollup: {
          sessionIndexRows: [
            ["1", "mtt-20260606-wrong", "mouse", "direct", "yes", "docs/playtests/session-1.md"],
            ["2", "mtt-20260606-100002z", "mouse", "handoff screen", "yes", "docs/playtests/session-404.md"]
          ],
          criterionRows: [
            {
              criterion: { id: "firstAction", label: "First tutorial action without outside instruction" },
              passedSessions: "2/2"
            }
          ]
        }
      } as any
    );

    expect(issues).toContain(
      "rollup session row 1: run ID mtt-20260606-wrong does not match docs/playtests/session-1.md run ID mtt-20260606-100001z."
    );
    expect(issues).toContain(
      "rollup session row 1: input mouse does not match docs/playtests/session-1.md input touch."
    );
    expect(issues).toContain(
      "rollup session row 1: start source direct does not match docs/playtests/session-1.md copied summary start handoff screen."
    );
    expect(issues).toContain(
      "rollup session row 2: notes file docs/playtests/session-404.md does not match an evaluated session note."
    );
    expect(issues).toContain(
      "First tutorial action without outside instruction: rollup count 2/2 does not match evaluated session tally 1/2."
    );
  });

  it("rejects large but incomplete PNG evidence artifacts", () => {
    const root = mkdtempSync(join(tmpdir(), "mtt-readiness-png-"));
    mkdirSync(join(root, "docs/browser_qa"), { recursive: true });
    const artifactPath = join(root, "docs/browser_qa/2026-06-07-browser-canvas-desktop-menu.png");
    writeFileSync(artifactPath, Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      Buffer.alloc(60_000, 0)
    ]));

    const audit = auditPlaytestReadiness({
      rootDir: root,
      sessionFiles: [],
      rollupFile: "rollup.md"
    });
    const file = audit.localFiles.find((entry) => entry.path.endsWith("2026-06-07-browser-canvas-desktop-menu.png"));

    expect(file?.ok).toBe(false);
    expect(file?.issue).toContain("not a complete readable PNG");
  });

  it("validates PNG structure, not only file signature", () => {
    const onePixelPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4////fwAJ+wP9KobjigAAAABJRU5ErkJggg==",
      "base64"
    );
    const corruptPng = Buffer.from(onePixelPng);
    const idatTypeOffset = corruptPng.indexOf("IDAT", 8, "ascii");
    corruptPng[idatTypeOffset + 4] = corruptPng[idatTypeOffset + 4] ^ 0xff;

    expect(validatePngBuffer(onePixelPng)).toMatchObject({
      ok: true,
      width: 1,
      height: 1
    });
    expect(validatePngBuffer(corruptPng)).toMatchObject({
      ok: false,
      issue: "IDAT chunk CRC mismatch"
    });
    expect(validatePngBuffer(onePixelPng.subarray(0, onePixelPng.length - 8))).toMatchObject({
      ok: false
    });
    expect(validatePngBuffer(Buffer.from("not a png"))).toMatchObject({
      ok: false,
      issue: "missing PNG signature"
    });
  });

  it("rejects QA PNG evidence with the wrong viewport dimensions", () => {
    const root = mkdtempSync(join(tmpdir(), "mtt-png-dimensions-"));
    const onePixelPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4////fwAJ+wP9KobjigAAAABJRU5ErkJggg==",
      "base64"
    );
    writeFileSync(join(root, "capture.png"), onePixelPng);

    expect(
      checkReadinessFileRequirement(root, {
        path: "capture.png",
        pngDimensions: { width: 320, height: 568 }
      })
    ).toMatchObject({
      ok: false,
      issue: "capture.png is 1x1, expected 320x568"
    });
  });
});
