import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  parsePlaytestNoteSetupArgs,
  preparePlaytestNotes,
  renderPreparedPlaytestNotes
} from "../scripts/prepare-playtest-notes";

function repoFile(path: string): string {
  return fileURLToPath(new URL(`../${path}`, import.meta.url));
}

describe("playtest note setup", () => {
  it("creates five named note files from the session template without overwriting existing notes", () => {
    const outputDir = mkdtempSync(join(tmpdir(), "mtt-playtests-"));
    const templatePath = repoFile("docs/playtest_session_notes_template.md");
    const existingNote = join(outputDir, "session-2.md");
    writeFileSync(existingNote, "existing tester evidence", "utf8");

    const notes = preparePlaytestNotes({
      count: 5,
      outputDir,
      templatePath
    });

    expect(notes).toHaveLength(5);
    expect(notes.map((note) => note.created)).toEqual([true, false, true, true, true]);
    expect(readFileSync(join(outputDir, "session-1.md"), "utf8")).toContain("- Tester ID: P1");
    expect(readFileSync(join(outputDir, "session-1.md"), "utf8")).toContain("## Session Requirement");
    expect(readFileSync(join(outputDir, "session-1.md"), "utf8")).toContain(
      "required real phone/tablet touch session"
    );
    expect(readFileSync(join(outputDir, "session-1.md"), "utf8")).toContain(
      "Do not\nfill this file from a desktop"
    );
    expect(readFileSync(join(outputDir, "session-1.md"), "utf8")).toContain(
      "metadata scaffold below intentionally removes desktop, same-machine"
    );
    expect(readFileSync(join(outputDir, "session-1.md"), "utf8")).toContain("- Input: touch / pen / mixed");
    expect(readFileSync(join(outputDir, "session-1.md"), "utf8")).toContain("- Network: LAN");
    expect(readFileSync(join(outputDir, "session-1.md"), "utf8")).not.toContain("- Network: same-machine / LAN");
    expect(readFileSync(join(outputDir, "session-1.md"), "utf8")).toContain("- Launch URL:");
    expect(readFileSync(join(outputDir, "session-1.md"), "utf8")).toContain(
      "- Visual evidence: screenshot / photo / screen recording / observer notes"
    );
    expect(readFileSync(join(outputDir, "session-1.md"), "utf8")).not.toContain(
      "- Visual evidence: screenshot / photo / screen recording / observer notes / none"
    );
    expect(readFileSync(join(outputDir, "session-1.md"), "utf8")).toContain("## Principle Evidence Notes");
    expect(readFileSync(join(outputDir, "session-1.md"), "utf8")).toContain(
      "Engagement and degraded visual intent observed"
    );
    expect(readFileSync(join(outputDir, "session-1.md"), "utf8")).toContain("Top game design loop evidence");
    expect(readFileSync(join(outputDir, "session-3.md"), "utf8")).not.toContain("## Session Requirement");
    expect(readFileSync(join(outputDir, "session-3.md"), "utf8")).toContain("- Network: same-machine / LAN");
    expect(readFileSync(join(outputDir, "session-1.md"), "utf8")).not.toContain("- Launch URL: /?playtestReset=1");
    expect(readFileSync(existingNote, "utf8")).toBe("existing tester evidence");
  });

  it("parses setup arguments and renders created/kept output clearly", () => {
    const options = parsePlaytestNoteSetupArgs(["--dir", "notes", "--count=3", "--template", "template.md"]);

    expect(options).toEqual({
      count: 3,
      outputDir: "notes",
      templatePath: "template.md",
      overwrite: false
    });

    expect(
      renderPreparedPlaytestNotes([
        { file: "/tmp/session-1.md", created: true },
        { file: "/tmp/session-2.md", created: false }
      ])
    ).toContain("created: /tmp/session-1.md\n  kept: /tmp/session-2.md");
  });

  it("keeps the prepared playtest folder marked as templates, not completed evidence", () => {
    const readme = readFileSync(repoFile("docs/playtests/README.md"), "utf8");

    expect(readme).toContain("prepared templates, not completed evidence");
    expect(readme).toContain("session-1.md");
    expect(readme).toContain("explicit Session Requirement block");
    expect(readme).toContain("metadata scaffold intentionally removes desktop, same-machine");
    expect(readme).toContain("docs/playtest_day_checklist.md");
    expect(readme).toContain("npm run playtest:preflight");
    expect(readme).toContain("npm run playtest:audit:local");
    expect(readme).toContain("npm run playtest:doctor");
    expect(readme).toContain("suggested free port");
    expect(readme).toContain("copy-ready metadata");
    expect(readme).toContain("Do not");
    expect(readme).toContain("copy same-machine metadata into the required mobile note");
    expect(readme).toContain("npm run playtest:serve");
    expect(readme).toContain("npm run playtest:serve:lan");
    expect(readme).toContain("strict port `5173`");
    expect(readme).toContain("npm run playtest:links");
    expect(readme).toContain("Treat its launch metadata as planned setup only");
    expect(readme).toContain("copy-ready for the exact running host");
    expect(readme).toContain("Copy Summary");
    expect(readme).toContain("Run ID");
    expect(readme).toContain("Input evidence");
    expect(readme).toContain("Visual evidence");
    expect(readme).toContain("mobile-readability pass row");
    expect(readme).toContain("engagement and degraded-visual-intent evidence");
    expect(readme).toContain("Principle Evidence Notes");
    expect(readme).toContain("principle-embodiment audit");
    expect(readme).toContain("npm run playtest:status");
    expect(readme).toContain("Observation/pass-criteria contradictions");
    expect(readme).toContain("incomplete pass-criteria evidence");
    expect(readme).toContain("npm run playtest:rollup");
    expect(readme).toContain("npm run playtest:evaluate");
    expect(readme).toContain("npm run playtest:evaluate-rollup");
    expect(readme).toContain("rollup evaluator should fail while");
    expect(readme).toContain("The evaluator should fail while these files are blank");
  });

  it("keeps current implementation risk cues in playtest-facing materials", () => {
    const expectedPhrases = [
      "duplicate slicing around visible",
      "blank runs",
      "ordinary-word duplicates without suppressing deliberate currency or punctuation",
      "static prompt stayed centered in the active lane",
      "near-text Wiener speech was noticed",
      "Wiener tutorial speech taught both the labor/browser"
    ];
    const template = readFileSync(repoFile("docs/playtest_session_notes_template.md"), "utf8");
    const protocol = readFileSync(repoFile("docs/user_playtest_protocol.md"), "utf8");
    const facilitatorCard = readFileSync(repoFile("docs/playtest_facilitator_card.md"), "utf8");
    const dayChecklist = readFileSync(repoFile("docs/playtest_day_checklist.md"), "utf8");

    for (const phrase of expectedPhrases) {
      expect(template).toContain(phrase);
    }
    expect(protocol).toContain("restarted swipe on a visible blank run creates only one slice");
    expect(protocol).toContain("returning to the centered blank slot cleans accidental ordinary-word");
    expect(protocol).toContain("static prompt stays centered in the active lane");
    expect(protocol).toContain("near-text Wiener speech is noticed");
    expect(protocol).toContain("Wiener tutorial speech explains both the labor/browser situation");
    expect(facilitatorCard).toContain("restarted swipe on a visible blank run still leaves only one cut");
    expect(facilitatorCard).toContain("returning to the centered blank slot cleans accidental ordinary-word");
    expect(facilitatorCard).toContain("static prompt stays centered in the active lane");
    expect(facilitatorCard).toContain("near-text Wiener speech is noticed");
    expect(facilitatorCard).toContain("Wiener tutorial speech explains both the labor/browser situation");
    expect(dayChecklist).toContain("blank-run swipes");
    expect(dayChecklist).toContain("return-to-space cleanup of accidental ordinary-word");
    expect(dayChecklist).toContain("static prompt clearance");
    expect(dayChecklist).toContain("near-text Wiener speech");
    expect(dayChecklist).toContain("Wiener tutorial speech");

    for (const file of [
      "docs/playtests/session-1.md",
      "docs/playtests/session-2.md",
      "docs/playtests/session-3.md",
      "docs/playtests/session-4.md",
      "docs/playtests/session-5.md"
    ]) {
      const note = readFileSync(repoFile(file), "utf8");

      for (const phrase of expectedPhrases) {
        expect(note, file).toContain(phrase);
      }
    }
  });
});
