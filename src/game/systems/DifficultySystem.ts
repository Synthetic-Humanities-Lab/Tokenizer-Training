export interface DifficultyState {
  round: number;
  tierCap: number;
  roundDurationMs: number;
  penaltyScale: number;
  label: string;
}

export class DifficultySystem {
  getState(round: number): DifficultyState {
    const normalizedRound = Math.max(1, Math.floor(round));
    const tierCap = this.tierCapForRound(normalizedRound);
    const roundDurationMs = Math.max(4200, 9000 - (normalizedRound - 1) * 220);
    const penaltyScale = Number((1 + (normalizedRound - 1) * 0.035).toFixed(3));

    return {
      round: normalizedRound,
      tierCap,
      roundDurationMs,
      penaltyScale,
      label: `Tier ${tierCap} clearance`
    };
  }

  private tierCapForRound(round: number): number {
    if (round >= 13) return 4;
    if (round >= 8) return 3;
    if (round >= 4) return 2;
    return 1;
  }
}
