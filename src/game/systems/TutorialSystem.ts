interface TutorialReviewReactions {
  clean: string;
  missed: string;
  false: string;
  mixed: string;
}

export interface TutorialRound {
  fixtureId: string;
  activeInstructionLine: string;
  firstCutFollowUpLine?: string;
  reviewReactions: TutorialReviewReactions;
  showSlotHints: boolean;
  showTargetHints: boolean;
}

interface TutorialReviewSpeechInput {
  correctCuts: number;
  missedCuts: number;
  falseCuts: number;
}

export const TUTORIAL_ROUND_DURATION_MS = 32000;
const TUTORIAL_TOKEN_ID_REVIEW_LINE =
  "WIENER: Falling numbers are Standard Protocol vocabulary IDs. They identify complete tokens, not points.";

const tutorialRounds: TutorialRound[] = [
  {
    fixtureId: "simple_001",
    activeInstructionLine: "Swipe orange targets. Pale guides mark every possible cut; Resolve submits.",
    firstCutFollowUpLine: "Orange means staged. Mark every target, or Clear to remove all cuts.",
    reviewReactions: {
      clean: "OK marks a correct cut. The ledger marks each intact token VERIFIED: one Token Credit. REWORK stays zero.",
      missed: "MISS joins two real tokens, invalidating both. The ledger sends both to REWORK and deducts the charge.",
      false: "FALSE splits a real token and invents an extra fragment. The ledger sends both to REWORK.",
      mixed: "MISS joins real tokens; FALSE splits another. The ledger sends damaged pieces and extra fragments to REWORK."
    },
    showSlotHints: true,
    showTargetHints: true
  },
  {
    fixtureId: "simple_002",
    activeInstructionLine: "Repeat the orange route. Resolve splits text; exact tokens fall with IDs.",
    firstCutFollowUpLine: "Finish the orange route. After Resolve, watch exact token pieces fall.",
    reviewReactions: {
      clean: TUTORIAL_TOKEN_ID_REVIEW_LINE,
      missed: TUTORIAL_TOKEN_ID_REVIEW_LINE,
      false: TUTORIAL_TOKEN_ID_REVIEW_LINE,
      mixed: TUTORIAL_TOKEN_ID_REVIEW_LINE
    },
    showSlotHints: true,
    showTargetHints: true
  },
  {
    fixtureId: "simple_010",
    activeInstructionLine: "Stage the orange route. Clear removes all cuts; Resolve sends what remains.",
    firstCutFollowUpLine: "Cuts stay provisional until Resolve. Clear removes the whole staged route.",
    reviewReactions: {
      clean: "Clean route. Resolve audited exactly the cuts you left staged.",
      missed: "A boundary remained unstaged. Clear can revise cuts; it cannot replace one you never made.",
      false: "The submitted route still held an extra cut. Revise staged marks before Resolve.",
      mixed: "The route omitted a boundary and invented another. Use Clear before Resolve."
    },
    showSlotHints: true,
    showTargetHints: true
  },
  {
    // Rename this fixture only in a dedicated fixture-migration pass.
    fixtureId: "chaos_005",
    activeInstructionLine: "The next token includes its leading space. Cut before the gap, not after it.",
    firstCutFollowUpLine: "One gap guide marks this boundary. Clear if your cut landed elsewhere.",
    reviewReactions: {
      clean: "Correct. The visible space travelled with the following token. Empty-looking data remains employed.",
      missed: "MISS: the space-bearing token still needed a boundary before the visible gap.",
      false: "FALSE: you cut after the gap, but that space belongs to the token that follows it.",
      mixed: "The true boundary was before the gap; a second cut after it split one token in two."
    },
    showSlotHints: true,
    showTargetHints: true
  },
  {
    fixtureId: "punct_002",
    activeInstructionLine: "Orange answers are gone. 're-enter' looks whole, but it may split.",
    firstCutFollowUpLine: "Every pale guide accepts a cut. Use earlier evidence, then Resolve.",
    reviewReactions: {
      clean: "Correct. 're-enter' looks like one expression and resolves as two learned chunks.",
      missed: "The hyphenated expression concealed a token boundary. Readability did not remove it.",
      false: "You added a cut outside the learned chunks. Tokens are not arbitrary word fragments.",
      mixed: "The expression hid one real split while your route added another. Readability remains unreliable."
    },
    showSlotHints: true,
    showTargetHints: false
  },
  {
    fixtureId: "punct_001",
    activeInstructionLine: "Apostrophes do not define tokens. Find the learned contraction chunks.",
    firstCutFollowUpLine: "Check the apostrophe and final period; either may sit beside a boundary.",
    reviewReactions: {
      clean: "The contraction and final mark followed merge history. Grammar has been overruled.",
      missed: "A learned boundary inside the contraction or at the period remained unmarked.",
      false: "Your extra cut followed grammar or rhythm, not the standard's learned chunks.",
      mixed: "You missed a learned boundary and added another. The apostrophe declines responsibility."
    },
    showSlotHints: true,
    showTargetHints: false
  },
  {
    fixtureId: "punct_004",
    activeInstructionLine: "Punctuation can be a complete token. Inspect the ellipsis and question mark.",
    firstCutFollowUpLine: "Some marks stay together; others separate. Stage the route, then Resolve.",
    reviewReactions: {
      clean: "The punctuation cluster matched the standard. Tiny marks retain full administrative status.",
      missed: "A punctuation boundary was missed. Small marks are structure, not scenery.",
      false: "The route invented a split inside a learned punctuation chunk.",
      mixed: "One punctuation boundary escaped while another was invented. The marks remain blameless."
    },
    showSlotHints: true,
    showTargetHints: false
  },
  {
    fixtureId: "dense_001",
    activeInstructionLine: "URLs reuse learned fragments. Look around letters, dots, and slashes.",
    firstCutFollowUpLine: "Punctuation may stay attached to letters. Cut learned chunks, not symbols.",
    reviewReactions: {
      clean: "The URL resolved into learned fragments. Infrastructure briefly became legible.",
      missed: "A reusable URL fragment remained joined to its neighbour.",
      false: "You divided a learned URL fragment. Slashes are clues, not universal orders.",
      mixed: "The URL lost one real boundary and gained an imaginary one. Infrastructure continues billing."
    },
    showSlotHints: true,
    showTargetHints: false
  },
  {
    fixtureId: "punct_003",
    activeInstructionLine: "Prices are learned fragments too. Currency and decimal notation may split.",
    firstCutFollowUpLine: "The dollar sign, digit groups, and decimal point may begin or end chunks.",
    reviewReactions: {
      clean: "Currency, digits, and decimals followed the learned route. Accounting approves the coincidence.",
      missed: "A number or symbol boundary remained hidden inside the price.",
      false: "You added a split the standard does not make. Arithmetic notation is not token law.",
      mixed: "The price concealed one boundary while your route supplied another. The protocol calls both rework."
    },
    showSlotHints: true,
    showTargetHints: false
  },
  {
    fixtureId: "simple_014",
    activeInstructionLine: "Final sample. Submit the route you would trust without orange answers.",
    firstCutFollowUpLine: "Resolve when ready. The full ten-round audit decides access to Training.",
    reviewReactions: {
      clean: "The final sample is clean. Qualification still depends on the full tutorial audit.",
      missed: "The final sample missed a boundary. Qualification still depends on the full audit.",
      false: "The final sample added a false cut. Qualification still depends on the full audit.",
      mixed: "The final sample mixed missed and false cuts. Qualification still depends on the full audit."
    },
    showSlotHints: true,
    showTargetHints: false
  }
];

