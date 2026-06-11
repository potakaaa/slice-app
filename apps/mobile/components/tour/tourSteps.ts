/**
 * Content for the first-run tour. Each step names the tab it describes via
 * `route` — the tour auto-navigates there so the user sees the real page while a
 * small card explains it. Keep each `body` to ~2 lines.
 */
export interface TourStep {
  id: string;
  /** Tab the tour switches to for this step. */
  route: string;
  title: string;
  body: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "dashboard",
    route: "/(tabs)",
    title: "This is your dashboard",
    body: "Your debt, settlement target, and savings — all at a glance.",
  },
  {
    id: "creditors",
    route: "/(tabs)/creditors",
    title: "Your creditors",
    body: "Add and manage everyone you owe right here.",
  },
  {
    id: "program",
    route: "/(tabs)/program",
    title: "Your payoff program",
    body: "Your snowball plan, laid out step by step.",
  },
  {
    id: "tools",
    route: "/(tabs)/tools",
    title: "AI negotiation help",
    body: "AI scripts and calculators for each creditor. Replay anytime from More.",
  },
];
