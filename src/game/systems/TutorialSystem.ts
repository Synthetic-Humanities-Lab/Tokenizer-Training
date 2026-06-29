export interface TutorialScript {
  promptIntroLine: string;
  activeInstructionLine: string;
  teachingExplanations: {
    mechanics: string;
    byteRoute: string;
    tokenIds: string;
    workRule: string;
    followup: string;
  };
  stageInstructionLines: {
    mechanics: string;
    byteRoute: string;
    tokenIds: string;
    workRule: string;
    followup: string;
  };
  reviewExplanation: string;
  reviewLine: string;
  reviewReactions: {
    pass: string;
    mixed: string;
    fail: string;
  };
}

interface TutorialRoundRecord {
  fixtureId: string;
  exampleText: string;
  title: string;
  teachingPoint: string;
  explanation: string;
  promptIntroLine: string;
  mechanicsExplanation: string;
  byteRouteExplanation: string;
  tokenIdExplanation: string;
  workRuleExplanation: string;
  followupExplanation: string;
  reviewExplanation: string;
  activeLine: string;
  mechanicsLine: string;
  byteLine: string;
  tokenIdLine: string;
  ruleLine: string;
  followupLine: string;
  resolveLine: string;
  resolveGoodLine: string;
  resolveMixedLine: string;
  resolveBadLine: string;
  showSlotHints: boolean;
  showTargetHints: boolean;
  instructionWindowMs: number;
}

export interface TutorialRound {
  fixtureId: string;
  exampleText: string;
  title: string;
  teachingPoint: string;
  explanation: string;
  script: TutorialScript;
  showSlotHints: boolean;
  showTargetHints: boolean;
  instructionWindowMs: number;
}

export interface TutorialReviewSpeechInput {
  correctCuts: number;
  missedCuts: number;
  falseCuts: number;
}

export const TUTORIAL_ROUND_DURATION_MS = 32000;

