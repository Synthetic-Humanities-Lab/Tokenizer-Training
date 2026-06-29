import type { RoundScoreResult } from "./ScoringSystem";
import type { TokenFixture } from "./TokenizerSystem";
import { tokenSplitLine } from "./TokenDisplaySystem";
import { WienerSpeechLineSystem } from "./WienerSpeechLineSystem";

export interface FeedbackSummary {
  technical: string;
  tokenSplit: string;
  economy: string;
  economyTone: EconomyTone;
  audit: string;
  wienerSpeech: string;
}

export interface FeedbackContext {
  balanceAfter?: number;
}

export type EconomyTone = "gain" | "loss" | "neutral";

const denseCategories = new Set(["url", "email", "filename", "code", "hashtag", "tokenizer_string"]);
const punctuationCategories = new Set(["punctuation", "internet_punctuation"]);
const symbolicCategories = new Set(["code_symbols", "symbolic"]);

export class FeedbackSystem {
  constructor(private readonly wienerSpeechLines = new WienerSpeechLineSystem()) {}

  summarize(fixture: TokenFixture, score: RoundScoreResult, context: FeedbackContext = {}): FeedbackSummary {
    return {
      technical: this.classifyIssue(fixture, score),
      tokenSplit: this.tokenSplitLine(fixture),
      economy: `Pay $${score.pay.toFixed(2)} - Cost $${score.companyCost.toFixed(2)} = Net ${this.formatSigned(score.net)}`,
      economyTone: this.economyTone(score.net),
      audit: this.auditLine(score, context),
      wienerSpeech: this.pickWienerSpeechLine(score, context)
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
      return "Over-segmentation increased token load.";
    }

    if (score.missedCuts.length > 0) {
      return "Expected boundary missed.";
    }

    return "Sequence entered in ragged form.";
  }

  private pickWienerSpeechLine(score: RoundScoreResult, context: FeedbackContext): string {
    void context;
    const seed = score.correctCuts.length + score.missedCuts.length + score.falseCuts.length;
    return this.wienerSpeechLines.pickForResolve(score, { seed });
  }

  private tokenSplitLine(fixture: TokenFixture): string {
    return tokenSplitLine(fixture.token_strings);
  }

  private auditLine(score: RoundScoreResult, context: FeedbackContext): string {
    return [
      `Boundary audit: OK ${score.correctCuts.length}`,
      `Missed ${score.missedCuts.length}`,
      `False ${score.falseCuts.length}`,
      `Tokens ${score.tokenCount}`,
      this.balanceImpactLine(context),
      `Cost drivers: ${this.costDriverLine(score)}`
    ].filter((part): part is string => part !== undefined).join(" / ");
  }

  private costDriverLine(score: RoundScoreResult): string {
    const drivers: string[] = [];
    if (score.missedCuts.length > 0) {
      drivers.push("missed");
    }

    if (score.falseCuts.length > 0) {
      drivers.push("false");
    }

    if (score.tokenCount > 5) {
      drivers.push("token load");
    }

    return drivers.length > 0 ? drivers.join(", ") : "none";
  }

  private formatSigned(value: number): string {
    const sign = value >= 0 ? "+" : "-";
    return `${sign}$${Math.abs(value).toFixed(2)}`;
  }

  private formatMoney(value: number): string {
    return `$${Math.max(0, value).toFixed(2)}`;
  }

  private balanceImpactLine(context: FeedbackContext): string | undefined {
    if (!Number.isFinite(context.balanceAfter)) {
      return undefined;
    }

    const balanceAfter = context.balanceAfter ?? 0;
    if (balanceAfter <= 0) {
      return `Balance ${this.formatMoney(balanceAfter)} closed`;
    }

    if (balanceAfter <= 10) {
      return `Balance ${this.formatMoney(balanceAfter)} low`;
    }

    return `Balance ${this.formatMoney(balanceAfter)}`;
  }

  private economyTone(value: number): EconomyTone {
    if (value > 0) {
      return "gain";
    }

    if (value < 0) {
      return "loss";
    }

    return "neutral";
  }
}
