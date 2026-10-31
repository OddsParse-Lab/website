import { SpotlagArticle } from "@/content/posts/spotlag";

export const posts = [
  {
    slug: "one-second-behind",
    date: "2026-10-30",
    readingMinutes: 15, // Estimated at 200 words per minute, including tables and captions.
    title: "Why Our Kalshi Spot-Lag Trading Strategy Failed",
    description: "A postmortem of our Kalshi 15-minute crypto trading strategy: settlement-index latency, model calibration, fees, and results from 1,029 submitted live orders.",
    excerpt: "We tested a spot-lag trading strategy in Kalshi’s 15-minute crypto prediction markets. Across 1,029 submitted live orders, it lost $26.16 after fees. We examine why the order book moved before our signal—and what execution costs and model calibration revealed.",
    image: "/blog/one-second-behind/response.png",
    imageAlt: "The order book responds before the settlement-index tick arrives.",
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
