export const worldCupMockEvents = [
  {
    id: 'mock-portugal-congo',
    homeTeam: 'Portugal',
    awayTeam: 'DR Congo',
    commenceTime: '2026-06-17T17:00:00Z',
    bookmaker: 'MockBook',
    markets: [
      {
        key: 'h2h',
        outcomes: [
          { name: 'Portugal', price: 1.26 },
          { name: 'Draw', price: 5.7 },
          { name: 'DR Congo', price: 12 },
        ],
      },
      {
        key: 'totals',
        outcomes: [
          { name: 'Over', point: 2.5, price: 1.91 },
          { name: 'Under', point: 2.5, price: 1.95 },
        ],
      },
      {
        key: 'spreads',
        outcomes: [
          { name: 'Portugal', point: -1.5, price: 1.85 },
          { name: 'DR Congo', point: 1.5, price: 1.98 },
        ],
      },
    ],
  },
  {
    id: 'mock-england-croatia',
    homeTeam: 'England',
    awayTeam: 'Croatia',
    commenceTime: '2026-06-17T20:00:00Z',
    bookmaker: 'MockBook',
    markets: [
      {
        key: 'h2h',
        outcomes: [
          { name: 'England', price: 1.69 },
          { name: 'Draw', price: 3.7 },
          { name: 'Croatia', price: 4.8 },
        ],
      },
      {
        key: 'totals',
        outcomes: [
          { name: 'Over', point: 2.5, price: 2.05 },
          { name: 'Under', point: 2.5, price: 1.82 },
        ],
      },
      {
        key: 'spreads',
        outcomes: [
          { name: 'England', point: -0.5, price: 1.72 },
          { name: 'Croatia', point: 0.5, price: 2.1 },
        ],
      },
    ],
  },
];