const tutorialRoundRecords: TutorialRoundRecord[] = [
  {
    fixtureId: "simple_001",
    exampleText: "the cat sat on the mat",
    title: "Slot guides",
    teachingPoint: "Learn legal cut positions before guessing token boundaries.",
    explanation: "Pale guides are legal slots. Orange targets show this worked route.",
    promptIntroLine:
      "WIENER: Ordinary words are a courtesy layer. Pale guides show legal tokenizer slots. Orange targets show this worked route. Swipe them, then Resolve.",
    mechanicsExplanation:
      "WIENER: Legal slots are the only places a token cut can land. Orange targets are examples for this first route.",
    byteRouteExplanation:
      "WIENER: Text becomes bytes, then token chunks. Your cuts predict chunk edges before the model receives token IDs.",
    tokenIdExplanation:
      "WIENER: The token strip shows chunks and token IDs sent forward. Words are visible packaging, not binding policy.",
    workRuleExplanation:
      "WIENER: Work rule: cut learned tokenizer boundaries. Resolve submits staged token cuts; Clear removes them first.",
    followupExplanation:
      "WIENER: Common words split cleanly here. That is a courtesy example, not a promise from the tokenizer.",
    reviewExplanation:
      "WIENER: Review marks the useful cuts. Common words split neatly here; the tokenizer has made no vow.",
    activeLine: "Swipe targets; pale guides mark slots; Resolve submits.",
    mechanicsLine: "Legal slots are possible token cuts. Orange targets are this worked route.",
    byteLine: "Bytes become token chunks. Mark the chunk edges.",
    tokenIdLine: "The model sees token IDs. Your cuts predict the chunks.",
    ruleLine: "Resolve submits staged cuts. Clear removes them before review.",
    followupLine: "The token strip will show the chunks the tokenizer produced.",
    resolveLine: "Review marks the useful cuts. Neat prose remains only a courtesy.",
    resolveGoodLine: "Clean start. The review marked useful cuts without extra ceremony.",
    resolveMixedLine: "The review separated missed boundaries from false cuts. Use the labels, not optimism.",
    resolveBadLine: "The review showed tokenizer edges you did not mark. Familiar words are not protection.",
    showSlotHints: true,
    showTargetHints: true,
    instructionWindowMs: 5200
  },
  {
    fixtureId: "simple_002",
    exampleText: "how many dogs are there",
    title: "Review labels",
    teachingPoint: "Connect staged cuts to OK, MISS, FALSE, and the token strip.",
    explanation: "The review is evidence, not encouragement.",
    promptIntroLine:
      "WIENER: This route teaches the review. OK means a useful token edge. MISS means a real edge was skipped. FALSE means an invented edge.",
    mechanicsExplanation:
      "WIENER: Stage the orange token cuts, then Resolve. The review separates correct cuts, missed edges, and false cuts.",
    byteRouteExplanation:
      "WIENER: Byte chunks become token IDs after the boundary choices. The review shows where your visible cuts matched the chunk route.",
    tokenIdExplanation:
      "WIENER: Token IDs are not displayed as praise. The strip shows what the model receives after tokenizer boundaries are fixed.",
    workRuleExplanation:
      "WIENER: Work rule: read OK, MISS, and FALSE as token audit labels. They are not mood stickers for the worker.",
    followupExplanation:
      "WIENER: The token strip is the receipt. If a word has a leading space, the strip keeps that chunk attached.",
    reviewExplanation:
      "WIENER: Review labels are the evidence layer. OK, MISS, and FALSE explain the cost before opinion enters.",
    activeLine: "Swipe targets; Resolve shows OK, MISS, FALSE, and strip.",
    mechanicsLine: "Review labels compare staged token cuts with true chunk edges.",
    byteLine: "Byte chunks become token IDs after boundaries are fixed.",
    tokenIdLine: "The token strip shows what the model receives.",
    ruleLine: "OK, MISS, and FALSE are audit labels, not encouragement.",
    followupLine: "Use the strip as evidence before trusting the sentence.",
    resolveLine: "Review labels are evidence. The token strip is the receipt.",
    resolveGoodLine: "The review stayed clean. Evidence and confidence happened to agree.",
    resolveMixedLine: "The labels split the damage cleanly. That is their one kindness.",
    resolveBadLine: "The review disagreed with the sentence you thought you saw.",
    showSlotHints: true,
    showTargetHints: true,
    instructionWindowMs: 5400
  },
  {
    fixtureId: "simple_010",
    exampleText: "draw the boundary line",
    title: "Clear before Resolve",
    teachingPoint: "Learn that staged cuts are reversible until review.",
    explanation: "Clear removes staged cuts. Resolve commits them to the audit.",
    promptIntroLine:
      "WIENER: Cuts are staged until Resolve. Clear removes staged token cuts before they enter review. Use it before pretending certainty.",
    mechanicsExplanation:
      "WIENER: Mechanics: swipe across legal slots to stage cuts. Clear wipes staged cuts; Resolve commits the remaining token guesses.",
    byteRouteExplanation:
      "WIENER: Bytes do not care about your hesitation. The tokenizer route stays fixed while you revise staged cuts.",
    tokenIdExplanation:
      "WIENER: Token IDs are assigned after chunking. Clear changes only your staged prediction, not the tokenizer truth.",
    workRuleExplanation:
      "WIENER: Work rule: Clear is for correcting staged token cuts before Resolve. After review, the record is closed.",
    followupExplanation:
      "WIENER: Reversibility ends at Resolve. Token guesses remain editable only while they are staged cuts.",
    reviewExplanation:
      "WIENER: The review only sees the cuts left on the strip. Clear is useful precisely because it leaves no testimony.",
    activeLine: "Stage cuts; Clear removes them before Resolve records.",
    mechanicsLine: "Swipe slots to stage cuts. Clear wipes them before review.",
    byteLine: "The tokenizer route stays fixed while you revise staged cuts.",
    tokenIdLine: "Clear changes your prediction, not the token IDs.",
    ruleLine: "Before Resolve, staged cuts can still be removed.",
    followupLine: "After Resolve, the review records what remained.",
    resolveLine: "The review saw only the cuts left on the strip.",
    resolveGoodLine: "Clean commit. The review received exactly the staged route it needed.",
    resolveMixedLine: "Some staged cuts survived review. Others entered the audit as damage.",
    resolveBadLine: "Resolve recorded the wrong route. Clear existed before that happened.",
    showSlotHints: true,
    showTargetHints: true,
    instructionWindowMs: 5400
  },
  {
    // TODO: Rename this fixture to a clearer spacing_* id only in a dedicated fixture-migration pass.
    fixtureId: "chaos_005",
    exampleText: "spaces matter",
    title: "Spaces attach",
    teachingPoint: "A visible gap can belong to the token that follows it.",
    explanation: "Cut the boundary before the gap; do not add a second cut after it.",
    promptIntroLine:
      "WIENER: The visible gap can belong to the next token chunk. This route has one target before the gap, not another cut after it.",
    mechanicsExplanation:
      "WIENER: A leading-space token is one chunk. The displayed target is the decision point; a second cut after the gap invents structure.",
    byteRouteExplanation:
      "WIENER: A leading space is a byte pattern that can merge with the next word. Empty-looking text still has tokenizer structure.",
    tokenIdExplanation:
      "WIENER: A token may begin with a space and still count as one token ID. The strip shows the chunk as a unit.",
    workRuleExplanation:
      "WIENER: Work rule: follow the chunk boundary. A visible gap is not permission to add a second token cut.",
    followupExplanation:
      "WIENER: The token strip can show a leading-space chunk as one unit. This is tokenizer policy, not etiquette.",
    reviewExplanation:
      "WIENER: The leading-space chunk was logged as one unit. The visible gap belonged with the next token.",
    activeLine: "One target; cut before the gap, not after it.",
    mechanicsLine: "A leading-space token is one chunk, not two.",
    byteLine: "Leading-space bytes can travel with the next word.",
    tokenIdLine: "A leading-space chunk still becomes one token ID.",
    ruleLine: "Follow the chunk boundary; do not add a second cut.",
    followupLine: "The strip can show the visible gap attached to the next chunk.",
    resolveLine: "The leading-space chunk was logged as one unit.",
    resolveGoodLine: "One boundary was enough. The visible gap stayed with the next chunk.",
    resolveMixedLine: "The visible gap belonged with the next token. Extra cuts created noise.",
    resolveBadLine: "The leading-space chunk was mishandled. The review kept the evidence.",
    showSlotHints: true,
    showTargetHints: true,
    instructionWindowMs: 5600
  },
  {
    fixtureId: "simple_007",
    exampleText: "tokens hide in plain sight",
    title: "Words versus tokens",
    teachingPoint: "Separate readable words from tokenizer chunks.",
    explanation: "The strip shows chunks; leading spaces often ride with the next chunk.",
    promptIntroLine:
      "WIENER: Orange answers are gone. Read the pale legal slots, then compare against the token strip. Words are packaging.",
    mechanicsExplanation:
      "WIENER: Mechanics: a readable word can be a token chunk, part of one, or several. The tokenizer decides from learned patterns.",
    byteRouteExplanation:
      "WIENER: Byte patterns become chunks through merge history. Familiar word spacing can still produce leading-space tokens.",
    tokenIdExplanation:
      "WIENER: Token IDs follow chunks, not your mental word count. The strip is a better witness than the sentence.",
    workRuleExplanation:
      "WIENER: Work rule: with targets removed, use pale legal slots and the prompt text to infer tokenizer chunk edges.",
    followupExplanation:
      "WIENER: Leading spaces often travel inside the following chunk. The token strip will show the attachment after review.",
    reviewExplanation:
      "WIENER: The strip showed chunks, not words. Human readability remains a poor contract.",
    activeLine: "No orange answers; use pale guides and token strip.",
    mechanicsLine: "Readable words and token chunks are different systems.",
    byteLine: "Merge history can attach spaces to following chunks.",
    tokenIdLine: "Token IDs follow chunks, not your word count.",
    ruleLine: "Use pale legal slots to infer learned chunk edges.",
    followupLine: "The token strip will expose where words and chunks disagreed.",
    resolveLine: "The strip showed chunks, not words. Human readability is not a contract.",
    resolveGoodLine: "You treated the sentence as chunks, not just words. That was the assignment.",
    resolveMixedLine: "Some chunks were found through the prose. Others stayed hidden in plain sight.",
    resolveBadLine: "The words looked cooperative. The tokenizer was operating a different contract.",
    showSlotHints: true,
    showTargetHints: false,
    instructionWindowMs: 5400
  },
  {
    fixtureId: "punct_001",
    exampleText: "I can't believe it.",
    title: "Contractions",
    teachingPoint: "Apostrophes and final marks may split away from trusted words.",
    explanation: "Grammar is a bystander; merge history chooses the chunks.",
    promptIntroLine:
      "WIENER: Contractions are not protected by grammar. Apostrophes, word pieces, and final punctuation follow tokenizer merge history.",
    mechanicsExplanation:
      "WIENER: BPE-style tokenizers merge frequent byte patterns. Apostrophes and periods obey that route, not classroom grammar.",
    byteRouteExplanation:
      "WIENER: BPE rewards frequent byte pairs. Apostrophes and periods split when history made that route cheaper.",
    tokenIdExplanation:
      "WIENER: Punctuation splits mean extra token IDs, not extra meaning. The model receives chunks where you expected one word.",
    workRuleExplanation:
      "WIENER: Work rule: pale slots are legal token cuts. Your staged marks are guesses against merge history.",
    followupExplanation:
      "WIENER: Punctuation can become its own token when the merge table made that cheaper. Small marks have departments.",
    reviewExplanation:
      "WIENER: The apostrophe and period followed merge history, not classroom grammar.",
    activeLine: "Contractions split; watch apostrophe and final period.",
    mechanicsLine: "BPE merges frequent byte patterns. Grammar is advisory.",
    byteLine: "Apostrophes and periods split when merge history says so.",
    tokenIdLine: "A punctuation split is another token ID.",
    ruleLine: "Stage guesses on legal slots; grammar will not defend them.",
    followupLine: "Small marks can become separate tokenizer chunks.",
    resolveLine: "The apostrophe and period followed merge history, not classroom grammar.",
    resolveGoodLine: "Punctuation followed merge history, not classroom grammar. Accurate, irritating, recorded.",
    resolveMixedLine: "Punctuation has a department. Your cuts met only part of it.",
    resolveBadLine: "Punctuation received its own paperwork. The model does not owe you a word.",
    showSlotHints: true,
    showTargetHints: false,
    instructionWindowMs: 5400
  },
  {
    fixtureId: "punct_004",
    exampleText: "wait... what?",
    title: "Punctuation clusters",
    teachingPoint: "Punctuation clusters can become their own chunks.",
    explanation: "Ellipses and question marks are small, but still billable.",
    promptIntroLine:
      "WIENER: Punctuation clusters are not decoration to the tokenizer. Ellipses and question marks can become separate chunks.",
    mechanicsExplanation:
      "WIENER: Mechanics: punctuation slots behave like token boundaries when merge history made a separate chunk cheaper.",
    byteRouteExplanation:
      "WIENER: Repeated punctuation has byte patterns. Those patterns can merge together or split away from nearby words.",
    tokenIdExplanation:
      "WIENER: When punctuation becomes a chunk, it receives a token ID. Tiny marks still become model work.",
    workRuleExplanation:
      "WIENER: Work rule: inspect punctuation as possible token chunks. Do not let small marks pass as scenery.",
    followupExplanation:
      "WIENER: Punctuation clusters often look like expressive typing. The tokenizer reads cheaper chunk routes instead.",
    reviewExplanation:
      "WIENER: The punctuation cluster did not stay decorative. The tokenizer gave it structure.",
    activeLine: "Punctuation splits; ellipses, question marks count.",
    mechanicsLine: "Punctuation slots can become true token boundaries.",
    byteLine: "Repeated punctuation creates byte patterns the tokenizer can merge.",
    tokenIdLine: "Tiny punctuation chunks still receive token IDs.",
    ruleLine: "Treat punctuation as structure, not scenery.",
    followupLine: "Expressive typing still becomes tokenizer accounting.",
    resolveLine: "The punctuation cluster did not stay decorative.",
    resolveGoodLine: "The small marks were handled as structure. Bureaucracy occasionally notices detail.",
    resolveMixedLine: "Some punctuation became structure before your cuts caught up.",
    resolveBadLine: "You let punctuation pass as scenery. The tokenizer did not.",
    showSlotHints: true,
    showTargetHints: false,
    instructionWindowMs: 5400
  },
  {
    fixtureId: "dense_001",
    exampleText: "openai.com/pricing",
    title: "Dense strings",
    teachingPoint: "URLs and code-like strings fracture quickly.",
    explanation: "Dots, slashes, and leftovers become billable fragments.",
    promptIntroLine:
      "WIENER: A URL is not one object to the tokenizer. It is fragments, dots, slashes, awkward joins, and leftovers.",
    mechanicsExplanation:
      "WIENER: Mechanics: dense strings mix repeated token chunks with rare joins. Separators are likely borders.",
    byteRouteExplanation:
      "WIENER: URL bytes fracture around dots, slashes, domain pieces, and suffixes before token chunks are logged.",
    tokenIdExplanation:
      "WIENER: Dense strings can become compact runs of short token IDs. Each fragment still bills as model work.",
    workRuleExplanation:
      "WIENER: Work rule: cut token fragments, not the idea of a website. The URL is not one chunk.",
    followupExplanation:
      "WIENER: Dense strings punish confidence bought at sentence prices. Token chunks do the billing.",
    reviewExplanation:
      "WIENER: The URL split into chunks. Infrastructure hid this until finance asked.",
    activeLine: "URLs fragment; dots and slashes can be boundaries.",
    mechanicsLine: "Dense strings mix common fragments with awkward joins.",
    byteLine: "URL bytes fracture around dots, slashes, domains, and suffixes.",
    tokenIdLine: "Dense strings become compact runs of short token IDs.",
    ruleLine: "Cut fragments. The URL is not one tokenizer object.",
    followupLine: "Dense strings punish sentence-priced confidence.",
    resolveLine: "The URL split into chunks. Infrastructure hid this; finance stopped paying.",
    resolveGoodLine: "The URL split into chunks. Infrastructure hid this, briefly.",
    resolveMixedLine: "The URL was not one object. It was a committee with slashes.",
    resolveBadLine: "You treated infrastructure like prose. It billed you for the courtesy.",
    showSlotHints: true,
    showTargetHints: false,
    instructionWindowMs: 5400
  },
  {
    fixtureId: "punct_003",
    exampleText: "it costs $19.99",
    title: "Numbers and symbols",
    teachingPoint: "Currency and decimals can split into small chunks.",
    explanation: "Small marks can still become model work.",
    promptIntroLine:
      "WIENER: Currency and decimals are compact, not simple. Dollar signs, number pieces, and decimal points can split.",
    mechanicsExplanation:
      "WIENER: Mechanics: numeric text mixes symbols and digits. Token boundaries often appear where reading still feels continuous.",
    byteRouteExplanation:
      "WIENER: Symbols and decimal fragments may become separate token chunks, which is how small text becomes cost.",
    tokenIdExplanation:
      "WIENER: More token IDs mean more model work. Correct chunk edges predict the bill before it reaches balance.",
    workRuleExplanation:
      "WIENER: Work rule: inspect currency and decimal marks as possible token chunks, not as harmless formatting.",
    followupExplanation:
      "WIENER: Technical note: dollars and decimals are small token clerks. Their chunks still bill.",
    reviewExplanation:
      "WIENER: Currency and decimals were small, separate chunks. Compact text is not the same as cheap text.",
    activeLine: "Currency and decimals split; use the pale guides.",
    mechanicsLine: "Numeric text can split where reading feels continuous.",
    byteLine: "Symbols and decimal fragments may become token chunks.",
    tokenIdLine: "More token IDs mean more model work.",
    ruleLine: "Treat currency and decimal marks as possible chunks.",
    followupLine: "Compact text is not the same as cheap text.",
    resolveLine: "Currency and decimals were small, separate chunks.",
    resolveGoodLine: "Currency and decimals were handled cleanly. Accounting has noticed.",
    resolveMixedLine: "The math string survived semantically and failed financially.",
    resolveBadLine: "Currency and decimals are small, expensive clerks.",
    showSlotHints: true,
    showTargetHints: false,
    instructionWindowMs: 5400
  },
  {
    fixtureId: "simple_014",
    exampleText: "pay cost and balance",
    title: "Economy and timer",
    teachingPoint: "Connect boundary accuracy to pay, cost, net, balance, and time.",
    explanation: "Pay minus company cost becomes net. Zero balance ends the shift.",
    promptIntroLine:
      "WIENER: Final route. Correct token cuts earn pay. Missed boundaries and false cuts create company cost. The timer keeps working.",
    mechanicsExplanation:
      "WIENER: Mechanics: token boundaries drive pay and company cost. Pay minus cost changes your remaining balance.",
    byteRouteExplanation:
      "WIENER: Even plain words become bytes, chunks, and token IDs. The economy only sees the boundary result.",
    tokenIdExplanation:
      "WIENER: Token IDs are model work. Better boundary predictions keep the bill from eating the balance.",
    workRuleExplanation:
      "WIENER: Work rule: the timer is active. Resolve submits token cuts; expiry resolves hesitation.",
    followupExplanation:
      "WIENER: The tutorial ends after this token audit. Endless Training keeps the same rules and removes the courtesy route.",
    reviewExplanation:
      "WIENER: Accounting is the lesson. Pay minus company cost becomes net, and net changes your balance.",
    activeLine: "Final route; correct cuts pay, mistakes create cost.",
    mechanicsLine: "Pay minus company cost becomes net. Net changes balance.",
    byteLine: "Plain words still become bytes, chunks, and token IDs.",
    tokenIdLine: "Better boundary guesses keep the bill from eating balance.",
    ruleLine: "Timer active. Resolve submits cuts; expiry resolves hesitation.",
    followupLine: "Endless Training keeps the rules and removes courtesy.",
    resolveLine: "Pay minus company cost becomes net, and net changes balance.",
    resolveGoodLine: "Accounting is the lesson. Net changes balance; balance ends shifts.",
    resolveMixedLine: "The route was readable. The balance only respects boundary evidence.",
    resolveBadLine: "The timer, balance, and review have all entered the record.",
    showSlotHints: true,
    showTargetHints: false,
    instructionWindowMs: 5600
  }
];

