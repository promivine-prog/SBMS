// Starter lessons. DRAFT content — requires owner approval + fluent-speaker
// review before pilot. Short, naira examples, plain definitions.

export interface QuizQ {
  q: string;
  options: string[];
  /** index into options */
  answer: number;
}

export interface Lesson {
  id: string;
  title: string;
  minutes: number;
  body: string[];
  quiz: QuizQ[];
}

export const LESSONS: Lesson[] = [
  {
    id: 'budgeting-basics',
    title: 'Budgeting basics: give every naira a job',
    minutes: 3,
    body: [
      'A budget is a plan for money you already have. List what must be paid first — food, transport, school materials — then see what is left for the rest.',
      'Example: with ₦12,000, protecting ₦6,000 for food and transport leaves ₦6,000 flexible. The flexible part is what your daily guide comes from.',
      'Review the plan weekly. If anything changes, update the numbers instead of guessing.',
    ],
    quiz: [
      { q: 'What is a budget?', options: ['A plan for money you have', 'A loan from a bank', 'A guaranteed profit'], answer: 0 },
      { q: 'What should you protect first?', options: ['Essentials like food and transport', 'Fun spending', 'Gifts for friends'], answer: 0 },
      { q: 'Your income is delayed. What do you do?', options: ['Update the plan numbers', 'Keep spending the same', 'Stop tracking'], answer: 0 },
    ],
  },
  {
    id: 'tracking-spending',
    title: 'Track spending without stress',
    minutes: 3,
    body: [
      'You cannot plan what you cannot see. Record each expense the same day — amount, category, and whether it was cash.',
      'Cash is easy to forget. A quick evening check ("did I record today?") catches most gaps.',
      'If your counted cash and recorded cash disagree, use Count my cash and accept the adjustment instead of hiding it.',
    ],
    quiz: [
      { q: 'When should you record an expense?', options: ['The same day', 'End of the semester', 'Never'], answer: 0 },
      { q: 'Why record whether spending was cash?', options: ['So cash on hand stays honest', 'It looks nice', 'The app needs it to work at all'], answer: 0 },
      { q: 'Counted cash is less than recorded. Best step?', options: ['Accept an Unaccounted adjustment', 'Delete old records', 'Ignore it'], answer: 0 },
    ],
  },
  {
    id: 'saving-goals',
    title: 'Micro-savings: small steps count',
    minutes: 3,
    body: [
      'Pick one goal with a target and a date — for example ₦5,000 for textbooks in 10 weeks. That is ₦500 per week.',
      'Save only after essentials are covered. If a week is tight, pause or reduce the goal instead of skipping meals.',
      'SBMS tracks your goal; it does not hold your money. Your savings stay with you.',
    ],
    quiz: [
      { q: '₦5,000 in 10 weeks means what per week?', options: ['₦500', '₦5,000', '₦50'], answer: 0 },
      { q: 'A week is tight. What is the safe move?', options: ['Pause or reduce the goal', 'Skip meals to save', 'Borrow at any cost'], answer: 0 },
      { q: 'Where does SBMS keep your savings?', options: ['Nowhere — it only tracks', 'In an SBMS vault', 'In stocks'], answer: 0 },
    ],
  },
  {
    id: 'emergency-fund',
    title: 'Emergency funds: expect surprises',
    minutes: 4,
    body: [
      'Chargers break, transport fares rise, course materials appear without warning. An emergency fund is a small buffer for exactly this.',
      'Start tiny: even ₦200–₦500 kept aside weekly builds a cushion over a semester.',
      'Use the fund for true surprises, then rebuild it. That is the whole system.',
    ],
    quiz: [
      { q: 'What is an emergency fund for?', options: ['True surprises', 'Planned parties', 'Daily snacks'], answer: 0 },
      { q: 'How do you start one with little money?', options: ['Tiny weekly amounts', 'One huge deposit', 'Wait until rich'], answer: 0 },
      { q: 'After using it, you should…', options: ['Rebuild it gradually', 'Close it forever', 'Double your spending'], answer: 0 },
    ],
  },
  {
    id: 'inflation',
    title: 'Inflation: why prices creep up',
    minutes: 4,
    body: [
      'Inflation means the same ₦1,000 buys less over time. If transport rises from ₦300 to ₦400, a plan built on ₦300 breaks.',
      'Defense: review budgets when prices move, keep flexible spending truly flexible, and prefer needs over wants when money is tight.',
      'SBMS plans use the numbers you enter today. When prices change, update them.',
    ],
    quiz: [
      { q: 'Inflation means…', options: ['Money buys less over time', 'Money buys more', 'Prices freeze'], answer: 0 },
      { q: 'Transport fare rises. First step?', options: ['Update the budget numbers', 'Pretend nothing changed', 'Delete the app'], answer: 0 },
      { q: 'Why keep some spending flexible?', options: ['To absorb price changes', 'To impress friends', 'No reason'], answer: 0 },
    ],
  },
  {
    id: 'risk-diversification',
    title: 'Risk: losses are real, guarantees are lies',
    minutes: 4,
    body: [
      'Every real investment can lose money. Anyone promising guaranteed profit is misleading you.',
      'Diversification — spreading money across options — reduces (never removes) the damage of one failure.',
      'Practice in the SBMS simulator first. Its outcomes are hypothetical, including the losses.',
    ],
    quiz: [
      { q: '"Guaranteed profit, no risk" means…', options: ['A warning sign', 'A safe deal', 'Free money'], answer: 0 },
      { q: 'Diversification means…', options: ['Spreading money across options', 'Putting all in one bet', 'Hiding cash'], answer: 0 },
      { q: 'Simulator outcomes are…', options: ['Hypothetical practice', 'Real profits', 'Bank guarantees'], answer: 0 },
    ],
  },
];
