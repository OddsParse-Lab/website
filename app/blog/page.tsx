import Link from "next/link";
import { ReadingTime } from "@/components/reading-time";
import { SiteShell } from "@/components/site-shell";
import { StructuredData } from "@/components/structured-data";
import { pageMetadata, pageSchema, site } from "@/lib/site";
import { getPostsNewestFirst, formatPostDate } from "@/lib/posts";

const description = "Prediction market research from OddsParse Lab: trading strategy experiments, backtests, live results, execution latency, and model calibration.";
export const metadata = pageMetadata("Prediction Market Research & Trading Analysis", description, "/blog/");

export default function Blog() {
  const posts = getPostsNewestFirst();
  const schema = pageSchema("CollectionPage", "Blog", description, "/blog/");
  const listId = `${site.url}/blog/#articles`;
  return <SiteShell activePage="blog">
    <StructuredData data={{ ...schema, "@graph": [
      { ...schema["@graph"][0], mainEntity: { "@id": listId } },
      schema["@graph"][1],
      {
        "@type": "ItemList", "@id": listId, name: "OddsParse Lab research articles",
        numberOfItems: posts.length,
        itemListElement: posts.map((post, index) => ({
          "@type": "ListItem", position: index + 1,
          item: {
            "@type": "BlogPosting", "@id": `${site.url}/blog/${post.slug}/#article`,
            url: `${site.url}/blog/${post.slug}/`, headline: post.title,
            description: post.description, datePublished: post.date,
          },
        })),
      },
    ] }} />
    <main id="main" className="blog-journal">
      <header className="journal-opening">
        <h1>Notes on<br /><em>uncertainty.</em></h1>
        <p>Prediction market strategies, backtests,<br />and live trading results.</p>
      </header>
      <div className="journal-list">
        {posts.map(post => <article key={post.slug}>
          <Link className="journal-row" href={`/blog/${post.slug}/`}>
            <div><h2>{post.title}</h2><p>{post.excerpt}</p></div>
            <div className="journal-row-meta">
              <time dateTime={post.date}>{formatPostDate(post.date)}</time>
              <ReadingTime minutes={post.readingMinutes} />
            </div>
          </Link>
        </article>)}
      </div>
    </main>
  </SiteShell>;
}
