export type HudImpactTone = "gain" | "loss";
export type HudImpactTarget = "balance" | "pay" | "cost";

export interface HudImpactVisualInput {
  net: number;
  elapsedMs?: number | null;
}

export interface HudImpactVisualState {
  active: boolean;
  tone: HudImpactTone | null;
  targets: HudImpactTarget[];
  labelTarget: HudImpactTarget | null;
  deltaText: string;
  deltaAlpha: number;
  deltaLift: number;
  fillAlpha: number;
  strokeAlpha: number;
}

export const HUD_IMPACT_PULSE_MS = 560;

export function hudImpactTone(net: number): HudImpactTone | null {
  if (!Number.isFinite(net) || net === 0) {
    return null;
  }

  return net > 0 ? "gain" : "loss";
}

export function hudImpactTargets(net: number): HudImpactTarget[] {
  const tone = hudImpactTone(net);
  if (tone === "gain") {
    return ["balance", "pay"];
  }

  if (tone === "loss") {
    return ["balance", "cost"];
  }

  return [];
}

export function hudImpactLabelTarget(net: number): HudImpactTarget | null {
  const tone = hudImpactTone(net);
  if (tone === "gain") {
    return "pay";
  }

  if (tone === "loss") {
    return "cost";
  }

  return null;
}

export function hudImpactDeltaText(net: number): string {
  if (!Number.isFinite(net) || net === 0) {
    return "";
  }

  const sign = net > 0 ? "+" : "-";
  return `NET ${sign}$${Math.abs(net).toFixed(2)}`;
}

export function hudImpactVisualState(input: HudImpactVisualInput): HudImpactVisualState {
  const tone = hudImpactTone(input.net);
  const elapsedMs = Number.isFinite(input.elapsedMs) ? Math.max(0, input.elapsedMs ?? 0) : 0;
  const progress = Math.max(0, Math.min(1, elapsedMs / HUD_IMPACT_PULSE_MS));
  const active = tone !== null && elapsedMs < HUD_IMPACT_PULSE_MS;

  if (!active || tone === null) {
    return {
      active: false,
      tone: null,
      targets: [],
      labelTarget: null,
      deltaText: "",
      deltaAlpha: 0,
      deltaLift: 0,
      fillAlpha: 0,
      strokeAlpha: 0
    };
  }

  const decay = (1 - progress) * (1 - progress);

  return {
    active: true,
    tone,
    targets: hudImpactTargets(input.net),
    labelTarget: hudImpactLabelTarget(input.net),
    deltaText: hudImpactDeltaText(input.net),
    deltaAlpha: 0.34 + decay * 0.66,
    deltaLift: -6 * progress,
    fillAlpha: 0.1 + decay * 0.28,
    strokeAlpha: 0.16 + decay * 0.58
  };
}
