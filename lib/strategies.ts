export const strategies = [
  { name: "Ballast", status: "Live", category: "Market making", domain: "Event contract market making", description: "A proprietary pricing engine for event contracts that provides maker-side liquidity, combining precise probability modeling with low-latency execution to deliver consistent, risk-controlled returns." },
  { name: "Chronallax", status: "Live", category: "Ultra-high-frequency arbitrage", domain: "Quantitative arbitrage", description: "An ultra-high-frequency spread arbitrage engine that detects pricing inconsistencies across related event contracts and locks in the spread within milliseconds." },
  { name: "Anachron", status: "Live", category: "Market making", domain: "Event contract market making", description: "A market-making engine that identifies systematic mispricing in event contracts and provides liquidity against it." },
  { name: "Echo", status: "Archived", category: "Prediction models", domain: "Prediction markets", description: "An in-house pricing model for prediction markets." },
  { name: "Heimdall", status: "Archived", category: "Market intelligence", domain: "News & language models", description: "Monitoring market news and using LLMs to understand what matters, how fresh it is, and whether it is already priced in." },
  { name: "Parallax", status: "Archived", category: "Market matching", domain: "Cross-platform prediction markets", description: "A tool for matching prediction markets, comparing resolution rules, monitoring price differences, and placing orders across platforms." },
] as const;