export const tutorialRounds: TutorialRound[] = tutorialRoundRecords.map((record) => ({
  fixtureId: record.fixtureId,
  exampleText: record.exampleText,
  title: record.title,
  teachingPoint: record.teachingPoint,
  explanation: record.explanation,
  script: {
    promptIntroLine: record.promptIntroLine,
    activeInstructionLine: record.activeLine,
    teachingExplanations: {
      mechanics: record.mechanicsExplanation,
      byteRoute: record.byteRouteExplanation,
      tokenIds: record.tokenIdExplanation,
      workRule: record.workRuleExplanation,
      followup: record.followupExplanation
    },
    stageInstructionLines: {
      mechanics: record.mechanicsLine,
      byteRoute: record.byteLine,
      tokenIds: record.tokenIdLine,
      workRule: record.ruleLine,
      followup: record.followupLine
    },
    reviewExplanation: record.reviewExplanation,
    reviewLine: record.resolveLine,
    reviewReactions: {
      pass: record.resolveGoodLine,
      mixed: record.resolveMixedLine,
      fail: record.resolveBadLine
    }
  },
  showSlotHints: record.showSlotHints,
  showTargetHints: record.showTargetHints,
  instructionWindowMs: record.instructionWindowMs
}));

const TUTORIAL_COMPLETION_LINE = "Tutorial cleared. Endless Training opens with live cost exposure.";

