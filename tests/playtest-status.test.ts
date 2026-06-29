import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  buildPlaytestStatusReport,
  renderPlaytestStatusReport
} from "../scripts/report-playtest-status";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));

describe("playtest status report", () => {
  it("summarizes current prepared notes without claiming rollup readiness", () => {
    const report = buildPlaytestStatusReport([
      `${repoRoot}docs/playtests/session-1.md`,
      `${repoRoot}docs/playtests/session-2.md`
    ]);
    const rendered = renderPlaytestStatusReport(report);

    expect(report.readyForRollup).toBe(false);
    expect(report.completeCount).toBe(0);
    expect(report.mobileMetadataCount).toBe(0);
    expect(report.mobileCount).toBe(0);
    expect(report.statuses[0].missing).toContain("metadata");
    expect(report.statuses[0].missing).toContain("copied summary");
    expect(report.statuses[0].missing).toContain("pass-criteria rows");
    expect(rendered).toContain("Completed notes: 0/2");
    expect(rendered).toContain("Completed real mobile/touch notes: 0");
    expect(rendered).toContain("Mobile metadata notes: 0");
    expect(rendered).toContain("Ready for rollup evaluator: no");
    expect(rendered).toContain("Next session note:");
    expect(rendered).toContain("as the required real phone/tablet touch session");
    expect(rendered).toContain("At least one note must be a real phone/tablet session");
    expect(rendered).toContain("Network: LAN");
    expect(rendered).toContain("non-localhost Launch URL");
    expect(rendered).toContain("Mobile note target:");
    expect(rendered).toContain("must remain the required real-device note");
    expect(rendered).toContain("desktop emulation, trackpads, and desktop touchscreens do not count");
    expect(rendered).toContain("explicit `--host <network-host>` launch-check");
    expect(rendered).toContain("actual device reaches the menu");
    expect(rendered).toContain("Mobile visual evidence");
    expect(rendered).toContain("HUD, static prompt text, review markers, feedback, Wiener speech");
    expect(rendered).toContain("Immediate next commands:");
    expect(rendered).toContain("- npm run playtest:preflight");
    expect(rendered).toContain("- npm run playtest:doctor");
    expect(rendered).toContain("Start the LAN server on the doctor-selected port: npm run playtest:serve:lan");
    expect(rendered).toContain("npm run playtest:serve:lan -- --port <chosen-port>");
    expect(rendered).toContain("npm run playtest:brief -- --host <network-host> --port <chosen-port>");
    expect(rendered).toContain("npm run playtest:launch-check -- --host <network-host> --port <chosen-port>");
    expect(rendered).toContain("physical-device URL");
    expect(rendered).toContain("Network: LAN plus the non-localhost Launch URL");
  });

  it("marks absent note files as incomplete", () => {
    const root = mkdtempSync(join(tmpdir(), "mtt-status-"));
    const missingFile = join(root, "session-404.md");
    const report = buildPlaytestStatusReport([missingFile]);

    expect(report.readyForRollup).toBe(false);
    expect(report.statuses[0]).toMatchObject({
      file: missingFile,
      exists: false,
      readyForRollup: false,
      missing: ["file"]
    });
  });

  it("does not treat generic pass-criteria evidence as rollup-ready", () => {
    const root = mkdtempSync(join(tmpdir(), "mtt-status-"));
    const sessionFile = join(root, "session-generic-criterion.md");
    writeFileSync(sessionFile, filledSessionNoteWithGenericCriterionEvidence(), "utf8");

    const report = buildPlaytestStatusReport([sessionFile]);
    const status = report.statuses[0];
    const rendered = renderPlaytestStatusReport(report);

    expect(status.criteriaEntered).toBe(true);
    expect(status.criteriaEvidenceValid).toBe(false);
    expect(status.readyForRollup).toBe(false);
    expect(status.missing).toEqual(["pass-criteria evidence"]);
    expect(status.criterionIssues).toContain(
      `${sessionFile}: First action completed without outside instruction pass needs criterion-specific observed evidence.`
    );
    expect(rendered).toContain("criterion issue:");
    expect(rendered).toContain("pass needs criterion-specific observed evidence");
  });

  it("does not treat observation and pass-criteria contradictions as rollup-ready", () => {
    const root = mkdtempSync(join(tmpdir(), "mtt-status-contradiction-"));
    const sessionFile = join(root, "session-contradiction.md");
    writeFileSync(sessionFile, filledDesktopSessionNote().replace(
      "| First tutorial action without outside instruction | Tester swiped the first tutorial slot without coaching after reading the Wiener prompt. | pass |",
      "| First tutorial action without outside instruction | Tester needed facilitator coaching before making the first swipe. | fail |"
    ), "utf8");

    const report = buildPlaytestStatusReport([sessionFile]);
    const status = report.statuses[0];
    const rendered = renderPlaytestStatusReport(report);

    expect(status.criteriaEntered).toBe(true);
    expect(status.criteriaEvidenceValid).toBe(false);
    expect(status.readyForRollup).toBe(false);
    expect(status.missing).toEqual(["pass-criteria evidence"]);
    expect(status.criterionIssues).toContain(
      `${sessionFile}: First action completed without outside instruction is marked pass but observation "First tutorial action without outside instruction" is fail.`
    );
    expect(rendered).toContain("criterion issue:");
    expect(rendered).toContain("is marked pass but observation");
  });

  it("does not claim rollup readiness until the required mobile session exists", () => {
    const root = mkdtempSync(join(tmpdir(), "mtt-status-mobile-gate-"));
    const files = Array.from({ length: 5 }, (_, index) => join(root, `session-${index + 1}.md`));
    for (const file of files) {
      writeFileSync(file, filledDesktopSessionNote(), "utf8");
    }

    const report = buildPlaytestStatusReport(files);
    const rendered = renderPlaytestStatusReport(report);

    expect(report.completeCount).toBe(5);
    expect(report.mobileMetadataCount).toBe(0);
    expect(report.mobileCount).toBe(0);
    expect(report.mobileGateSatisfied).toBe(false);
    expect(report.readyForRollup).toBe(false);
    expect(rendered).toContain("Completed notes: 5/5");
    expect(rendered).toContain("Ready for rollup evaluator: no");
    expect(rendered).toContain("No incomplete note remains; rerun or replace");
    expect(rendered).toContain("At least one note must be a real phone/tablet session");
    expect(rendered).toContain("Network: LAN");
    expect(rendered).toContain("non-localhost Launch URL");
    expect(rendered).toContain("replace or rerun one completed note as the required real-device note");
    expect(rendered).toContain("Mobile launch validity");
    expect(rendered).toContain("Mobile visual evidence");
    expect(rendered).toContain("Immediate next commands:");
    expect(rendered).toContain("Replace or rerun one completed note as a real phone/tablet touch session.");
    expect(rendered).toContain("npm run playtest:brief -- --host <network-host> --port <chosen-port>");
    expect(rendered).toContain("npm run playtest:launch-check -- --host <network-host> --port <chosen-port>");
  });

  it("does not satisfy the mobile gate with an incomplete mobile-looking note", () => {
    const root = mkdtempSync(join(tmpdir(), "mtt-status-incomplete-mobile-"));
    const files = Array.from({ length: 5 }, (_, index) => join(root, `session-${index + 1}.md`));
    writeFileSync(files[0], incompleteMobileSessionNote(), "utf8");
    for (const file of files.slice(1)) {
      writeFileSync(file, filledDesktopSessionNote(), "utf8");
    }

    const report = buildPlaytestStatusReport(files);
    const rendered = renderPlaytestStatusReport(report);

    expect(report.completeCount).toBe(4);
    expect(report.mobileMetadataCount).toBe(1);
    expect(report.mobileCount).toBe(0);
    expect(report.mobileGateSatisfied).toBe(false);
    expect(report.nextSessionShouldBeMobile).toBe(true);
    expect(report.readyForRollup).toBe(false);
    expect(rendered).toContain("Completed real mobile/touch notes: 0");
    expect(rendered).toContain("Mobile metadata notes: 1");
    expect(rendered).toContain("A mobile-looking note is present but incomplete");
    expect(rendered).toContain(`Next session note: ${files[0]} as the required real phone/tablet touch session`);
    expect(rendered).toContain(`Mobile note target: ${files[0]} must remain the required real-device note`);
  });

  it("renders evaluator commands once notes are complete and the mobile gate is satisfied", () => {
    const root = mkdtempSync(join(tmpdir(), "mtt-status-ready-"));
    const files = Array.from({ length: 5 }, (_, index) => join(root, `session-${index + 1}.md`));
    writeFileSync(files[0], filledMobileSessionNote(), "utf8");
    for (const file of files.slice(1)) {
      writeFileSync(file, filledDesktopSessionNote(), "utf8");
    }

    const report = buildPlaytestStatusReport(files);
    const rendered = renderPlaytestStatusReport(report);

    expect(report.completeCount).toBe(5);
    expect(report.mobileMetadataCount).toBe(1);
    expect(report.mobileCount).toBe(1);
    expect(report.mobileGateSatisfied).toBe(true);
    expect(report.readyForRollup).toBe(true);
    expect(rendered).toContain("Ready for rollup evaluator: yes");
    expect(rendered).toContain("Immediate next commands:");
    expect(rendered).toContain(`npm run playtest:evaluate -- ${files.join(" ")}`);
    expect(rendered).toContain("npm run playtest:rollup");
    expect(rendered).toContain("Fill docs/playtest_rollup_completed.md with concrete five-session evidence.");
    expect(rendered).toContain("npm run playtest:evaluate-rollup -- docs/playtest_rollup_completed.md");
    expect(rendered).toContain("npm run playtest:audit");
    expect(rendered).not.toContain("At least one note must be a real phone/tablet session");
    expect(rendered).not.toContain("Mobile note validity:");
  });
});

