import type { Metadata } from "next";
import Link from "next/link";
import { ReadingTime } from "@/components/reading-time";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { StructuredData } from "@/components/structured-data";
import { posts, getPostsNewestFirst, formatPostDate } from "@/lib/posts";
import { pageMetadata, site, organization } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return posts.map(post => ({ slug: post.slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find(post => post.slug === slug);
  if (!post) notFound();
  const metadata = pageMetadata(post.title, post.description, `/blog/${post.slug}/`);
  const image = { url: `${site.url}${post.image}`, width: 1656, height: 864, alt: post.imageAlt };
  return {
    ...metadata,
    authors: [{ name: site.name, url: `${site.url}/about/` }],
    openGraph: { ...metadata.openGraph, type: "article", publishedTime: post.date, authors: [`${site.url}/about/`], images: [image] },
    twitter: { ...metadata.twitter, card: "summary_large_image", images: [image] },
  };
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = posts.find(post => post.slug === slug);
  if (!post) notFound();
  const ordered = getPostsNewestFirst();
  const next = ordered.length > 1 ? ordered[(ordered.indexOf(post) + 1) % ordered.length] : null;
  const url = `${site.url}/blog/${post.slug}/`;
  const Body = post.Body;
  return <SiteShell activePage="blog">
    <StructuredData data={{
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage", "@id": `${url}#webpage`, url,
          name: post.title, description: post.description, inLanguage: "en",
          isPartOf: { "@id": `${site.url}/#website` },
          mainEntity: { "@id": `${url}#article` },
          breadcrumb: { "@id": `${url}#breadcrumb` },
        },
        {
          "@type": "BlogPosting", "@id": `${url}#article`, url,
          headline: post.title, description: post.description, datePublished: post.date,
          inLanguage: "en", image: `${site.url}${post.image}`,
          author: { "@type": "Organization", "@id": organization["@id"], name: site.name, url: `${site.url}/about/` }, publisher: { "@id": organization["@id"] },
          mainEntityOfPage: { "@id": `${url}#webpage` },
          isAccessibleForFree: true, timeRequired: `PT${post.readingMinutes}M`,
          isPartOf: { "@id": `${site.url}/blog/#webpage` },
        },
        {
          "@type": "BreadcrumbList", "@id": `${url}#breadcrumb`,
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${site.url}/` },
            { "@type": "ListItem", position: 2, name: "Blog", item: `${site.url}/blog/` },
            { "@type": "ListItem", position: 3, name: post.title, item: url },
          ],
        },
      ],
    }} />
    <main id="main" className="journal-article">
      <Link href="/blog/" className="journal-back">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 12H5m6-6-6 6 6 6" />
        </svg>
        All articles
      </Link>
      <article>
        <header className="journal-article-header">
          <div className="journal-article-meta">
            <time className="journal-article-date" dateTime={post.date}>{formatPostDate(post.date)}</time>
            <ReadingTime minutes={post.readingMinutes} />
          </div>
          <h1>{post.title}</h1>
          <p className="journal-standfirst">{post.excerpt}</p>
        </header>
        <div className="journal-article-body"><Body /></div>
      </article>
      {next && <nav className="journal-next" aria-label="Continue reading"><span>Next article</span><Link href={`/blog/${next.slug}/`}>{next.title}</Link></nav>}
    </main>
  </SiteShell>;
}