export function compactTutorialSpeechTitle(title: string): string {
  return title.replace(/:\s+.+$/, "");
}

export class TutorialSystem {
  all(): TutorialRound[] {
    return [...tutorialRounds];
  }

  byIndex(index: number): TutorialRound | undefined {
    return tutorialRounds[index];
  }

  count(): number {
    return tutorialRounds.length;
  }

  isCompleteAfter(completedRound: number): boolean {
    return completedRound >= tutorialRounds.length;
  }

  completionLine(): string {
    return TUTORIAL_COMPLETION_LINE;
  }

  activePromptFor(index: number): string {
    const round = this.byIndex(index);
    if (!round) {
      return "TUTORIAL RECORD MISSING - Predict anyway. Wiener logged a defect.";
    }

    return `TUTORIAL ${index + 1}/${this.count()} - ${round.script.activeInstructionLine}`;
  }

  introPromptFor(index: number): string {
    const round = this.byIndex(index);
    if (!round) {
      return "TUTORIAL RECORD MISSING - Training explanation unavailable.";
    }

    return `TUTORIAL ${index + 1}/${this.count()} - ${round.title}: ${round.teachingPoint} ${round.explanation}`;
  }

  introSpeechFor(index: number): { title: string; body: string } {
    const round = this.byIndex(index);
    if (!round) {
      return {
        title: "WIENER - TUTORIAL RECORD MISSING",
        body: "The instruction window failed. Continue predicting tokenizer boundaries while the defect is archived."
      };
    }

    return {
      title: `WIENER - TUTORIAL ${index + 1}/${this.count()}: ${round.title}`,
      body: round.script.promptIntroLine
    };
  }