function filledDesktopSessionNote(): string {
  return filledSessionNoteWithGenericCriterionEvidence()
    .replace(
      "| First action completed without outside instruction | pass | Looked fine |",
      "| First action completed without outside instruction | pass | Tester swiped the first tutorial boundary with no coaching after reading the prompt. |"
    )
    .replace(
      "| Mobile HUD/text/review/feedback/Wiener speech readable | Desktop non-mobile mouse session: HUD text, review markers, feedback, and Wiener speech were readable without overlap. | pass |",
      "| Mobile HUD/text/review/feedback/Wiener speech readable | Desktop non-mobile mouse session; mobile HUD, static prompt text, review markers, feedback, Wiener speech, clipping, overlap, and finger occlusion were not evaluated. | fail |"
    );
}

function filledMobileSessionNote(): string {
  return filledDesktopSessionNote()
    .replace("- Device/browser: Mac Safari desktop", "- Device/browser: iPhone Safari")
    .replace("- Input: mouse", "- Input: touch")
    .replace("Input: mouse", "Input: touch")
    .replace("- Network: same-machine", "- Network: LAN")
    .replace(
      "- Launch URL: http://127.0.0.1:5175/?playtestReset=1",
      "- Launch URL: http://192.168.1.20:5175/?playtestReset=1"
    )
    .replace(
      "| Mobile HUD/text/review/feedback/Wiener speech readable | Desktop non-mobile mouse session; mobile HUD, static prompt text, review markers, feedback, Wiener speech, clipping, overlap, and finger occlusion were not evaluated. | fail |",
      "| Mobile HUD/text/review/feedback/Wiener speech readable | iPhone Safari touch session: HUD, static prompt text, review markers, feedback, and Wiener speech were readable with no clipping, overlap, or finger occlusion. | pass |"
    )
    .replace(
      "| Mobile readability holds on real device | fail | Desktop non-mobile session; mobile readability was not evaluated on a real phone or tablet. |",
      "| Mobile readability holds on real device | pass | iPhone Safari screenshot showed HUD, static prompt text, review markers, feedback, and Wiener speech readable with no clipping, overlap, or finger occlusion. |"
    );
}

