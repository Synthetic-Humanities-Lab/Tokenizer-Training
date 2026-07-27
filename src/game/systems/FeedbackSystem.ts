import type { RoundScoreResult } from "./ScoringSystem";
import type { TokenFixture } from "./TokenizerSystem";
import { tokenEvidenceLine } from "./TokenDisplaySystem";
import { WienerSpeechLineSystem } from "./WienerSpeechLineSystem";

export interface FeedbackSummary {
  technical: string;
  nextPredictionCue: string;
  tokenCount: number;
  tokenSplit: string;
  creditLedger: string;
  creditBreakdown: string;
  creditDelta: string;
  creditTone: CreditTone;
  audit: string;
  auditCompact: string;
  wienerSpeech: string;
}

export type CreditTone = "gain" | "loss" | "neutral";

const denseCategories = new Set(["url", "email", "filename", "code", "hashtag", "tokenizer_string"]);
const punctuationCategories = new Set(["punctuation", "internet_punctuation"]);
const symbolicCategories = new Set(["code_symbols", "symbolic"]);

export class FeedbackSystem {
  constructor(private readonly wienerSpeechLines = new WienerSpeechLineSystem()) {}

  summarize(fixture: TokenFixture, score: RoundScoreResult): FeedbackSummary {
    const technical = this.classifyIssue(fixture, score);

    const creditBreakdown =
      `VERIFIED +${score.verifiedCredits} TC   REWORK -${score.reworkCredits} TC`;
    const creditDelta = `NET ${this.formatSignedCredits(score.creditDelta)}`;

    return {
      technical,
      nextPredictionCue: this.nextPredictionCue(score),
      tokenCount: fixture.token_strings.length,
      tokenSplit: this.tokenSplitLine(fixture),
      creditLedger: `${creditBreakdown}   ${creditDelta}`,
      creditBreakdown,
      creditDelta,
      creditTone: this.creditTone(score.creditDelta),
      audit: this.auditLine(score),
      auditCompact: this.auditLine(score),
      wienerSpeech: this.pickWienerSpeechLine(score)
    };
  }

  classifyIssue(fixture: TokenFixture, score: RoundScoreResult): string {
    if (score.missedCuts.length === 0 && score.falseCuts.length === 0) {
      return "Clean segmentation.";
    }

    if (fixture.text.includes("  ")) {
      return "Whitespace boundary mishandled.";
    }

    if (fixture.category === "leading_space") {
      return "Leading-space boundary mishandled.";
    }

    if (fixture.category === "spacing") {
      return "Space-bearing token boundary mishandled.";
    }

    if (fixture.category === "multilingual") {
      return "Accent-bearing boundary mishandled.";
    }

    if (symbolicCategories.has(fixture.category)) {
      return "Symbol or operator boundary mishandled.";
    }

    if (fixture.category === "proper_noun") {
      return "Mixed label boundary mishandled.";
    }

    if (denseCategories.has(fixture.category) || fixture.text.includes("@")) {
      return "Dense string fragmentation mishandled.";
    }

    if (fixture.category === "contraction") {
      return "Contraction boundary mishandled.";
    }

    if (fixture.category === "hyphenation") {
      return "Hyphenated token boundary mishandled.";
    }

    if (fixture.category === "numbers_symbols") {
      return "Number or symbol boundary mishandled.";
    }

    if (punctuationCategories.has(fixture.category) || /[!?.,]{2,}/.test(fixture.text)) {
      return "Punctuation cluster mishandled.";
    }

    if (score.falseCuts.length > score.missedCuts.length) {
      return "Extra cuts increased rework.";
    }

    if (score.missedCuts.length > 0) {
      return "Expected boundary missed.";
    }

    return "Sequence entered in ragged form.";
  }

  nextPredictionCue(score: RoundScoreResult): string {
    if (score.missedCuts.length === 0 && score.falseCuts.length === 0) {
      return "Next: carry the confirmed route into the next prediction.";
    }

    if (score.missedCuts.length > 0 && score.falseCuts.length > 0) {
      return "Next: compare MISS and FALSE before the next prediction.";
    }

    if (score.missedCuts.length > 0) {
      return "Next: inspect each MISS before the next prediction.";
    }

    return "Next: remove unconfirmed cuts before the next prediction.";
  }

  private pickWienerSpeechLine(score: RoundScoreResult): string {
    const seed = score.correctCuts.length + score.missedCuts.length + score.falseCuts.length;
    return this.wienerSpeechLines.pickForResolve(score, { seed });
  }

  private tokenSplitLine(fixture: TokenFixture): string {
    return tokenEvidenceLine(fixture.token_strings);
  }

  private auditLine(score: RoundScoreResult): string {
    return [
      `OK ${score.correctCuts.length}`,
      `MISS ${score.missedCuts.length}`,
      `FALSE ${score.falseCuts.length}`
    ].join("          ");
  }

  private formatSignedCredits(value: number): string {
    const sign = value >= 0 ? "+" : "-";
    return `${sign}${Math.abs(Math.trunc(value))} TC`;
  }

  private creditTone(value: number): CreditTone {
    if (value > 0) {
      return "gain";
    }

    if (value < 0) {
      return "loss";
    }

    return "neutral";
  }
}