  reviewExplanationFor(index: number): { title: string; body: string } {
    const round = this.byIndex(index);
    if (!round) {
      return {
        title: "WIENER - REVIEW RECORD MISSING",
        body: "The review window failed. Wiener has preserved the audit trail elsewhere."
      };
    }

    return {
      title: `WIENER - REVIEW ${index + 1}/${this.count()}`,
      body: round.script.reviewExplanation
    };
  }

  followupExplanationFor(index: number): { title: string; body: string } {
    const round = this.byIndex(index);
    if (!round) {
      return {
        title: "WIENER - TECHNICAL RECORD MISSING",
        body: "The technical note failed. Continue predicting learned tokenizer chunks while the defect is archived."
      };
    }

    return {
      title: `WIENER - TECH NOTE ${index + 1}/${this.count()}`,
      body: round.script.teachingExplanations.followup
    };
  }

  byteRouteExplanationFor(index: number): { title: string; body: string } {
    const round = this.byIndex(index);
    if (!round) {
      return {
        title: "WIENER - BYTE RECORD MISSING",
        body: "The byte-route note failed. Continue marking tokenizer chunk edges while the defect is archived."
      };
    }

    return {
      title: `WIENER - BYTE ROUTE ${index + 1}/${this.count()}`,
      body: round.script.teachingExplanations.byteRoute
    };
  }

