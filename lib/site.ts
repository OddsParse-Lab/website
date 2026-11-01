import type { Metadata } from "next";

export const site = {
  name: "OddsParse Lab",
  alternateName: "OddsParse",
  url: "https://www.oddsparse.trade",
  description: "OddsParse Lab develops proprietary models for prediction markets, systematic equities trading, automated arbitrage, and LLM-powered market intelligence.",
  email: "team@oddsparse.trade",
};

export const organization = {
  "@type": "Organization",
  "@id": `${site.url}/#organization`,
  name: site.name,
  alternateName: site.alternateName,
  url: `${site.url}/`,
  description: site.description,
  email: site.email,
  logo: { "@type": "ImageObject", url: `${site.url}/brand/logo.png`, width: 300, height: 300 },
};

export function pageMetadata(title: string, description: string, path: string): Metadata {
  const fullTitle = path === "/" ? title : `${title} - ${site.name}`;
  const url = `${site.url}${path}`;
  const image = { url: `${site.url}/brand/logo.png`, width: 300, height: 300, alt: `${site.name} logo` };
  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", locale: "en_US", siteName: site.name, title: fullTitle, description, url, images: [image] },
    twitter: { card: "summary", title: fullTitle, description, images: [image] },
  };
}

export function pageSchema(type: "AboutPage" | "CollectionPage", name: string, description: string, path: string) {
  const url = `${site.url}${path}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": type,
        "@id": `${url}#webpage`,
        url,
        name,
        description,
        inLanguage: "en",
        isPartOf: { "@id": `${site.url}/#website` },
        about: { "@id": organization["@id"] },
        breadcrumb: { "@id": `${url}#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${site.url}/` },
          { "@type": "ListItem", position: 2, name, item: url },
        ],
      },
    ],
  };
}