function incompleteMobileSessionNote(): string {
  return filledMobileSessionNote().replace(
    /## Copied Result Summary\n\n```text\n[\s\S]*?\n```\n/,
    "## Copied Result Summary\n\n```text\n\n```\n"
  );
}

function filledSessionNoteWithGenericCriterionEvidence(): string {
  return `# Tokenizer Training Playtest Notes

## Session Metadata

- Tester ID: P-status
- Date: 2026-06-07
- Run ID: mtt-status-001
- Device/browser: Mac Safari desktop
- Input: mouse
- Network: same-machine
- Launch URL: http://127.0.0.1:5175/?playtestReset=1
- Facilitator: Doug
- Reset used: yes
- Visual evidence: screenshot

## Copied Result Summary

\`\`\`text
Tokenizer Training playtest summary
Run ID: mtt-status-001
Start: handoff screen
Input: mouse
Input evidence: browser pointer reported mouse; not mobile-gate evidence
Cuts: OK 6 / Missed 0 / False 0
Net: +$12.00
Best saved: 2 rounds / Cadet
Round trace:
1. simple_001 / tutorial / tier 1 / tokens 6 / OK 6 / Missed 0 / False 0
Input feel trace:
1. samples 5 / responses 6 / first 32ms / resolve-first 420ms / resolve-last 180ms / commit 1 / batch 3 / release-latched 1 / last-source release / adjusted 0 / gesture-samples 5 / owned-cuts 6 / no-cut 0 / near 0 / off 0 / loupe 0 / ready 0 / low-clear 0 / min-clear n/a
\`\`\`

## Observation Notes

| Observation | Evidence | Pass? |
| --- | --- | --- |
| First tutorial action without outside instruction | Tester swiped the first tutorial slot without coaching after reading the Wiener prompt. | pass |
| Pale guides understood as legal slots, not answers | Tester described pale guides as places where a cut could be made. | pass |
| Spaces not systematically over-cut | Tester left ordinary space gaps alone after the first review. | pass |
| Clear Cuts discovered or understood | Tester used Clear Cuts after placing a false cut during review. | pass |
| Snap positions trusted | Tester said the swipe snap felt precise and did not blame input imprecision. | pass |
| Missed/false review markers understood | Tester named missed and false review markers as the reason cost increased. | pass |
| Pay, cost, net, balance, and rank understood | Tester explained that correct cuts add pay while missed or false cuts add cost and reduce net. | pass |
| Tutorial-complete handoff starts Endless without prompting | Tester clicked the tutorial-complete handoff and started Endless without coaching. | pass |
| Dense strings read as higher-risk tokenization | Tester identified URL punctuation and dense strings as higher-risk tokenization. | pass |
| Degraded AI labor frame noticed through play | Tester called the AI overseer a supervisor in a payroll audit. | pass |
| Degraded visual style felt intentional and play invited another round | Tester wanted another round and said the degraded assistant-browser visual style felt intentional, not broken. | pass |
| Errors felt earned and recoverable, not arbitrary | Tester said mistakes felt fair and recoverable after reviewing markers. | pass |
| Prompt, action, evidence, consequence, and next step formed a legible loop | Tester followed prompt, swipe action, token review, net consequence, and next step without intervention. | pass |
| Copy Summary worked and includes run/start/input, round trace, OK/missed/false counts, net, and best record | Copied summary was pasted with run id, start, input, round trace, OK/missed/false counts, net, and best saved. | pass |
| Mobile HUD/text/review/feedback/Wiener speech readable | Desktop non-mobile mouse session: HUD text, review markers, feedback, and Wiener speech were readable without overlap. | pass |

## Debrief Answers

1. I was swiping to place token boundary cuts between the visible slots.

2. A token boundary is the split between chunks that the tokenizer will emit.

3. Spaces and punctuation can attach to tokens, unlike ordinary word reading.

4. Correct cuts add pay; missed or false cuts add cost and lower net.

5. The swipe snap felt fair and precise, so errors did not feel like input imprecision.

6. The AI supervisor made it feel like browser labor and payroll training.

7. The hardest screen to read was dense review text, but HUD feedback markers stayed legible.

8. The degraded browser style made me want another round because it felt intentional.

## Pass-Criteria Rollup

| Criterion | Result | Evidence / contradiction |
| --- | --- | --- |
| First action completed without outside instruction | pass | Looked fine |
| Explains one non-word tokenization behavior | pass | Tester explained leading space tokenization and punctuation can attach to tokens. |
| Starts Endless from tutorial-complete handoff | pass | Started Endless from tutorial-complete handoff within 2 seconds without coaching. |
| Explains pay minus cost equals net | pass | Tester said pay minus cost becomes net. |
| No systematic swipe/snap mistrust | pass | Tester trusted the swipe snap and did not blame input imprecision. |
| Mobile readability holds on real device | fail | Desktop non-mobile session; mobile readability was not evaluated on a real phone or tablet. |
| Labor frame noticed without being told | pass | Tester described the AI supervisor, job, payroll, and company cost without being told. |
| Engagement and degraded visual intent observed | pass | Tester wanted another round and said the degraded assistant-browser visual style felt intentional, not broken. |
| Copied summary returned with run ID, start source, input modality, round trace, cut-error counts, total net, and best-saved record | pass | Copied summary was pasted with run id, start source, input feel trace, OK/missed/false counts, net, and best saved. |

## Follow-Up Changes

- No follow-up entered for this synthetic status fixture.

## Principle Evidence Notes

- Top game design loop evidence: Prompt action swipe review feedback net consequence next loop stayed connected.
- Critical/conceptual play evidence: Tester called the AI supervisor a browser labor audit and noticed company cost.
- Emotional design evidence: Mistakes felt fair and recoverable under pressure instead of unfair.
- Game feel evidence: Swipe snap and cut feedback felt responsive during the timer.
- Optimal visual display evidence: HUD text, review markers, Wiener speech, and feedback contrast stayed readable without overlap.
`;
}