  mechanicsExplanationFor(index: number): { title: string; body: string } {
    const round = this.byIndex(index);
    if (!round) {
      return {
        title: "WIENER - MECHANICS RECORD MISSING",
        body: "The mechanics note failed. Continue marking tokenizer chunk edges while the defect is archived."
      };
    }

    return {
      title: `WIENER - MECHANICS ${index + 1}/${this.count()}`,
      body: round.script.teachingExplanations.mechanics
    };
  }

  workRuleExplanationFor(index: number): { title: string; body: string } {
    const round = this.byIndex(index);
    if (!round) {
      return {
        title: "WIENER - WORK RULE MISSING",
        body: "The work-rule note failed. Continue marking tokenizer chunk edges while the defect is archived."
      };
    }

    return {
      title: `WIENER - WORK RULE ${index + 1}/${this.count()}`,
      body: round.script.teachingExplanations.workRule
    };
  }

  tokenIdExplanationFor(index: number): { title: string; body: string } {
    const round = this.byIndex(index);
    if (!round) {
      return {
        title: "WIENER - TOKEN ID RECORD MISSING",
        body: "The token-ID note failed. Continue marking learned tokenizer chunk edges while the defect is archived."
      };
    }

    return {
      title: `WIENER - TOKEN IDS ${index + 1}/${this.count()}`,
      body: round.script.teachingExplanations.tokenIds
    };
  }

