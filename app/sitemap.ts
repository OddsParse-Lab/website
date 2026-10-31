import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { posts } from "@/lib/posts";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...["/", "/projects/", "/about/", "/blog/"].map(path => ({ url: `${site.url}${path}` })),
    ...posts.map(post => ({ url: `${site.url}/blog/${post.slug}/`, lastModified: post.date })),
  ];
}
