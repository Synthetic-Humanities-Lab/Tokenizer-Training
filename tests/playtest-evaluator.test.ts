import { describe, expect, it } from "vitest";
import {
  evaluatePlaytestSessions,
  parsePlaytestSessionNote,
  playtestDebriefQuestions,
  playtestObservationLabels,
  playtestPrincipleEvidenceLabels,
  playtestSessionEvidenceIssues,
  renderPlaytestGateEvaluation,
  validateDebriefAnswers,
  validateCopiedSummary,
  validateObservationNotes,
  validatePrincipleEvidence,
  validateSessionMetadata
} from "../scripts/evaluate-playtest-notes";
import type {
  PlaytestObservationLabel,
  PlaytestPrincipleEvidenceLabel
} from "../scripts/evaluate-playtest-notes";

const completeSummary = `Tokenizer Training playtest summary
Run ID: tt-20260606-172531z
Outcome: quit
Start: handoff screen
Input: touch
Input evidence: browser pointer reported touch; verify device metadata
Rounds: 7
Accuracy: 63%
Cuts: OK 5 / Missed 3 / False 2
Round trace:
1. simple_001 / simple_prose / tier 1 / tokens 6 / OK 2 / Missed 1 / False 0
2. punct_001 / contraction / tier 2 / tokens 5 / OK 2 / Missed 1 / False 1
3. dense_001 / url / tier 3 / tokens 4 / OK 1 / Missed 1 / False 1
Input feel trace:
Input feel fields: first-cut latency, resolve timing after first/last cut, cut batch ownership, release-sample/correction ownership, no-cut acknowledgements, touch-loupe clearance.
1. samples 5 / responses 2 / first 32ms / resolve-first 420ms / resolve-last 180ms / commit 1 / batch 1 / release-latched 1 / last-source release / adjusted 0 / gesture-samples 5 / owned-cuts 2 / no-cut 0 / near 0 / off 0 / loupe 4 / ready 3 / low-clear 0 / min-clear 42px
Pay: $21.50
Cost: $49.75
Net: -$28.25
Balance: $12.34
Efficiency: 0.43x
Rank: Junior Boundary Clerk
Best saved: 11 rounds / BPE Adjacent`;

const criteriaLabels = [
  "First action completed without outside instruction",
  "Explains one non-word tokenization behavior",
  "Selects Start Training from tutorial-complete handoff",
  "Explains verified credits minus rework equals net credits",
  "No systematic swipe/snap mistrust",
  "Mobile readability holds on real device",
  "Labor frame noticed without being told",
  "Engagement and degraded visual intent observed",
  "Copied summary returned with run ID, start source, input modality, round trace, cut-error counts, total net, and best-saved record"
] as const;

const handoffEvidenceRequirement =
  "pass evidence must name the tutorial-complete handoff, an affirmative started Training or clicked Training action, and no-prompt/coaching/timing evidence";

function sessionNote(options: {
  tester: string;
  input?: string;
  deviceBrowser?: string;
  network?: string;
  launchUrl?: string;
  visualEvidence?: string;
  summary?: string;
  results?: Partial<Record<(typeof criteriaLabels)[number], string>>;
  evidence?: Partial<Record<(typeof criteriaLabels)[number], string>>;
  observationEvidence?: Partial<Record<PlaytestObservationLabel, string>>;
  observationResults?: Partial<Record<PlaytestObservationLabel, string>>;
  principleEvidence?: Partial<Record<PlaytestPrincipleEvidenceLabel, string>>;
  debriefAnswers?: Partial<Record<number, string>>;
  omitEvidenceColumn?: boolean;
}): string {
  const rows = criteriaLabels
    .map((label) => {
      const result = options.results?.[label] ?? "pass";
      const defaultEvidence = defaultCriterionEvidence(options.tester, label);
      const evidence = options.evidence?.[label] ?? defaultEvidence;
      return options.omitEvidenceColumn ? `| ${label} | ${result} |` : `| ${label} | ${result} | ${evidence} |`;
    })
    .join("\n");
  const debrief = playtestDebriefQuestions
    .map((question, index) => {
      const answer = options.debriefAnswers?.[index + 1] ?? defaultDebriefAnswer(options.tester, index);
      return `${index + 1}. ${question}\n\n${answer}`;
    })
    .join("\n\n");
  const observations = playtestObservationLabels
    .map((label) => {
      const result = options.observationResults?.[label] ?? "pass";
      const evidence = options.observationEvidence?.[label] ?? defaultObservationEvidence(options.tester, label);
      return `| ${label} | ${evidence} | ${result} |`;
    })
    .join("\n");
  const principleNotes = playtestPrincipleEvidenceLabels
    .map((label) => {
      const evidence = options.principleEvidence?.[label] ?? defaultPrincipleEvidence(options.tester, label);
      return `- ${label}: ${evidence}`;
    })
    .join("\n");

  return `# Tokenizer Training Playtest Notes

## Session Metadata

- Tester ID: ${options.tester}
- Date: 2026-06-06
- Run ID: tt-20260606-172531z
- Device/browser: ${options.deviceBrowser ?? "iPhone Safari"}
- Input: ${options.input ?? "touch"}
- Network: ${options.network ?? "LAN"}
- Launch URL: ${options.launchUrl ?? "http://192.168.1.20:5173/?playtestReset=1"}
- Facilitator: QA
- Reset used: yes
- Visual evidence: ${options.visualEvidence ?? "observer notes"}

## Copied Result Summary

\`\`\`text
${options.summary ?? completeSummary}
\`\`\`

## Observation Notes

| Observation | Evidence | Pass? |
| --- | --- | --- |
${observations}

## Debrief Answers

${debrief}

## Pass-Criteria Rollup

| Criterion | Result | Evidence / contradiction |
| --- | --- | --- |
${rows}

## Principle Evidence Notes

${principleNotes}
`;
}

function defaultDebriefAnswer(tester: string, index: number): string {
  switch (index) {
    case 0:
      return `${tester} said they swiped to place cuts where token boundaries split the text.`;
    case 1:
      return `${tester} said a token boundary is where the tokenizer divides text into chunks.`;
    case 2:
      return `${tester} named spaces traveling with the next token and punctuation splitting from words.`;
    case 3:
      return `${tester} said pay rises for correct cuts and cost rises for missed or false cuts, making net.`;
    case 4:
      return `${tester} said the snap felt precise and did not blame input imprecision.`;
    case 5:
      return `${tester} described the AI browser as a payroll audit job with a supervisor.`;
    case 6:
      return `${tester} said the dense URL review screen was hardest to read.`;
    case 7:
      return `${tester} wanted another round and said the degraded browser style felt intentional, not broken.`;
    default:
      return `${tester} gave a debrief answer.`;
  }
}

