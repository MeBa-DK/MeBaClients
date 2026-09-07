export type RebillStatus = "internal" | "rebillable" | "rebilled" | "settled";

export type RebillState = {
  rebillStatus: RebillStatus;
  rebilledAt: string | null;
  settledAt: string | null;
};

const ALLOWED: Record<RebillStatus, RebillStatus[]> = {
  internal: ["rebillable"],
  rebillable: ["internal", "rebilled"],
  rebilled: ["rebillable", "settled"],
  settled: [],
};

export function canTransition(from: RebillStatus, to: RebillStatus): boolean {
  return ALLOWED[from].includes(to);
}

export function applyTransition(
  state: RebillState,
  to: RebillStatus,
  today: string,
): RebillState {
  if (!canTransition(state.rebillStatus, to)) {
    throw new Error(`Cannot move an outlay from ${state.rebillStatus} to ${to}`);
  }
  return {
    rebillStatus: to,
    rebilledAt: to === "rebilled" ? today : to === "settled" ? state.rebilledAt : null,
    settledAt: to === "settled" ? today : null,
  };
}
