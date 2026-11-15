# OddsParse Lab

A minimal Next.js website for independent financial research.

## Local development

```sh
npm install
npm run dev
```

The landing page is `/`. `/strategies/` contains the interactive strategy and research-system explorer, with a circular index supporting pointer drag, trackpad scrolling, and keyboard navigation. `/about/` presents the lab's research and technology; `/contact/` provides contact information.

## Production

```sh
npm run build
```

The site uses static export; deploy the generated `out/` directory to any static host. No research data or backend credentials are used by this site.

## Legacy route

/projects and /projects/ permanently redirect to /strategies/ on Vercel through vercel.json. The exported /projects/ page also redirects in local previews and on other static hosts, with a no-JavaScript fallback. Only /strategies/ is listed in the sitemap.
