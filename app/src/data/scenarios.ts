// Simulator scenario cards. ALL fictional, ALL labeled HYPOTHETICAL in the UI.
// Show gain AND loss. Never implies live trading or guaranteed profit.

export interface SimChoice {
  id: string;
  label: string;
  /** NGN effect on the virtual balance (may be negative). */
  delta: number;
  outcome: string;
  risk: string;
}

export interface Scenario {
  id: string;
  title: string;
  story: string;
  virtualBalance: number;
  choices: SimChoice[];
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'allowance-delayed',
    title: 'Allowance delayed by 5 days',
    story: 'Your ₦15,000 allowance was due today. Home says: network issues, expect it in 5 days. You hold ₦4,000 cash.',
    virtualBalance: 4000,
    choices: [
      { id: 'stretch', label: 'Stretch: ₦800/day, pause savings', delta: 0, outcome: 'You last the 5 days with ₦0 to spare. Savings paused — resume when money lands.', risk: 'No buffer left: one surprise breaks the plan.' },
      { id: 'borrow', label: 'Borrow ₦3,000 from a friend', delta: 3000, outcome: 'You spend comfortably, but owe ₦3,000 the day money lands.', risk: 'Debt shrinks next allowance; late repayment strains friendships.' },
      { id: 'splurge', label: 'Spend normally (₦1,500/day)', delta: -3500, outcome: 'Money runs out on day 3. You skip essentials — never the safe choice.', risk: 'Shortfall plus stress. Essentials must never be sacrificed.' },
    ],
  },
  {
    id: 'course-material',
    title: 'Required course material: ₦2,500',
    story: 'A lecturer requires a ₦2,500 handout this week. Virtual balance: ₦6,000, with transport protected at ₦2,000.',
    virtualBalance: 6000,
    choices: [
      { id: 'buy-split', label: 'Buy it, split cost over food budget', delta: -2500, outcome: 'Material secured. Food budget drops — cook instead of buying out.', risk: 'Tighter food week; watch nutrition, never skip meals.' },
      { id: 'share', label: 'Share with a classmate (₦1,250 each)', delta: -1250, outcome: 'You read on alternating days and save ₦1,250.', risk: 'Shared access can clash before exams.' },
      { id: 'skip', label: 'Skip it and hope', delta: 0, outcome: 'No cost now — but you miss assignments tied to the material.', risk: 'Academic cost dwarfs ₦2,500. False economy.' },
    ],
  },
  {
    id: 'charger-breaks',
    title: 'Charger breaks before exams',
    story: 'Your charger dies. Original: ₦3,500. Market unknown brand: ₦1,200. Virtual balance: ₦5,000.',
    virtualBalance: 5000,
    choices: [
      { id: 'original', label: 'Buy the original ₦3,500', delta: -3500, outcome: 'Reliable power through exams. Flexible money shrinks to ₦1,500.', risk: 'Thin buffer for the rest of the week.' },
      { id: 'cheap', label: 'Buy the ₦1,200 unknown brand', delta: -1200, outcome: 'Cheap now — but it overheats in this story and dies in 3 weeks, costing another ₦1,200.', risk: 'Cheap can cost twice. Total fictional loss: ₦2,400.' },
      { id: 'borrow-charger', label: 'Borrow a roommate’s charger nightly', delta: 0, outcome: 'Zero cost, but nightly negotiation and slow charging.', risk: 'Dependency risk the night before an exam.' },
    ],
  },
  {
    id: 'overspend-invite',
    title: 'Friends invite you to overspend',
    story: 'Friday hangout: ₦2,000 expected. Your daily guide says ₦400. Virtual balance: ₦3,000, 6 days to go.',
    virtualBalance: 3000,
    choices: [
      { id: 'decline', label: 'Decline, suggest a free hangout', delta: 0, outcome: 'Plan intact; friendships survive honesty in this story.', risk: 'Small social cost — real friends adjust.' },
      { id: 'partial', label: 'Go with a ₦500 cap', delta: -500, outcome: 'You show up, spend ₦500, plan survives with tighter days.', risk: 'Peer pressure can push past caps — decide the cap before arriving.' },
      { id: 'full', label: 'Go all in: ₦2,000', delta: -2000, outcome: 'Fun night, broken week: ₦1,000 for 6 days means shortfall.', risk: 'One evening can erase a week of discipline.' },
    ],
  },
  {
    id: 'transport-rise',
    title: 'Transport fare rises mid-week',
    story: 'Bus fare jumps 50% from Monday. Your transport budget assumed the old fare. Virtual balance: ₦4,500.',
    virtualBalance: 4500,
    choices: [
      { id: 'replan', label: 'Re-plan: shift ₦1,000 from flexible', delta: 0, outcome: 'Transport covered from existing money; virtual balance unchanged, flexible spending tightens honestly.', risk: 'Less room for anything else this week.' },
      { id: 'walk', label: 'Walk short distances, ride long ones', delta: -400, outcome: 'Saves ₦600 vs full re-plan in this story. Legs tired, wallet happier.', risk: 'Time cost and safety after dark — weigh both.' },
      { id: 'ignore', label: 'Keep the old budget', delta: -1500, outcome: 'Fares eat the gap anyway: ₦1,500 unplanned in this story.', risk: 'Ignoring a price rise never stops it charging you.' },
    ],
  },
  {
    id: 'fiction-invest',
    title: 'FICTIONAL investment pitch (practice)',
    story: 'A "friend of a friend" offers to double any money in 7 days. Virtual stake: ₦2,000 of virtual money. This is practice with play money.',
    virtualBalance: 2000,
    choices: [
      { id: 'refuse', label: 'Refuse — guaranteed doubling is a scam flag', delta: 0, outcome: 'You keep the virtual ₦2,000. In real life, you just dodged a scam.', risk: 'Zero financial risk; the skill is spotting the flag.' },
      { id: 'tiny-test', label: 'Risk ₦500 "to test"', delta: -500, outcome: 'The ₦500 vanishes in this story. Lesson learned cheaply — with play money.', risk: 'Testers often get paid first, then lose big. Never test scams with real money.' },
      { id: 'all-in', label: 'Put in the full ₦2,000', delta: -2000, outcome: 'Total fictional loss. The "platform" disappears in this story.', risk: 'Real version: savings gone, no recovery. Returns are never guaranteed.' },
    ],
  },
];

/** Pure lookup: scenario + choice → outcome triple. Throws on unknown ids. */
export function findOutcome(scenarioId: string, choiceId: string): { delta: number; outcome: string; risk: string } {
  const s = SCENARIOS.find((x) => x.id === scenarioId);
  const c = s?.choices.find((x) => x.id === choiceId);
  if (!s || !c) throw new Error(`unknown scenario/choice: ${scenarioId}/${choiceId}`);
  return { delta: c.delta, outcome: c.outcome, risk: c.risk };
}
