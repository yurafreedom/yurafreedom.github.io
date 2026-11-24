# Yurii Sachenko — portfolio

The portfolio of Yurii Sachenko: AI visual production, video and software engineering, with 52 case studies and editorial pages in eight language routes (EN, RU, UK, ES, PL, DE, FR, AR).

Live: **https://sachenkolabs.tech**

It is a static site. `npm run build` generates it into `dist/` from the project records in `content/`, the locale files in `locales/` and the page sources in this folder. Every push to `main` builds and deploys it to GitHub Pages (`.github/workflows/pages.yml`).

## Build and run locally

Requires Node.js 18 or newer; there are no npm dependencies.

```bash
npm run build        # generate dist/
npm run dev          # build, then serve dist/ at http://127.0.0.1:4173/en/
npm run link:check   # verify internal links in dist/
npm run seo:check    # verify canonical, robots, sitemap and structured data
```

The site is built for the root of https://sachenkolabs.tech. To build for another address, set `SITE_ORIGIN` and `BASE_PATH`, for example `SITE_ORIGIN=https://example.org BASE_PATH=/portfolio npm run build`.

Only the English case narratives are complete; the other language routes are marked `noindex` until their translations are finished.