  introSpeechWindowMs(): number {
    return 4300;
  }

  mechanicsSpeechWindowMs(): number {
    return 4600;
  }

  byteRouteSpeechWindowMs(): number {
    return 4300;
  }

  tokenIdSpeechWindowMs(): number {
    return 4100;
  }

  workRuleSpeechWindowMs(): number {
    return 4300;
  }

  followupSpeechWindowMs(): number {
    return 4600;
  }

  mechanicsPromptFor(index: number): string {
    const round = this.byIndex(index);
    if (!round) {
      return "Mechanics note unavailable. Continue marking tokenizer chunk edges.";
    }

    return `TUTORIAL ${index + 1}/${this.count()} - ${round.script.stageInstructionLines.mechanics}`;
  }

  followupPromptFor(index: number): string {
    const round = this.byIndex(index);
    if (!round) {
      return "Technical note unavailable. Continue predicting learned tokenizer chunks.";
    }

    return `TUTORIAL ${index + 1}/${this.count()} - ${round.script.stageInstructionLines.followup}`;
  }

  bytePromptFor(index: number): string {
    const round = this.byIndex(index);
    if (!round) {
      return "Byte-route note unavailable. Continue predicting learned tokenizer chunks.";
    }

    return `TUTORIAL ${index + 1}/${this.count()} - ${round.script.stageInstructionLines.byteRoute}`;
  }

