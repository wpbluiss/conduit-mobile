export const Springs = {
  snappy: { damping: 15, stiffness: 200, mass: 0.5 },
  responsive: { damping: 20, stiffness: 150, mass: 0.8 },
  smooth: { damping: 25, stiffness: 120, mass: 1 },
  bouncy: { damping: 10, stiffness: 180, mass: 0.6 },
  gentle: { damping: 30, stiffness: 80, mass: 1.2 },
  heavy: { damping: 28, stiffness: 100, mass: 1.5 },
} as const;

export const Timing = {
  fast: 150, normal: 250, slow: 400, slower: 600, pulse: 2000, count: 1200,
} as const;

export const Stagger = { fast: 50, normal: 80, slow: 120 } as const;
