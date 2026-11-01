import Link from "next/link";
import Image from "next/image";
import { ReadingTime } from "@/components/reading-time";
import { SiteShell } from "@/components/site-shell";
import { StructuredData } from "@/components/structured-data";
import { pageMetadata, pageSchema, site } from "@/lib/site";
import { getPostsNewestFirst, formatPostDate } from "@/lib/posts";

const description = "Prediction market research from OddsParse Lab: trading strategy experiments, backtests, live results, execution latency, and model calibration.";
export const metadata = pageMetadata("Prediction Market Research & Trading Analysis", description, "/blog/");

type Post = ReturnType<typeof getPostsNewestFirst>[number];

function PostCard({ post, latest = false }: { post: Post; latest?: boolean }) {
  return <article className={latest ? "journal-card journal-latest" : "journal-card"}>
    <Link href={`/blog/${post.slug}/`} aria-labelledby={`post-${post.slug}`}>
      <div className="journal-card-image">
        <Image
          src={latest ? post.image : post.thumbnail}
          alt={post.imageAlt}
          width={latest ? 1920 : 768}
          height={latest ? 800 : 512}
          loading={latest ? "eager" : "lazy"}
          unoptimized
        />
      </div>
      <h2 id={`post-${post.slug}`}>{post.title}</h2>
      <p>{post.summary}</p>
      <div className="journal-card-meta">
        <time dateTime={post.date}>{formatPostDate(post.date)}</time>
        <ReadingTime minutes={post.readingMinutes} />
      </div>
    </Link>
  </article>;
}

export default function Blog() {
  const posts = getPostsNewestFirst();
  const [latest, ...olderPosts] = posts;
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
            description: post.description, datePublished: post.date, author: post.author,
          },
        })),
      },
    ] }} />
    <main id="main" className="blog-journal">
      <section className="journal-opening" aria-label="Latest research">
        <header className="journal-introduction">
          <h1>Notes on<br /><em>uncertainty.</em></h1>
          <p>Prediction market strategies, backtests, and live trading results.</p>
          <p>We document the models, data, and execution behind each experiment—what worked, what failed, and what we learned from trading live.</p>
        </header>
        {latest && <PostCard post={latest} latest />}
      </section>
      {olderPosts.length > 0 && <section className="journal-grid" aria-label="More articles">
        {olderPosts.map(post => <PostCard key={post.slug} post={post} />)}
      </section>}
    </main>
  </SiteShell>;
}