export const TUTORIAL_ROUND_COUNT = tutorialRounds.length;

export class TutorialSystem {
  byIndex(index: number): TutorialRound | undefined {
    return tutorialRounds[index];
  }

  count(): number {
    return TUTORIAL_ROUND_COUNT;
  }

  isCompleteAfter(completedRound: number): boolean {
    return completedRound >= tutorialRounds.length;
  }

  activePromptFor(index: number): string {
    const round = this.byIndex(index);
    if (!round) {
      return "TUTORIAL RECORD MISSING - Predict anyway. Wiener logged a defect.";
    }

    return `TUTORIAL ${index + 1}/${this.count()} - ${round.activeInstructionLine}`;
  }

  firstCutFollowUpFor(index: number): string | undefined {
    return this.byIndex(index)?.firstCutFollowUpLine;
  }

  reviewSpeechFor(index: number, input: TutorialReviewSpeechInput): string {
    const round = this.byIndex(index);
    if (!round) {
      return "WIENER: Tutorial record unavailable. Use the visible tokenizer evidence.";
    }

    const missedCuts = safeCutCount(input.missedCuts);
    const falseCuts = safeCutCount(input.falseCuts);
    const template = missedCuts > 0 && falseCuts > 0
      ? round.reviewReactions.mixed
      : missedCuts > 0
        ? round.reviewReactions.missed
        : falseCuts > 0
          ? round.reviewReactions.false
          : round.reviewReactions.clean;

    return formatTutorialReviewLine(template, input);
  }
}

function safeCutCount(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}

function formatTutorialReviewLine(template: string, input: TutorialReviewSpeechInput): string {
  const line = template
    .replaceAll("{correct}", String(safeCutCount(input.correctCuts)))
    .replaceAll("{missed}", String(safeCutCount(input.missedCuts)))
    .replaceAll("{false}", String(safeCutCount(input.falseCuts)));

  return line.startsWith("WIENER:") ? line : `WIENER: ${line}`;
}
