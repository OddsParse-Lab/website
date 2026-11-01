import { SpotlagArticle } from "@/content/posts/spotlag";
import { organization } from "@/lib/site";

export const posts = [
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
];

export function getPostsNewestFirst() {
  return [...posts].sort((a, b) => b.date.localeCompare(a.date));
}

export function formatPostDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}
