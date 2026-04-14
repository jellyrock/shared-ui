# JellyRock Shared UI

Shared header, footer, design tokens, and navigation data for all JellyRock
websites.

## What's here

- `tokens.css` — CSS variables for colors, fonts, spacing, plus styles for
  `.jr-site-header`, `.jr-site-footer`
- `components/SiteHeader.astro` — top navigation
- `components/SiteFooter.astro` — full-width footer
- `nav.ts` — link data (header nav, footer sections, social links)

## How each site consumes it

Each consuming site has a `fetch-shared-ui.mjs` build script that, before
`astro build` runs:

1. Looks for a sibling `../shared-ui/` directory (local dev case — this repo
   sits next to the consumer repo)
2. Falls back to cloning `https://github.com/jellyrock/shared-ui.git` (CI case)
3. Copies `tokens.css`, `components/`, and `nav.ts` into the consumer's
   `src/shared-ui/` directory

The consumer site then imports via `~/shared-ui/components/SiteHeader.astro`
and includes `~/shared-ui/tokens.css` in its global CSS.

## Updating

Changes here require the consumer sites to rebuild. When this repo is pushed
to its own GitHub repo, a `repository_dispatch` webhook can trigger rebuilds
in `jellyrock.app`, `docs`, and `api-docs`.