  tokenIdPromptFor(index: number): string {
    const round = this.byIndex(index);
    if (!round) {
      return "Token-ID note unavailable. Continue predicting learned tokenizer chunks.";
    }

    return `TUTORIAL ${index + 1}/${this.count()} - ${round.script.stageInstructionLines.tokenIds}`;
  }

  rulePromptFor(index: number): string {
    const round = this.byIndex(index);
    if (!round) {
      return "Work rule unavailable. Continue predicting learned tokenizer chunks.";
    }

    return `TUTORIAL ${index + 1}/${this.count()} - ${round.script.stageInstructionLines.workRule}`;
  }

  reviewSpeechWindowMs(reviewDelayMs: number): number {
    return Math.min(5600, Math.max(0, reviewDelayMs - 450));
  }

  reviewSpeechFor(index: number, input: TutorialReviewSpeechInput): string {
    const round = this.byIndex(index);
    if (!round) {
      return "WIENER: Tutorial record unavailable. Use the visible tokenizer evidence.";
    }

    const missedCuts = safeCutCount(input.missedCuts);
    const falseCuts = safeCutCount(input.falseCuts);
    if (missedCuts === 0 && falseCuts === 0) {
      return formatTutorialReviewLine(round.script.reviewReactions.pass, input);
    }

    const template = missedCuts > 0 && falseCuts > 0
      ? round.script.reviewReactions.mixed
      : round.script.reviewReactions.fail;
    return formatTutorialReviewLine(template, input);
  }

  resolveLineFor(index: number): string {
    const round = this.byIndex(index);
    if (!round) {
      return "Tutorial record unavailable. Returning control to the menu.";
    }

    if (!this.isCompleteAfter(index + 1)) {
      return round.script.reviewLine;
    }

    return `${round.script.reviewLine} ${this.completionLine()}`;
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