function defaultObservationEvidence(tester: string, label: PlaytestObservationLabel): string {
  switch (label) {
    case "First tutorial action without outside instruction":
      return `${tester} swiped the first tutorial boundary before the facilitator spoke.`;
    case "Pale guides understood as legal slots, not answers":
      return `${tester} described pale guides as legal slot positions, while orange showed target examples.`;
    case "Spaces not systematically over-cut":
      return `${tester} cut the centered space slot once and did not double-audit the blank.`;
    case "Clear Cuts discovered or understood":
      return `${tester} used Clear Cuts after an over-cut and understood it as recovery.`;
    case "Snap positions trusted":
      return `${tester} said swipe snap positions felt precise and did not blame input imprecision.`;
    case "Missed/false review markers understood":
      return `${tester} explained missed and false review markers as different audit outcomes.`;
    case "Verified credits, rework, net credits, remaining credits, and rank understood":
      return `${tester} explained pay minus cost changed net, balance, and rank.`;
    case "Tutorial-complete handoff: Start Training selected without prompting":
      return `${tester} started Training from the handoff without outside instruction.`;
    case "Dense strings read as higher-risk tokenization":
      return `${tester} said the URL with dots and slashes looked higher-risk and more expensive.`;
    case "Degraded AI labor frame noticed through play":
      return `${tester} described the assistant browser as payroll audit labor without being told.`;
    case "Degraded visual style felt intentional and play invited another round":
      return `${tester} asked for another round and said the degraded assistant-browser visual style felt intentional, not broken.`;
    case "Errors felt earned and recoverable, not arbitrary":
      return `${tester} said mistakes felt earned and recoverable through Clear Cuts and review evidence.`;
    case "Prompt, action, evidence, consequence, and next step formed a legible loop":
      return `${tester} followed the prompt, swiped, read review evidence, saw net consequence, and moved to the next round.`;
    case "Copy Summary worked and includes run/start/input, round trace, OK/missed/false counts, net, and best record":
      return `${tester} pasted Copy Summary with run ID, handoff start, touch input, fixture round trace, OK/Missed/False counts, net, and best saved.`;
    case "Mobile HUD/text/review/feedback/Wiener speech readable":
      return `${tester} phone observer notes captured HUD, static prompt text, review markers, feedback, and Wiener speech readable without clipping.`;
  }
}

function defaultPrincipleEvidence(tester: string, label: PlaytestPrincipleEvidenceLabel): string {
  switch (label) {
    case "Top game design loop evidence":
      return `${tester} understood the prompt, swiped cuts, read review feedback, saw net consequence, and chose the next handoff.`;
    case "Critical/conceptual play evidence":
      return `${tester} described AI browser payroll audit labor, company cost, rank, and supervisor pressure through play.`;
    case "Emotional design evidence":
      return `${tester} said pressure felt fair, mistakes felt earned and recoverable, and Clear Cuts preserved agency.`;
    case "Game feel evidence":
      return `${tester} trusted swipe snap, cut preview, trail, timer pressure, and responsive feedback.`;
    case "Optimal visual display evidence":
      return `${tester} observer notes captured readable HUD, static prompt text, review markers, popup, feedback, and Wiener speech without overlap.`;
  }
}

function defaultCriterionEvidence(tester: string, label: (typeof criteriaLabels)[number]): string {
  switch (label) {
    case "First action completed without outside instruction":
      return `${tester} swiped the first tutorial cut unprompted with no coaching.`;
    case "Explains one non-word tokenization behavior":
      return `${tester} said spaces can travel with the next token and punctuation may split.`;
    case "Selects Start Training from tutorial-complete handoff":
      return `${tester} clicked Start Training from the tutorial-complete handoff within 8 seconds without outside instruction.`;
    case "Explains verified credits minus rework equals net credits":
      return `${tester} explained pay minus company cost makes the net result.`;
    case "No systematic swipe/snap mistrust":
      return `${tester} trusted the swipe snap positions and did not blame input imprecision.`;
    case "Mobile readability holds on real device":
      return `${tester} observer notes captured HUD, static prompt text, review markers, feedback card, and Wiener speech readable with no clipping or overlap.`;
    case "Labor frame noticed without being told":
      return `${tester} described the degraded AI browser as a payroll audit job.`;
    case "Engagement and degraded visual intent observed":
      return `${tester} asked for another round and said the degraded assistant-browser visual style felt intentional, not broken.`;
    case "Copied summary returned with run ID, start source, input modality, round trace, cut-error counts, total net, and best-saved record":
      return `${tester} pressed Copy Summary and pasted run ID, start source, input, fixture round trace, OK/Missed/False counts, net, and best saved.`;
  }
}

