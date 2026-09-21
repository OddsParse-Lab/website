export const projects = [
  { name: "Echo", category: "Prediction models", domain: "Prediction markets", description: "An in-house model for prediction markets. The approach stays private while development continues." },
  { name: "Heimdall", category: "Market intelligence", domain: "News & language models", description: "Monitoring market news and using LLMs to understand what matters, how fresh it is, and whether it is already priced in." },
  { name: "Torsion", category: "Intraday strategies", domain: "US equities", description: "Our own intraday model and strategy, designed in-house and inspired by opening-range breakout and rubber-band concepts." },
  { name: "Parallax", category: "Automated arbitrage", domain: "Kalshi · Limitless", description: "Risk-free arbitrage between Kalshi and Limitless, powered by proprietary semantic market matching and fully automated trading." },
] as const;
