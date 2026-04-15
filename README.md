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

Each consuming site has a `fetch-shared-ui` build script that runs before
`astro build`. By default it shallow-clones this repo from GitHub and copies
`tokens.css`, `components/`, and `nav.ts` into the consumer's `src/shared-ui/`
directory. That's the path CI uses — no setup required.

The consumer then imports via `~/shared-ui/components/SiteHeader.astro` and
includes `~/shared-ui/tokens.css` in its global CSS.

### Opt-in: symlink mode for live reload

When you're actively editing this repo and want saves to hot-reload in a
consumer site, clone this repo as a sibling of the consumer:

```text
PROJECTS/JellyRock/
├── shared-ui/          ← this repo
├── jellyrock.app/      ← consumer
└── docs/               ← consumer
```

If `../shared-ui/` exists, `fetch-shared-ui` symlinks `src/shared-ui/` to it
instead of cloning. Vite picks up every save instantly — no commit, push, or
rebuild needed. Remove the sibling directory to revert to the default.

Caveat: the symlink points at your working tree, so a consumer build can
reference `shared-ui` commits that aren't pushed yet. Always push `shared-ui`
first when shipping cross-repo changes.

## Updating

Changes here require the consumer sites to rebuild. When this repo is pushed
to its own GitHub repo, a `repository_dispatch` webhook can trigger rebuilds
in `jellyrock.app`, `docs`, and `api-docs`.