describe("playtest note evaluator", () => {
  it("parses session metadata, copied summary, and pass-criteria rows", () => {
    const session = parsePlaytestSessionNote(sessionNote({ tester: "P1" }), "p1.md");

    expect(session.file).toBe("p1.md");
    expect(session.metadata.testerId).toBe("P1");
    expect(session.metadata.date).toBe("2026-06-06");
    expect(session.metadata.network).toBe("LAN");
    expect(session.metadata.input).toBe("touch");
    expect(session.metadataValidation.complete).toBe(true);
    expect(session.isMobileSession).toBe(true);
    expect(session.summaryValidation.complete).toBe(true);
    expect(session.observationValidation.complete).toBe(true);
    expect(session.observationNotes["First tutorial action without outside instruction"].evidence).toContain(
      "P1 swiped the first tutorial boundary"
    );
    expect(session.debriefAnswers).toHaveLength(8);
    expect(session.debriefValidation.complete).toBe(true);
    expect(session.principleEvidenceValidation.complete).toBe(true);
    expect(session.principleEvidence["Game feel evidence"]).toContain("swipe snap");
    expect(session.debriefAnswers[0]).toBe("P1 said they swiped to place cuts where token boundaries split the text.");
    expect(session.criteria.firstAction).toBe("pass");
    expect(session.criterionEvidence.firstAction).toContain("P1 swiped the first tutorial cut");
    expect(session.criteria.copiedSummary).toBe("pass");
  });

  it.each([
    ["legacy", "# Manual Tokenization Training Playtest Notes"],
    ["missing", ""],
    ["wrong", "# Tokenizer Training Session Notes"],
    ["canonical H1 after unscoped text", "Unscoped evidence\n# Tokenizer Training Playtest Notes"]
  ])("rejects a %s session note H1", (_case, h1) => {
    const session = parsePlaytestSessionNote(
      sessionNote({ tester: "P1" }).replace("# Tokenizer Training Playtest Notes", h1),
      "p1.md"
    );

    expect(playtestSessionEvidenceIssues(session)).toEqual([
      'p1.md: H1 must exactly be "# Tokenizer Training Playtest Notes".'
    ]);
  });

  it.each([
    ["started Training", "P1 started Training from the handoff without outside instruction."],
    ["starts Training", "The tutorial-complete handoff starts Training without prompting."],
    ["clicked Training", "P1 clicked Training from the handoff without facilitator prompting."],
    ["clicked Start Training", "P1 clicked Start Training from the handoff within 8 seconds."],
    ["clicked a quoted Start Training label", "P1 clicked `Start Training` from the handoff without prompting."],
    [
      "current action beside a historical name",
      "The historical button was Start Endless Training; P1 clicked Start Training from the current handoff with no coaching."
    ]
  ])("accepts concrete %s handoff evidence", (_case, handoffEvidence) => {
    const session = parsePlaytestSessionNote(
      sessionNote({
        tester: "P1",
        observationEvidence: {
          "Tutorial-complete handoff: Start Training selected without prompting": handoffEvidence
        },
        evidence: {
          "Selects Start Training from tutorial-complete handoff": handoffEvidence
        }
      }),
      "p1.md"
    );

    expect(session.observationValidation.invalidRows).toEqual([]);
    expect(playtestSessionEvidenceIssues(session)).toEqual([]);
  });

  it.each([
    ["missing handoff context", "P1 clicked Start Training without prompting."],
    [
      "negated group action",
      "No tester clicked Start Training from the tutorial-complete handoff without prompting."
    ],
    [
      "did-not-click failure",
      "P1 did not click Start Training from the tutorial-complete handoff without prompting."
    ],
    [
      "could-not-start failure",
      "P1 could not start Training from the tutorial-complete handoff without prompting."
    ],
    [
      "main-menu Training click",
      "After seeing the tutorial-complete handoff, P1 returned to the main menu and clicked Start Training within 8 seconds."
    ],
    ["missing autonomy or timing evidence", "P1 clicked Start Training from the tutorial-complete handoff."]
  ])("rejects %s as handoff evidence", (_case, handoffEvidence) => {
    const session = parsePlaytestSessionNote(
      sessionNote({
        tester: "P1",
        observationEvidence: {
          "Tutorial-complete handoff: Start Training selected without prompting": handoffEvidence
        },
        evidence: {
          "Selects Start Training from tutorial-complete handoff": handoffEvidence
        }
      }),
      "p1.md"
    );
    const issues = playtestSessionEvidenceIssues(session);

    expect(session.observationValidation.invalidRows).toContain(
      `Tutorial-complete handoff: Start Training selected without prompting ${handoffEvidenceRequirement}`
    );
    expect(issues).toContain(
      "p1.md: Selects Start Training from tutorial-complete handoff pass needs criterion-specific observed evidence."
    );
  });

  it("rejects retired Start Endless Training as current handoff evidence", () => {
    const retiredEvidence = "P1 clicked Start Endless Training from the handoff without outside instruction.";
    const session = parsePlaytestSessionNote(
      sessionNote({
        tester: "P1",
        observationEvidence: {
          "Tutorial-complete handoff: Start Training selected without prompting": retiredEvidence
        },
        evidence: {
          "Selects Start Training from tutorial-complete handoff": retiredEvidence
        }
      }),
      "p1.md"
    );
    const issues = playtestSessionEvidenceIssues(session);

    expect(session.observationValidation.invalidRows).toContain(
      `Tutorial-complete handoff: Start Training selected without prompting ${handoffEvidenceRequirement}`
    );
    expect(issues).toContain(
      "p1.md: Selects Start Training from tutorial-complete handoff pass needs criterion-specific observed evidence."
    );
  });

  it("does not parse retired handoff rows as the current schema", () => {
    const session = parsePlaytestSessionNote(
      sessionNote({ tester: "P1" })
        .replace(
          "Tutorial-complete handoff: Start Training selected without prompting",
          "Tutorial-complete handoff starts Endless without prompting"
        )
        .replace(
          "Selects Start Training from tutorial-complete handoff",
          "Starts Endless from tutorial-complete handoff"
        ),
      "p1.md"
    );

    expect(session.observationValidation.missingRows).toContain(
      "Tutorial-complete handoff: Start Training selected without prompting pass state"
    );
    expect(session.criteria.handoff).toBe("missing");
  });

  it("parses debrief answers written inline on the numbered question line", () => {
    const markdown = sessionNote({ tester: "P1" })
      .replace(
        "1. What were you trying to do when you swiped?\n\nP1 said they swiped to place cuts where token boundaries split the text.",
        "1. What were you trying to do when you swiped? I was trying to put cuts where tokens split."
      )
      .replace(
        "2. What is a token boundary, based on the game?\n\nP1 said a token boundary is where the tokenizer divides text into chunks.",
        "2. A token boundary is where the tokenizer divides text."
      );

    const session = parsePlaytestSessionNote(markdown);

    expect(session.debriefAnswers[0]).toBe("I was trying to put cuts where tokens split.");
    expect(session.debriefAnswers[1]).toBe("A token boundary is where the tokenizer divides text.");
    expect(session.debriefValidation.complete).toBe(true);
  });

  it("validates required debrief answers", () => {
    const validation = validateDebriefAnswers([
      "I was placing cuts where the game said token boundaries might be.",
      "pass",
      "",
      "Pay rose for correct cuts and cost rose for missed or false cuts.",
      "No, the snap felt precise.",
      "It felt like a degraded AI audit job.",
      "The URL review screen was hardest to read.",
      "The weird browser look made me want another round."
    ]);

    expect(validation.complete).toBe(false);
    expect(validation.missingAnswers).toEqual(["question 3"]);
    expect(validation.invalidAnswers).toEqual(["question 2 answer lacks substantive evidence"]);
  });

  it("rejects debrief answers that do not address the specific question", () => {
    const validation = validateDebriefAnswers([
      "The game was interesting but I am not talking about swiping.",
      "I liked the colors on the screen.",
      "The tutorial was short.",
      "Accounting was present but I cannot explain it.",
      "It was fine.",
      "The story existed.",
      "Everything was fine.",
      "I have no comment."
    ]);

    expect(validation.complete).toBe(false);
    expect(validation.invalidAnswers).toEqual([
      "question 1 answer does not address the debrief question",
      "question 2 answer does not address the debrief question",
      "question 3 answer does not address the debrief question",
      "question 4 answer does not address the debrief question",
      "question 5 answer does not address the debrief question",
      "question 6 answer does not address the debrief question",
      "question 7 answer does not address the debrief question",
      "question 8 answer does not address the debrief question"
    ]);
  });

  it("validates required observation-note rows", () => {
    const session = parsePlaytestSessionNote(
      sessionNote({
        tester: "P1",
        observationEvidence: {
          "First tutorial action without outside instruction": "",
          "Pale guides understood as legal slots, not answers": "pass",
          "Mobile HUD/text/review/feedback/Wiener speech readable": "Looked fine."
        },
        observationResults: {
          "Snap positions trusted": ""
        }
      }),
      "p1.md"
    );
    const validation = validateObservationNotes(session.observationNotes);

    expect(validation.complete).toBe(false);
    expect(validation.missingRows).toContain("First tutorial action without outside instruction evidence");
    expect(validation.missingRows).toContain("Snap positions trusted pass state");
    expect(validation.invalidRows).toContain(
      "Pale guides understood as legal slots, not answers evidence lacks substantive observation"
    );
    expect(validation.invalidRows).toContain(
      "Mobile HUD/text/review/feedback/Wiener speech readable evidence must name mobile or non-mobile context plus a readable surface or failure mode"
    );
  });

  it("rejects evaluations with incomplete observation-note evidence", () => {
    const sessions = [
      parsePlaytestSessionNote(
        sessionNote({
          tester: "P1",
          input: "touch",
          deviceBrowser: "iPhone Safari",
          observationEvidence: {
            "First tutorial action without outside instruction": "",
            "Pale guides understood as legal slots, not answers": "yes"
          }
        }),
        "p1.md"
      ),
      parsePlaytestSessionNote(sessionNote({ tester: "P2", input: "mouse", deviceBrowser: "Desktop Chrome" }), "p2.md"),
      parsePlaytestSessionNote(sessionNote({ tester: "P3", input: "mouse", deviceBrowser: "Desktop Firefox" }), "p3.md"),
      parsePlaytestSessionNote(sessionNote({ tester: "P4", input: "mouse", deviceBrowser: "Desktop Safari" }), "p4.md"),
      parsePlaytestSessionNote(sessionNote({ tester: "P5", input: "mouse", deviceBrowser: "Desktop Chrome" }), "p5.md")
    ];

    const evaluation = evaluatePlaytestSessions(sessions);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      "p1.md: observation notes are incomplete (missing First tutorial action without outside instruction evidence; Pale guides understood as legal slots, not answers evidence lacks substantive observation)."
    );
  });

  it("rejects pass-criteria rows that contradict matching observation rows", () => {
    const sessions = [
      parsePlaytestSessionNote(
        sessionNote({
          tester: "P1",
          input: "touch",
          deviceBrowser: "iPhone Safari",
          observationResults: {
            "First tutorial action without outside instruction": "fail",
            "Snap positions trusted": "ambiguous"
          }
        }),
        "p1.md"
      ),
      parsePlaytestSessionNote(sessionNote({ tester: "P2", input: "mouse", deviceBrowser: "Desktop Chrome" }), "p2.md"),
      parsePlaytestSessionNote(sessionNote({ tester: "P3", input: "mouse", deviceBrowser: "Desktop Firefox" }), "p3.md"),
      parsePlaytestSessionNote(sessionNote({ tester: "P4", input: "mouse", deviceBrowser: "Desktop Safari" }), "p4.md"),
      parsePlaytestSessionNote(sessionNote({ tester: "P5", input: "mouse", deviceBrowser: "Desktop Chrome" }), "p5.md")
    ];

    const evaluation = evaluatePlaytestSessions(sessions);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      'p1.md: First action completed without outside instruction is marked pass but observation "First tutorial action without outside instruction" is fail.'
    );
    expect(evaluation.issues).toContain(
      'p1.md: No systematic swipe/snap mistrust is marked pass but observation "Snap positions trusted" is ambiguous.'
    );
  });

  it("rejects failed pass-criteria rows that contradict passing observation rows", () => {
    const sessions = [
      parsePlaytestSessionNote(
        sessionNote({
          tester: "P1",
          input: "touch",
          deviceBrowser: "iPhone Safari",
          results: {
            "Selects Start Training from tutorial-complete handoff": "fail"
          }
        }),
        "p1.md"
      ),
      parsePlaytestSessionNote(sessionNote({ tester: "P2", input: "mouse", deviceBrowser: "Desktop Chrome" }), "p2.md"),
      parsePlaytestSessionNote(sessionNote({ tester: "P3", input: "mouse", deviceBrowser: "Desktop Firefox" }), "p3.md"),
      parsePlaytestSessionNote(sessionNote({ tester: "P4", input: "mouse", deviceBrowser: "Desktop Safari" }), "p4.md"),
      parsePlaytestSessionNote(sessionNote({ tester: "P5", input: "mouse", deviceBrowser: "Desktop Chrome" }), "p5.md")
    ];

    const evaluation = evaluatePlaytestSessions(sessions);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      'p1.md: Selects Start Training from tutorial-complete handoff is marked fail but observation "Tutorial-complete handoff: Start Training selected without prompting" is pass.'
    );
  });

  it("validates principle evidence notes against each principle area", () => {
    const session = parsePlaytestSessionNote(
      sessionNote({
        tester: "P1",
        principleEvidence: {
          "Top game design loop evidence": "",
          "Critical/conceptual play evidence": "pass",
          "Game feel evidence": "P1 generally liked the game."
        }
      }),
      "p1.md"
    );
    const validation = validatePrincipleEvidence(session.principleEvidence);

    expect(validation.complete).toBe(false);
    expect(validation.missingFields).toContain("Top game design loop evidence");
    expect(validation.invalidFields).toContain("Critical/conceptual play evidence lacks substantive evidence");
    expect(validation.invalidFields).toContain(
      "Game feel evidence must name concrete playtest behavior for that principle area"
    );
  });

  it("rejects evaluations with incomplete principle evidence notes", () => {
    const sessions = [
      parsePlaytestSessionNote(
        sessionNote({
          tester: "P1",
          input: "touch",
          deviceBrowser: "iPhone Safari",
          principleEvidence: {
            "Top game design loop evidence": "",
            "Optimal visual display evidence": "P1 generally liked the game."
          }
        }),
        "p1.md"
      ),
      parsePlaytestSessionNote(sessionNote({ tester: "P2", input: "mouse", deviceBrowser: "Desktop Chrome" }), "p2.md"),
      parsePlaytestSessionNote(sessionNote({ tester: "P3", input: "mouse", deviceBrowser: "Desktop Firefox" }), "p3.md"),
      parsePlaytestSessionNote(sessionNote({ tester: "P4", input: "mouse", deviceBrowser: "Desktop Safari" }), "p4.md"),
      parsePlaytestSessionNote(sessionNote({ tester: "P5", input: "mouse", deviceBrowser: "Desktop Chrome" }), "p5.md")
    ];

    const evaluation = evaluatePlaytestSessions(sessions);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      "p1.md: principle evidence notes are incomplete (missing Top game design loop evidence; Optimal visual display evidence must name concrete playtest behavior for that principle area)."
    );
  });

  it("validates required session metadata provenance", () => {
    expect(
      validateSessionMetadata({
        testerId: "P1",
        date: "2026-06-06",
        runId: "tt-20260606-172531z",
        deviceBrowser: "iPhone Safari",
        input: "touch",
        network: "LAN",
        launchUrl: "http://192.168.1.20:5173/?playtestReset=1",
        facilitator: "QA",
        resetUsed: "yes",
        visualEvidence: "observer notes"
      }).complete
    ).toBe(true);

    const blankValidation = validateSessionMetadata({
      testerId: "",
      runId: "",
      input: "mouse / touch / pen / trackpad / mixed",
      network: "same-machine / LAN",
      launchUrl: "http://127.0.0.1:5173/",
      resetUsed: "yes / no",
      visualEvidence: "screenshot / photo / screen recording / observer notes / none"
    });

    expect(blankValidation.complete).toBe(false);
    expect(blankValidation.missingFields).toEqual([
      "tester ID",
      "date",
      "run ID",
      "device/browser",
      "facilitator"
    ]);
    expect(blankValidation.invalidFields).toEqual([
      "input must be one of mouse, touch, pen, trackpad, or mixed",
      "network must be same-machine or LAN",
      "reset used must be yes or no",
      "visual evidence must be screenshot, photo, screen recording, observer notes, or none",
      "launch URL must include playtestReset=1"
    ]);
  });

  it("rejects session metadata with a non-game run ID", () => {
    const validation = validateSessionMetadata({
      testerId: "P1",
      date: "2026-06-06",
      runId: "spreadsheet-row-1",
      deviceBrowser: "Desktop Chrome",
      input: "mouse",
      network: "same-machine",
      launchUrl: "http://127.0.0.1:5173/?playtestReset=1",
      facilitator: "QA",
      resetUsed: "yes",
      visualEvidence: "observer notes"
    });

    expect(validation.complete).toBe(false);
    expect(validation.invalidFields).toContain("run ID must use the game-generated tt-* format");
  });

  it("rejects legacy run IDs in session metadata and copied summaries", () => {
    const metadataValidation = validateSessionMetadata({ runId: "mtt-20260606-172531z" });
    const summaryValidation = validateCopiedSummary(
      completeSummary.replace("Run ID: tt-20260606-172531z", "Run ID: mtt-20260606-172531z")
    );

    expect(metadataValidation.invalidFields).toContain("run ID must use the game-generated tt-* format");
    expect(summaryValidation.invalidFields).toContain("run ID must use the game-generated tt-* format");
  });

  it("rejects mobile metadata when the visual evidence field records none", () => {
    const validation = validateSessionMetadata({
      testerId: "P1",
      date: "2026-06-06",
      runId: "tt-20260606-172531z",
        deviceBrowser: "iPhone Safari",
        input: "touch",
        network: "LAN",
        launchUrl: "http://192.168.1.20:5173/?playtestReset=1",
        facilitator: "QA",
        resetUsed: "yes",
        visualEvidence: "none"
      });

    expect(validation.complete).toBe(false);
    expect(validation.invalidFields).toContain(
      "mobile sessions require screenshot, photo, screen recording, or observer notes"
    );
  });

  it("rejects mobile metadata recorded as same-machine or launched from localhost", () => {
    const sameMachine = validateSessionMetadata({
      testerId: "P1",
      date: "2026-06-06",
      runId: "tt-20260606-172531z",
      deviceBrowser: "iPhone Safari",
      input: "touch",
      network: "same-machine",
      launchUrl: "http://192.168.1.20:5173/?playtestReset=1",
      facilitator: "QA",
      resetUsed: "yes",
      visualEvidence: "observer notes"
    });
    const localhost = validateSessionMetadata({
      testerId: "P1",
      date: "2026-06-06",
      runId: "tt-20260606-172531z",
      deviceBrowser: "iPhone Safari",
      input: "touch",
      network: "LAN",
      launchUrl: "http://127.0.0.1:5173/?playtestReset=1",
      facilitator: "QA",
      resetUsed: "yes",
      visualEvidence: "observer notes"
    });

    expect(sameMachine.complete).toBe(false);
    expect(sameMachine.invalidFields).toContain("mobile sessions require Network: LAN");
    expect(localhost.complete).toBe(false);
    expect(localhost.invalidFields).toContain("mobile session launch URL must use a LAN host, not localhost");
  });

  it("counts mobile readability sessions only when metadata shows real mobile touch use", () => {
    const phoneTouch = parsePlaytestSessionNote(
      sessionNote({ tester: "PhoneTouch", input: "touch", deviceBrowser: "iPhone Safari" })
    );
    const desktopTouch = parsePlaytestSessionNote(
      sessionNote({ tester: "DesktopTouch", input: "touch", deviceBrowser: "Desktop Chrome" })
    );
    const phoneMouse = parsePlaytestSessionNote(
      sessionNote({ tester: "PhoneMouse", input: "mouse", deviceBrowser: "iPhone Safari" })
    );
    const tabletPen = parsePlaytestSessionNote(
      sessionNote({ tester: "TabletPen", input: "pen", deviceBrowser: "Android tablet Chrome" })
    );
    const phoneSameMachine = parsePlaytestSessionNote(
      sessionNote({
        tester: "PhoneSameMachine",
        input: "touch",
        deviceBrowser: "iPhone Safari",
        network: "same-machine"
      })
    );
    const phoneLocalhost = parsePlaytestSessionNote(
      sessionNote({
        tester: "PhoneLocalhost",
        input: "touch",
        deviceBrowser: "iPhone Safari",
        launchUrl: "http://127.0.0.1:5173/?playtestReset=1"
      })
    );

    expect(phoneTouch.isMobileSession).toBe(true);
    expect(desktopTouch.isMobileSession).toBe(false);
    expect(phoneMouse.isMobileSession).toBe(false);
    expect(tabletPen.isMobileSession).toBe(true);
    expect(phoneSameMachine.isMobileSession).toBe(false);
    expect(phoneLocalhost.isMobileSession).toBe(false);
  });

  it("validates required copied-summary evidence fields", () => {
    expect(validateCopiedSummary(completeSummary).complete).toBe(true);
    expect(validateCopiedSummary(`\n \n${completeSummary}`).complete).toBe(true);

    const validation = validateCopiedSummary(`Tokenizer Training playtest summary
Run ID: not captured
Start: not captured
Input: not captured
Cuts: not captured
Round trace: not captured
Net: $0.00
Best saved: 0 rounds / Regex Intern`);

    expect(validation.complete).toBe(false);
    expect(validation.missingFields).toEqual([
      "run ID",
      "start source",
      "input modality",
      "input evidence",
      "cut-error counts",
      "round trace",
      "input feel trace",
      "total net"
    ]);
    expect(validation.invalidFields).toEqual([]);

    expect(
      validateCopiedSummary(`Tokenizer Training playtest summary
Run ID:
Start: handoff screen
Input: touch
Input evidence: browser pointer reported touch; verify device metadata
Cuts: OK 1 / Missed 0 / False 0
Round trace:
1. simple_001 / simple_prose / tier 1 / tokens 6 / OK 1 / Missed 0 / False 0
Input feel trace:
Input feel fields: first-cut latency, resolve timing after first/last cut, cut batch ownership, release-sample/correction ownership, no-cut acknowledgements, touch-loupe clearance.
1. samples 1 / responses 1 / first 10ms / resolve-first 120ms / resolve-last 120ms / commit 1 / batch 1 / release-latched 0 / last-source direct / adjusted 0 / gesture-samples 1 / owned-cuts 1 / no-cut 0 / near 0 / off 0 / loupe 0 / ready 0 / low-clear 0 / min-clear n/a
Net: +$1.00
Best saved: 1 rounds / Regex Intern`).missingFields
    ).toContain("run ID");
  });

  it.each([
    [
      "legacy Manual Tokenization Training header",
      completeSummary.replace(
        "Tokenizer Training playtest summary",
        "Manual Tokenization Training playtest summary"
      )
    ],
    [
      "legacy Tokenization Training header",
      completeSummary.replace(
        "Tokenizer Training playtest summary",
        "Tokenization Training playtest summary"
      )
    ],
    [
      "canonical title only later in the text",
      `Manual Tokenization Training playtest summary\n${completeSummary}`
    ]
  ])("rejects a copied summary with a %s", (_case, summary) => {
    const validation = validateCopiedSummary(summary);

    expect(validation.complete).toBe(false);
    expect(validation.missingFields).toEqual([]);
    expect(validation.invalidFields).toEqual([
      'summary first nonblank line must exactly equal "Tokenizer Training playtest summary"'
    ]);
  });

  it("requires copied summaries to use explicit input-feel ownership labels", () => {
    const staleTrace = completeSummary
      .replace(
        "responses 2 / first 32ms / resolve-first 420ms / resolve-last 180ms / commit 1 / batch 1 / release-latched 1 / last-source release / adjusted 0 / gesture-samples 5 / owned-cuts 2",
        "cuts 2 / first 32ms / resolve-first 420ms / resolve-last 180ms / commit 1 / batch 1 / release 1 / last release / adjusted 0 / gesture 5/2"
      );

    const validation = validateCopiedSummary(staleTrace);

    expect(validation.complete).toBe(false);
    expect(validation.missingFields).toContain("input feel trace");
  });

  it("rejects copied summaries from direct runs or a different run ID", () => {
    const directRun = validateCopiedSummary(completeSummary.replace("Start: handoff screen", "Start: direct"));
    const wrongRun = validateCopiedSummary(completeSummary, {
      runId: "tt-20260606-180000z"
    });

    expect(directRun.complete).toBe(false);
    expect(directRun.invalidFields).toContain("start source must be handoff screen for the first-user protocol");
    expect(wrongRun.complete).toBe(false);
    expect(wrongRun.invalidFields).toContain("run ID does not match session metadata");
  });

  it("rejects copied summaries with a non-game run ID", () => {
    const validation = validateCopiedSummary(completeSummary.replace("Run ID: tt-20260606-172531z", "Run ID: row-1"));

    expect(validation.complete).toBe(false);
    expect(validation.invalidFields).toContain("run ID must use the game-generated tt-* format");
  });

  it("rejects evaluations with missing or placeholder session metadata", () => {
    const missingMetadata = sessionNote({ tester: "P1", input: "touch", deviceBrowser: "iPhone Safari" })
      .replace("- Run ID: tt-20260606-172531z", "- Run ID:")
      .replace("- Launch URL: http://192.168.1.20:5173/?playtestReset=1", "- Launch URL:");
    const placeholderMetadata = sessionNote({ tester: "P2", input: "touch", deviceBrowser: "iPhone Safari" })
      .replace("- Input: touch", "- Input: mouse / touch / pen / trackpad / mixed")
      .replace("- Network: LAN", "- Network: same-machine / LAN")
      .replace("- Reset used: yes", "- Reset used: yes / no");
    const sessions = [
      parsePlaytestSessionNote(missingMetadata, "p1.md"),
      parsePlaytestSessionNote(placeholderMetadata, "p2.md"),
      parsePlaytestSessionNote(sessionNote({ tester: "P3", input: "mouse", deviceBrowser: "Desktop Chrome" }), "p3.md"),
      parsePlaytestSessionNote(sessionNote({ tester: "P4", input: "mouse", deviceBrowser: "Desktop Safari" }), "p4.md"),
      parsePlaytestSessionNote(sessionNote({ tester: "P5", input: "mouse", deviceBrowser: "Desktop Firefox" }), "p5.md")
    ];

    const evaluation = evaluatePlaytestSessions(sessions);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      "p1.md: session metadata is invalid (missing run ID; missing launch URL)."
    );
    expect(evaluation.issues).toContain(
      "p2.md: session metadata is invalid (input must be one of mouse, touch, pen, trackpad, or mixed; network must be same-machine or LAN; reset used must be yes or no)."
    );
  });

  it("rejects evaluations with missing or bare debrief answers", () => {
    const sessions = [
      parsePlaytestSessionNote(
        sessionNote({
          tester: "P1",
          input: "touch",
          deviceBrowser: "iPhone Safari",
          debriefAnswers: {
            2: "",
            6: "yes"
          }
        }),
        "p1.md"
      ),
      parsePlaytestSessionNote(sessionNote({ tester: "P2", input: "mouse", deviceBrowser: "Desktop Chrome" }), "p2.md"),
      parsePlaytestSessionNote(sessionNote({ tester: "P3", input: "mouse", deviceBrowser: "Desktop Firefox" }), "p3.md"),
      parsePlaytestSessionNote(sessionNote({ tester: "P4", input: "mouse", deviceBrowser: "Desktop Safari" }), "p4.md"),
      parsePlaytestSessionNote(sessionNote({ tester: "P5", input: "mouse", deviceBrowser: "Desktop Chrome" }), "p5.md")
    ];

    const evaluation = evaluatePlaytestSessions(sessions);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      "p1.md: debrief answers are incomplete (missing question 2; question 6 answer lacks substantive evidence)."
    );
  });

  it("passes only when five sessions satisfy the protocol thresholds with mobile evidence", () => {
    const sessions = [
      parsePlaytestSessionNote(sessionNote({ tester: "P1", input: "touch", deviceBrowser: "Android Chrome" })),
      parsePlaytestSessionNote(
        sessionNote({
          tester: "P2",
          input: "mouse",
          deviceBrowser: "Desktop Chrome",
          results: {
            "First action completed without outside instruction": "fail",
            "Labor frame noticed without being told": "fail"
          },
          observationResults: {
            "First tutorial action without outside instruction": "fail",
            "Degraded AI labor frame noticed through play": "fail"
          }
        })
      ),
      parsePlaytestSessionNote(
        sessionNote({
          tester: "P3",
          input: "mouse",
          deviceBrowser: "Desktop Firefox",
          results: {
            "Labor frame noticed without being told": "fail"
          },
          observationResults: {
            "Degraded AI labor frame noticed through play": "fail"
          }
        })
      ),
      parsePlaytestSessionNote(sessionNote({ tester: "P4", input: "mouse", deviceBrowser: "Desktop Safari" })),
      parsePlaytestSessionNote(sessionNote({ tester: "P5", input: "mouse", deviceBrowser: "Desktop Chrome" }))
    ];

    const evaluation = evaluatePlaytestSessions(sessions);

    expect(evaluation.ready).toBe(true);
    expect(evaluation.tallies.find((tally) => tally.criterion.id === "firstAction")?.passed).toBe(4);
    expect(evaluation.tallies.find((tally) => tally.criterion.id === "laborFrame")?.passed).toBe(3);
    expect(evaluation.tallies.find((tally) => tally.criterion.id === "mobileReadability")?.evaluatedSessions).toBe(1);
  });

  it("rejects generic pass evidence that does not name the observed behavior", () => {
    const sessions = [
      parsePlaytestSessionNote(
        sessionNote({
          tester: "P1",
          input: "touch",
          deviceBrowser: "iPhone Safari",
          evidence: {
            "First action completed without outside instruction": "P1 recorded evidence for first action.",
            "Explains one non-word tokenization behavior": "P1 recorded evidence for tokenization learning.",
            "Labor frame noticed without being told": "P1 recorded evidence for the fiction.",
            "Engagement and degraded visual intent observed": "P1 liked the game."
          }
        }),
        "p1.md"
      ),
      parsePlaytestSessionNote(sessionNote({ tester: "P2", input: "mouse", deviceBrowser: "Desktop Chrome" }), "p2.md"),
      parsePlaytestSessionNote(sessionNote({ tester: "P3", input: "mouse", deviceBrowser: "Desktop Firefox" }), "p3.md"),
      parsePlaytestSessionNote(sessionNote({ tester: "P4", input: "mouse", deviceBrowser: "Desktop Safari" }), "p4.md"),
      parsePlaytestSessionNote(sessionNote({ tester: "P5", input: "mouse", deviceBrowser: "Desktop Chrome" }), "p5.md")
    ];

    const evaluation = evaluatePlaytestSessions(sessions);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      "p1.md: First action completed without outside instruction pass needs criterion-specific observed evidence."
    );
    expect(evaluation.issues).toContain(
      "p1.md: Explains one non-word tokenization behavior pass needs criterion-specific observed evidence."
    );
    expect(evaluation.issues).toContain(
      "p1.md: Labor frame noticed without being told pass needs criterion-specific observed evidence."
    );
    expect(evaluation.issues).toContain(
      "p1.md: Engagement and degraded visual intent observed pass needs criterion-specific observed evidence."
    );
  });

  it("rejects missing mobile evidence instead of passing the mobile gate vacuously", () => {
    const sessions = Array.from({ length: 5 }, (_, index) =>
      parsePlaytestSessionNote(
        sessionNote({
          tester: `P${index + 1}`,
          input: "mouse",
          deviceBrowser: "Desktop Chrome"
        })
      )
    );

    const evaluation = evaluatePlaytestSessions(sessions);
    const report = renderPlaytestGateEvaluation(evaluation);

    expect(evaluation.ready).toBe(false);
    expect(report).toContain("Decision: iterate before broader playtest");
    expect(report).toContain(
      "Mobile readability holds on real device: no real phone/tablet session with touch, pen, or mixed input, Network: LAN, and a non-localhost launch URL was found."
    );
  });

  it("renders session files separately from completed evidence notes", () => {
    const evaluation = evaluatePlaytestSessions([
      parsePlaytestSessionNote(sessionNote({ tester: "P1", input: "touch", deviceBrowser: "Android Chrome" }), "p1.md"),
      parsePlaytestSessionNote("# Blank prepared note\n", "p2.md")
    ]);
    const report = renderPlaytestGateEvaluation(evaluation);

    expect(report).toContain("Session files: 2/5");
    expect(report).toContain("Completed notes: 1/5");
    expect(report).toContain("Completed real mobile/touch notes: 1");
    expect(report).not.toContain("Sessions: 2/5");
  });

  it("rejects desktop touch or mobile-without-touch metadata as real mobile evidence", () => {
    const sessions = [
      parsePlaytestSessionNote(
        sessionNote({
          tester: "P1",
          input: "touch",
          deviceBrowser: "Desktop Chrome"
        })
      ),
      parsePlaytestSessionNote(
        sessionNote({
          tester: "P2",
          input: "mouse",
          deviceBrowser: "iPhone Safari"
        })
      ),
      parsePlaytestSessionNote(sessionNote({ tester: "P3", input: "mouse", deviceBrowser: "Desktop Firefox" })),
      parsePlaytestSessionNote(sessionNote({ tester: "P4", input: "mouse", deviceBrowser: "Desktop Safari" })),
      parsePlaytestSessionNote(sessionNote({ tester: "P5", input: "mouse", deviceBrowser: "Desktop Chrome" }))
    ];

    const evaluation = evaluatePlaytestSessions(sessions);
    const mobileTally = evaluation.tallies.find((tally) => tally.criterion.id === "mobileReadability");

    expect(evaluation.ready).toBe(false);
    expect(mobileTally?.evaluatedSessions).toBe(0);
    expect(evaluation.issues).toContain(
      "Mobile readability holds on real device: no real phone/tablet session with touch, pen, or mixed input, Network: LAN, and a non-localhost launch URL was found."
    );
  });

  it("rejects thin mobile readability passes that do not name an artifact or readable surface", () => {
    const sessions = [
      parsePlaytestSessionNote(
        sessionNote({
          tester: "P1",
          input: "touch",
          deviceBrowser: "iPhone Safari",
          evidence: {
            "Mobile readability holds on real device": "Looked fine."
          }
        }),
        "p1.md"
      ),
      parsePlaytestSessionNote(sessionNote({ tester: "P2", input: "mouse", deviceBrowser: "Desktop Chrome" })),
      parsePlaytestSessionNote(sessionNote({ tester: "P3", input: "mouse", deviceBrowser: "Desktop Firefox" })),
      parsePlaytestSessionNote(sessionNote({ tester: "P4", input: "mouse", deviceBrowser: "Desktop Safari" })),
      parsePlaytestSessionNote(sessionNote({ tester: "P5", input: "mouse", deviceBrowser: "Desktop Chrome" }))
    ];

    const evaluation = evaluatePlaytestSessions(sessions);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      "p1.md: Mobile readability holds on real device needs concrete mobile visual evidence naming a screen artifact or readability surface."
    );
  });

  it("rejects pass, fail, or ambiguous verdicts without supporting evidence", () => {
    const sessions = [
      parsePlaytestSessionNote(
        sessionNote({
          tester: "P1",
          input: "touch",
          deviceBrowser: "iPhone Safari",
          evidence: {
            "First action completed without outside instruction": ""
          }
        }),
        "p1.md"
      ),
      parsePlaytestSessionNote(sessionNote({ tester: "P2", input: "mouse", deviceBrowser: "Desktop Chrome" })),
      parsePlaytestSessionNote(sessionNote({ tester: "P3", input: "mouse", deviceBrowser: "Desktop Firefox" })),
      parsePlaytestSessionNote(sessionNote({ tester: "P4", input: "mouse", deviceBrowser: "Desktop Safari" })),
      parsePlaytestSessionNote(
        sessionNote({
          tester: "P5",
          input: "mouse",
          deviceBrowser: "Desktop Chrome",
          results: {
            "Labor frame noticed without being told": "ambiguous"
          },
          evidence: {
            "Labor frame noticed without being told": "tbd"
          }
        }),
        "p5.md"
      )
    ];

    const evaluation = evaluatePlaytestSessions(sessions);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      "p1.md: First action completed without outside instruction is marked pass without supporting evidence."
    );
    expect(evaluation.issues).toContain(
      "p5.md: Labor frame noticed without being told is marked ambiguous without supporting evidence."
    );
  });

  it("rejects bare verdict words in the evidence column", () => {
    const sessions = [
      parsePlaytestSessionNote(
        sessionNote({
          tester: "P1",
          input: "touch",
          deviceBrowser: "Android Chrome",
          evidence: {
            "First action completed without outside instruction": "pass",
            "No systematic swipe/snap mistrust": "ok"
          }
        }),
        "p1.md"
      ),
      parsePlaytestSessionNote(sessionNote({ tester: "P2", input: "mouse", deviceBrowser: "Desktop Chrome" })),
      parsePlaytestSessionNote(
        sessionNote({
          tester: "P3",
          input: "mouse",
          deviceBrowser: "Desktop Firefox",
          evidence: {
            "Labor frame noticed without being told": "yes"
          }
        }),
        "p3.md"
      ),
      parsePlaytestSessionNote(sessionNote({ tester: "P4", input: "mouse", deviceBrowser: "Desktop Safari" })),
      parsePlaytestSessionNote(sessionNote({ tester: "P5", input: "mouse", deviceBrowser: "Desktop Chrome" }))
    ];

    const evaluation = evaluatePlaytestSessions(sessions);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      "p1.md: First action completed without outside instruction is marked pass without supporting evidence."
    );
    expect(evaluation.issues).toContain(
      "p1.md: No systematic swipe/snap mistrust is marked pass without supporting evidence."
    );
    expect(evaluation.issues).toContain(
      "p3.md: Labor frame noticed without being told is marked pass without supporting evidence."
    );
  });

  it("rejects copied-summary pass rows when required copied evidence is absent", () => {
    const sessions = Array.from({ length: 5 }, (_, index) =>
      parsePlaytestSessionNote(
        sessionNote({
          tester: `P${index + 1}`,
          input: index === 0 ? "touch" : "mouse",
          deviceBrowser: index === 0 ? "iPad Safari" : "Desktop Chrome",
          summary: `Tokenizer Training playtest summary
Run ID: not captured
Start: handoff screen
Input: touch
Input evidence: browser pointer reported touch; verify device metadata
Cuts: OK 1 / Missed 0 / False 0
Round trace: not captured
Net: +$1.00
Best saved: 1 rounds / Regex Intern`
        })
      )
    );

    const evaluation = evaluatePlaytestSessions(sessions);
    const copiedSummaryTally = evaluation.tallies.find((tally) => tally.criterion.id === "copiedSummary");

    expect(evaluation.ready).toBe(false);
    expect(copiedSummaryTally?.passed).toBe(0);
    expect(copiedSummaryTally?.issues.join("\n")).toContain("below at least 4 of 5");
  });

  it("rejects five-session evaluations with mismatched or non-handoff copied summaries", () => {
    const sessions = [
      parsePlaytestSessionNote(sessionNote({ tester: "P1", input: "touch", deviceBrowser: "iPad Safari" }), "p1.md"),
      parsePlaytestSessionNote(
        sessionNote({
          tester: "P2",
          input: "mouse",
          deviceBrowser: "Desktop Chrome",
          summary: completeSummary.replace("Start: handoff screen", "Start: direct")
        }),
        "p2.md"
      ),
      parsePlaytestSessionNote(
        sessionNote({
          tester: "P3",
          input: "mouse",
          deviceBrowser: "Desktop Firefox",
          summary: completeSummary.replace("Run ID: tt-20260606-172531z", "Run ID: tt-20260606-180000z")
        }),
        "p3.md"
      ),
      parsePlaytestSessionNote(sessionNote({ tester: "P4", input: "mouse", deviceBrowser: "Desktop Safari" }), "p4.md"),
      parsePlaytestSessionNote(sessionNote({ tester: "P5", input: "mouse", deviceBrowser: "Desktop Chrome" }), "p5.md")
    ];

    const evaluation = evaluatePlaytestSessions(sessions);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      "p2.md: copied summary is invalid (start source must be handoff screen for the first-user protocol)."
    );
    expect(evaluation.issues).toContain(
      "p3.md: copied summary is invalid (run ID does not match session metadata)."
    );
  });
});
