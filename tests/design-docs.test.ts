import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import fixturesJson from "../src/game/data/fixtures.json";

function repoPath(path: string): string {
  return fileURLToPath(new URL(`../${path}`, import.meta.url));
}

function readRepoFile(path: string): string {
  return readFileSync(repoPath(path), "utf8");
}

const readingNotes = [
  {
    path: "docs/game_design_reading_notes/zubek_elements_of_game_design.md",
    title: "# Robert Zubek - Elements of Game Design",
    expectedSections: [
      "## Synoptic Note",
      "## Introduction",
      "## Chapter 1 - Elements",
      "## Chapter 2 - Player Experience",
      "## Chapter 3 - Mechanics",
      "## Chapter 4 - Systems",
      "## Chapter 5 - Gameplay",
      "## Chapter 6 - Macrostructure",
      "## Chapter 7 - Prototyping and Playtesting",
      "## Conclusion"
    ],
    minImplementationConsequences: 8
  },
  {
    path: "docs/game_design_reading_notes/swink_game_feel.md",
    title: "# Steve Swink - Game Feel",
    expectedSections: [
      "## Synoptic Note",
      "## Introduction",
      "## Chapter 1 - Defining Game Feel",
      "## Chapter 2 - Game Feel and Human Perception",
      "## Chapter 3 - The Game Feel Model of Interactivity",
      "## Chapter 4 - Mechanics of Game Feel",
      "## Chapter 5 - Beyond Intuition: Metrics for Game Feel",
      "## Chapter 6 - Input Metrics",
      "## Chapter 7 - Response Metrics",
      "## Chapter 8 - Context Metrics",
      "## Chapter 9 - Polish Metrics",
      "## Chapter 10 - Metaphor Metrics",
      "## Chapter 11 - Rules Metrics",
      "## Chapter 12 - Asteroids",
      "## Chapter 13 - Super Mario Brothers",
      "## Chapter 14 - Bionic Commando",
      "## Chapter 15 - Super Mario 64",
      "## Chapter 16 - Raptor Safari",
      "## Chapter 17 - Principles of Game Feel",
      "## Chapter 18 - Games I Want to Make",
      "## Chapter 19 - The Future of Game Feel"
    ],
    minImplementationConsequences: 20
  },
  {
    path: "docs/game_design_reading_notes/tufte_visual_display.md",
    title: "# Edward Tufte - The Visual Display of Quantitative Information",
    expectedSections: [
      "## Synoptic Note",
      "## Chapter 1 - Graphical Excellence",
      "## Chapter 2 - Graphical Integrity",
      "## Chapter 3 - Sources of Graphical Integrity and Sophistication",
      "## Chapter 4 - Data-Ink and Graphical Redesign",
      "## Chapter 5 - Chartjunk: Vibrations, Grids, and Ducks",
      "## Chapter 6 - Data-Ink Maximization and Graphical Design",
      "## Chapter 7 - Multifunctioning Graphical Elements",
      "## Chapter 8 - Data Density and Small Multiples",
      "## Chapter 9 - Aesthetics and Technique in Data Graphical Design",
      "## Epilogue - Designs for the Display of Information"
    ],
    minImplementationConsequences: 10
  },
  {
    path: "docs/game_design_reading_notes/flanagan_critical_play.md",
    title: "# Mary Flanagan - Critical Play",
    expectedSections: [
      "## Synoptic Note",
      "## Chapter 1 - Introduction to Critical Play",
      "## Chapter 2 - Playing House",
      "## Chapter 3 - Board Games",
      "## Chapter 4 - Language Games",
      "## Chapter 5 - Performative Games and Objects",
      "## Chapter 6 - Artists' Locative Games",
      "## Chapter 7 - Critical Computer Games",
      "## Chapter 8 - Designing for Critical Play"
    ],
    minImplementationConsequences: 8
  },
  {
    path: "docs/game_design_reading_notes/isbister_how_games_move_us.md",
    title: "# Katherine Isbister - How Games Move Us",
    expectedSections: [
      "## Synoptic Note",
      "## On Thinking Playfully",
      "## Introduction",
      "## Chapter 1 - A Series of Interesting Choices",
      "## Chapter 2 - Social Play",
      "## Chapter 3 - Bodies at Play",
      "## Chapter 4 - Bridging Distance to Create Intimacy and Connection",
      "## Endgame"
    ],
    minImplementationConsequences: 7
  }
] as const;

