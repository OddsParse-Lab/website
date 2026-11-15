import { LotteryPriceArticle } from "@/content/posts/lottery-price";
import { MakerReactionArticle, makerReactionSource } from "@/content/posts/maker-reaction-function";
import { SpotlagArticle } from "@/content/posts/spotlag";
import { organization } from "@/lib/site";

export const posts = [
  {
    slug: "kalshi-longshot-bias",
    date: "2026-11-14",
    author: { "@type": "Person", name: "Kevin Z", jobTitle: "Quantitative Researcher", affiliation: organization },
    readingMinutes: 9, // Main text, summary table, and figure captions at approximately 200 words/minute.
    title: "Are Cheap Kalshi Contracts a Bargain?",
    description: "An analysis of 107.7 million Kalshi BTC and ETH trades: observed win rates, fee-adjusted payouts, and longshot pricing in hourly crypto prediction markets.",
    summary: "What 107.7 million BTC and ETH trades reveal about low-priced contracts, settlement probabilities, and the cost of a long shot.",
    excerpt: "We studied 107.7 million trades in Kalshi’s hourly Bitcoin and Ethereum markets. Low-priced contracts offered large payout multiples—but did they win often enough to justify the price?",
    image: "/blog/kalshi-longshot-bias/cover.webp",
    thumbnail: "/blog/kalshi-longshot-bias/cover-thumbnail.webp",
    socialImage: "/blog/kalshi-longshot-bias/cover-social.jpg",
    imageAlt: "Translucent blue glass spheres magnify a grid of small graphite spheres, an abstract illustration of rare outcomes appearing larger than they are.",
    sections: [
      { id: "article-overview", label: "Overview" },
      { id: "sample", label: "The sample" },
      { id: "breakeven", label: "Breaking even" },
      { id: "results", label: "Prices & payouts" },
      { id: "interpretation", label: "The longshot pattern" },
      { id: "stability", label: "Stability over time" },
      { id: "limitations", label: "Limitations" },
      { id: "conclusion", label: "Conclusion" },
      { id: "tables", label: "Data tables" },
    ],
    Body: LotteryPriceArticle,
  },
  {
    slug: "one-second-behind",
    date: "2026-10-30",
    author: { "@type": "Person", name: "Kevin Z", jobTitle: "Quantitative Researcher", affiliation: organization },
    readingMinutes: 16, // Estimated at 200 words per minute, including tables and captions.
    title: "Why Our Kalshi Spot-Lag Trading Strategy Failed",
    description: "A postmortem of our Kalshi 15-minute crypto trading strategy: settlement-index latency, model calibration, fees, and results from 1,029 submitted live orders.",
    summary: "A two-week test of Kalshi’s 15-minute crypto markets, and what 1,029 live orders revealed about signal timing, execution costs, and model calibration.",
    excerpt: "We tested a spot-lag trading strategy in Kalshi’s 15-minute crypto prediction markets. Across 1,029 submitted live orders, it lost $26.16 after fees. We examine why the order book moved before our signal—and what execution costs and model calibration revealed.",
    image: "/blog/one-second-behind/cover.webp",
    thumbnail: "/blog/one-second-behind/cover-thumbnail.webp",
    socialImage: "/blog/one-second-behind/cover-social.jpg",
    imageAlt: "Offset waves of translucent blue-gray glass, an abstract illustration of signal delay.",
    sections: [
      { id: "article-overview", label: "Overview" },
      { id: "question", label: "The research question" },
      { id: "model", label: "The model" },
      { id: "experiment", label: "The experiment" },
      { id: "evidence", label: "Data & methodology" },
      { id: "book-first", label: "The book moved first" },
      { id: "price", label: "Win rates & costs" },
      { id: "selection", label: "Live trading results" },
      { id: "uncertainty", label: "Model uncertainty" },
      { id: "tradable-window", label: "Executable liquidity" },
      { id: "limits", label: "Limitations" },
      { id: "conclusion", label: "Why we stopped" },
    ],
    Body: SpotlagArticle,
  },
  {
    slug: "maker-reaction-function",
    date: "2026-10-30",
    author: { "@type": "Person", name: "Tony Q", jobTitle: "Quantitative Researcher", affiliation: organization },
    readingMinutes: 32, // Reading time for the complete Chinese original.
    title: "How Prediction Market Makers React to CME Futures",
    description: "An English summary of research on prediction-market makers: CME-based reaction times, quote replenishment, and why stale liquidity may not be profitable.",
    summary: "CME futures as a clock for studying quote cancellations, repricing, and replenishment—and why stale prices can still be unprofitable.",
    excerpt: "An English summary of research on maker response times, quote replenishment, and the limits of trading stale prices.",
    image: "/blog/maker-reaction-function/cover.webp",
    thumbnail: "/blog/maker-reaction-function/cover-thumbnail.webp",
    socialImage: "/blog/maker-reaction-function/cover-social.jpg",
    imageAlt: "Fine lines converge on a blue point against a soft blue and peach background, from the original article.",
    source: makerReactionSource,
    sections: [],
    Body: MakerReactionArticle,
  },
];

export function getPostsNewestFirst() {
  // Keep editorial order when publication dates match.
  return [...posts].sort((a, b) => b.date.localeCompare(a.date));
}

export function formatPostDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}
