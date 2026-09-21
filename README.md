# OddsParse Lab

A minimal Next.js website for independent financial research.

## Local development

```sh
npm install
npm run dev
```

The landing page is `/`. `/projects` contains the interactive project explorer; `/about` presents the lab's mission, approach, vision, objectives, and contact information.

## Production

```sh
npm run build
```

The site uses static export; deploy the generated `out/` directory to any static host. No research data or backend credentials are used by this site.