const conceptFiles = [
  "docs/game_design_concepts/01_loop_as_argument.md",
  "docs/game_design_concepts/02_text_cutting_game_feel.md",
  "docs/game_design_concepts/03_teaching_tokenization.md",
  "docs/game_design_concepts/04_economy_and_critical_play.md",
  "docs/game_design_concepts/05_emotional_design.md",
  "docs/game_design_concepts/06_visual_display.md"
] as const;

describe("reading-derived design documentation", () => {
  it("keeps synoptic and chapter-level notes for each source book", () => {
    for (const note of readingNotes) {
      const markdown = readRepoFile(note.path);

      expect(markdown).toContain(note.title);
      expect(markdown).toContain("Source PDF:");
      for (const section of note.expectedSections) {
        expect(markdown, note.path).toContain(section);
      }
      expect(markdown.match(/Implementation consequence:/g)?.length ?? 0, note.path).toBeGreaterThanOrEqual(
        note.minImplementationConsequences
      );
      for (const section of note.expectedSections.filter((section) => section.includes("## Chapter"))) {
        expect(sectionBody(markdown, section), `${note.path} ${section}`).toContain("Implementation consequence:");
      }
    }
  });

  it("keeps a manifest for every synoptic and source-section note unit", () => {
    const manifest = readRepoFile("docs/game_design_reading_notes/chapter_note_manifest.md");

    expect(manifest).toContain("# Chapter Note Manifest");
    expect(manifest).toContain("Total note units: 59");
    for (const note of readingNotes) {
      const fileName = note.path.replace("docs/game_design_reading_notes/", "");

      expect(manifest, note.path).toContain(fileName);
      for (const section of note.expectedSections) {
        const heading = section.replace(/^## /, "");

        expect(manifest, `${note.path} ${section}`).toContain(`[${heading}](${fileName}#${markdownAnchor(heading)})`);
      }
    }
  });

  it("keeps implementation-oriented concept notes tied to readings and playtest questions", () => {
    const index = readRepoFile("docs/game_design_concepts/README.md");

    for (const conceptFile of conceptFiles) {
      expect(existsSync(repoPath(conceptFile)), conceptFile).toBe(true);
      const markdown = readRepoFile(conceptFile);

      expect(index, conceptFile).toContain(conceptFile.replace("docs/game_design_concepts/", ""));
      expect(markdown, conceptFile).toContain("Draws on:");
      expect(markdown, conceptFile).toContain("## Design Claim");
      expect(markdown, conceptFile).toContain("## Implementation Guidance");
      expect(markdown, conceptFile).toContain("## Example In-Game Expression");
      expect(markdown, conceptFile).toContain("## Playtest Questions");
    }

    expect(readRepoFile("docs/game_design_concepts/04_economy_and_critical_play.md")).toContain("verified credits minus rework equals net credits");
    expect(readRepoFile("docs/game_design_concepts/05_emotional_design.md")).toContain("Review files the new Token Credit total");
    expect(readRepoFile("docs/economy_tuning_audit.md")).toContain("Near-perfect: miss one true boundary per round");
    expect(readRepoFile("docs/economy_tuning_audit.md")).toContain("verified minus rework produces net credits");
    expect(readRepoFile("docs/phase2_design_audit.md")).toContain("marks low balances as `low`");
    expect(readRepoFile("docs/design_verification_matrix.md")).toContain("low-balance and closed-window states");
    expect(readRepoFile("docs/design_verification_matrix.md")).toContain(
      "treats observation/pass-criteria contradictions as incomplete pass-criteria evidence"
    );
  });

  it("keeps playtest gates and principle categories aligned with the stated objective", () => {
    const gates = readRepoFile("docs/game_design_concepts/07_playtest_gates.md");
    const principles = readRepoFile("docs/game_design_principles.md");
    const objectiveAudit = readRepoFile("docs/objective_completion_audit.md");

    for (const gate of [
      "## Gate 1 - First Action",
      "## Gate 2 - Boundary Learning",
      "## Gate 3 - Input Trust",
      "## Gate 4 - Economy Literacy",
      "## Gate 5 - Critical Frame",
      "## Gate 6 - Visual Readability",
      "## Gate 7 - Engagement And Aesthetic Intent",
      "## Gate 8 - Numerical Token Mental Model"
    ]) {
      expect(gates).toContain(gate);
    }
    expect(gates.match(/Pass condition:/g)?.length).toBe(8);
    expect(gates.match(/Evidence to collect:/g)?.length).toBe(8);

    for (const section of [
      "## Top Game Design",
      "## Critical And Conceptual Play",
      "## Emotional Design",
      "## Game Feel",
      "## Optimal Visual Display",
      "## Current Embodiment In The Game",
      "## Remaining Design Risks"
    ]) {
      expect(principles).toContain(section);
    }

    expect(objectiveAudit).toContain("Status: not complete.");
    expect(objectiveAudit).toContain("Reading repository with book synopses and chapter-level notes");
    expect(objectiveAudit).toContain("Concept repository derived from the readings");
    expect(objectiveAudit).toContain("Principles for top design, critical/conceptual play, emotional design, game feel, and visual display");
    expect(objectiveAudit).toContain("Completed notes: 0/5");
    expect(objectiveAudit).toContain("final passing `npm run playtest:audit`");
  });

  it("keeps build hygiene represented in the verification matrix", () => {
    const matrix = readRepoFile("docs/design_verification_matrix.md");

    expect(matrix).toContain("Production build hygiene exists");
    expect(matrix).toContain("phaser-engine");
    expect(matrix).toContain("tests/build-config.test.ts");
  });

  it("separates the current surface contract from the preserved June verification record", () => {
    const matrix = readRepoFile("docs/design_verification_matrix.md");
    const currentSnapshot = sectionBody(matrix, "## Current Snapshot - 2026-07-18");
    const historicalRecord = sectionBody(matrix, "## Historical June Verification Record");

    expect(currentSnapshot).toContain("same Phaser/Vite game");
    expect(currentSnapshot).toContain("one feedback card");
    expect(currentSnapshot).toContain("one Wiener speech bubble");
    expect(currentSnapshot).toContain("are retired");
    expect(currentSnapshot).not.toContain("token strip appears");
    expect(currentSnapshot).not.toContain("tutorial robot popup");
    expect(currentSnapshot).not.toContain("compact overseer");

    expect(historicalRecord).toMatch(/historical\s+observations/);
    expect(historicalRecord).toContain("token strip");
    expect(historicalRecord).toContain("overseer");

    for (const path of [
      "docs/phase2_design_audit.md",
      "docs/browser_qa_2026-06-06.md",
      "docs/browser_qa_2026-06-07.md"
    ]) {
      const markdown = readRepoFile(path);

      expect(markdown, path).toContain("Historical provenance");
      expect(markdown, path).toContain("docs/current_surface_contract.md");
    }
  });

  it("keeps public Training vocabulary scoped to current player-facing authorities", () => {
    const surfaceContract = readRepoFile("docs/current_surface_contract.md");
    const vocabulary = sectionBody(surfaceContract, "## Public Mode Vocabulary");
    const tutorialSource = readRepoFile("src/game/systems/TutorialCompleteContentSystem.ts");
    const copyDeck = readRepoFile("docs/copy_deck.md");
    const menuSection = sectionBody(copyDeck, "## Main menu");
    const retiredMarker = "### Retired menu prose (historical reference only)";
    const retiredStart = menuSection.indexOf(retiredMarker);
    const currentMenu = menuSection.slice(0, retiredStart);
    const retiredMenu = menuSection.slice(retiredStart);
    const tutorialCompletion = sectionBody(copyDeck, "## Tutorial completion");
    const resultsCopy = sectionBody(copyDeck, "## Results copy");
    const designSpec = readRepoFile("docs/design_spec.md");
    const trainingSpec = sectionBody(designSpec, "## Training");

    expect(vocabulary).toContain("The menu action is `Training`");
    expect(vocabulary).toContain("The passed-tutorial action is `Start Training`");
    expect(vocabulary).toContain("The Results retry action is `Run Training Again`");
    expect(vocabulary).toContain("internal mode/route identifier `endless`");
    expect(surfaceContract).not.toContain("Start Endless Training");

    expect(tutorialSource).toContain('primaryAction: "Start Training"');
    expect(tutorialSource).not.toContain('primaryAction: "Start Endless Training"');
    expect(tutorialCompletion).toContain("`Start Training`");
    expect(tutorialCompletion).not.toContain("Start Endless Training");
    expect(resultsCopy).toContain("`Run Training Again`");

    expect(retiredStart).toBeGreaterThan(0);
    expect(currentMenu).toContain("- **training:** `Training`");
    expect(currentMenu).toContain("- **token_log:** `Token Log`");
    expect(currentMenu).toContain("- **settings:** `Settings`");
    expect(currentMenu).toContain("`BEST RANK` / `{rank}` / `{rounds} rounds`");
    expect(currentMenu).not.toContain("Endless Training");
    expect(retiredMenu).toContain("- **training:** `Endless Training`");
    expect(retiredMenu).toContain("- **best_label:** `Best Record`");

    expect(trainingSpec).toContain("uncapped while Token Credits");
    expect(trainingSpec).toContain("ends when the account reaches zero");
    expect(trainingSpec).toContain("internal mode/route name is `endless`");
    expect(designSpec).not.toContain("Endless Training");
    expect(readRepoFile("docs/browser_qa_2026-06-06.md")).toContain("Start Endless Training");
  });

  it("keeps active design guidance on Wiener speech and the canonical feedback card", () => {
    const loop = readRepoFile("docs/game_design_concepts/01_loop_as_argument.md");
    const display = readRepoFile("docs/game_design_concepts/06_visual_display.md");
    const principles = readRepoFile("docs/game_design_principles.md");
    const currentEmbodiment = sectionBody(principles, "## Current Embodiment In The Game");

    expect(loop).toContain("feedback-card token, economy, and cut-audit rows");
    expect(loop).toContain("Wiener provide the short instructional and social diagnosis");
    expect(display).toContain("One feedback card appears during review");
    expect(display).toContain("no separate token strip competes");
    expect(currentEmbodiment).toContain("Active and review");
    expect(currentEmbodiment).toContain("instruction stays in Wiener speech");
    expect(currentEmbodiment).toContain("1.8 seconds");
    expect(currentEmbodiment).toContain("one feedback card");
    expect(currentEmbodiment).not.toContain("token strip");
    expect(currentEmbodiment).not.toContain("overseer");
  });

  it("documents the truthful two-step Best Rank reset boundary", () => {
    const contract = readRepoFile("docs/current_surface_contract.md");
    const mobileShell = readRepoFile("docs/mobile_shell.md");
    const reset = sectionBody(contract, "## Best Rank Reset");

    expect(reset).toMatch(/first\s+activation only opens `Reset Best Rank\?`/);
    expect(reset).toContain("canonical and every legacy high-score key");
    expect(reset).toMatch(/Token Log, sample progress, Training access, Sound, and\s+Haptics remain/);
    expect(reset).toContain("does not prove");
    expect(mobileShell).toContain("settings-reset-confirm.jpg");
    expect(mobileShell).toContain("`resetPointerActivationProven` false");
  });

  it("keeps WienerWorks visual reference artifacts explicit about copy and mechanics boundaries", () => {
    const visualDirection = readRepoFile("docs/visual-reference/wienerworks_visual_direction.md");
    const laneMockup = readRepoFile("docs/visual-reference/wienerworks_gameplay_lane_mockup.md");
    const mascotSpec = readRepoFile("docs/visual-reference/wiener_mascot_spec.md");
    const soundDirection = readRepoFile("docs/visual-reference/sound_direction.md");

    expect(visualDirection).toContain("# WienerWorks Visual Direction");
    expect(visualDirection).toContain("Do not change the core game");
    expect(visualDirection).toContain("Design descriptions belong here, not in the game UI");
    expect(laneMockup).toContain("The text remains the object moving through the interface");
    expect(laneMockup).toContain("It must not come from literal industrial imagery");
    expect(mascotSpec).toContain("pixel-art hot dog assistant");
    expect(mascotSpec).toContain("Neutral");
    expect(soundDirection.replace(/\s+/g, " ")).toContain("Avoid square and sawtooth oscillators");
  });

  it("keeps current tokenizer fixture counts aligned across evidence docs", () => {
    const fixtureCount = (fixturesJson as unknown[]).length;
    const contentMatrix = readRepoFile("docs/content_matrix.md");
    const verificationMatrix = readRepoFile("docs/design_verification_matrix.md");

    expect(contentMatrix).toContain(`currently contains ${fixtureCount} \`cl100k_base\` fixtures`);
    expect(verificationMatrix).toContain(`${fixtureCount} checked-in \`cl100k_base\` fixtures`);
  });
});

function sectionBody(markdown: string, section: string): string {
  const start = markdown.indexOf(section);
  if (start < 0) {
    return "";
  }

  const bodyStart = start + section.length;
  const nextSection = markdown.slice(bodyStart).search(/\n## /);
  return nextSection < 0 ? markdown.slice(bodyStart) : markdown.slice(bodyStart, bodyStart + nextSection);
}

function markdownAnchor(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}
