// Pure money-runway calculations. No UI side-effects, no I/O.
// All amounts in NGN (kobo-rounded to 2dp). Plan ref: IMPLEMENTATION_PLAN.md §6.1

export interface RunwayInput {
  available: number;
  protectedEssentials: number;
  knownEssentialsDue: number;
  buffer: number;
  planningDays: number;
}

export interface RunwayResult {
  /** Money left for flexible spending. Never positive-guessed. */
  flexible: number;
  /** Per-day guide, or null when in shortfall (never show a positive guide). */
  dailyGuide: number | null;
  shortfall: boolean;
}

/** Round to kobo (2dp) to avoid float drift in money math. */
export function roundKobo(n: number): number {
  return Math.round(n * 100) / 100;
}

function assertMoney(name: string, v: number): void {
  if (!Number.isFinite(v) || v < 0) {
    throw new Error(`${name} must be a finite number >= 0`);
  }
}

export function calcRunway(input: RunwayInput): RunwayResult {
  assertMoney('available', input.available);
  assertMoney('protectedEssentials', input.protectedEssentials);
  assertMoney('knownEssentialsDue', input.knownEssentialsDue);
  assertMoney('buffer', input.buffer);
  if (!Number.isInteger(input.planningDays) || input.planningDays < 1) {
    throw new Error('planningDays must be an integer >= 1 (ask the user for a horizon, never invent one)');
  }
  const flexible = roundKobo(
    input.available - input.protectedEssentials - input.knownEssentialsDue - input.buffer,
  );
  if (flexible <= 0) {
    return { flexible, dailyGuide: null, shortfall: true };
  }
  return { flexible, dailyGuide: roundKobo(flexible / input.planningDays), shortfall: false };
}
