# JellyRock Shared UI

[![License](https://img.shields.io/github/license/jellyrock/shared-ui 'License')](./LICENSE)
[![build](https://img.shields.io/github/actions/workflow/status/jellyrock/shared-ui/ci.yml?logo=github&branch=main 'build')](https://github.com/jellyrock/shared-ui/actions/workflows/ci.yml?query=branch%3Amain)

Shared header, footer, design tokens, and navigation data for all JellyRock
websites.

## What's here

- `tokens.css` — CSS variables for colors, fonts, spacing, plus styles for
  `.jr-site-header`, `.jr-site-footer`
- `components/SiteHeader.astro` — top navigation. Below 64rem (1024px) the
  links collapse into a menu button that opens them, plus Donate, in a native
  `popover`: no JavaScript, so it works under a strict `script-src 'self'` CSP.
  A site with its own small-screen menu (Starlight's, on the docs sites) can
  hide `.jr-site-menu-button` where that menu shows and list `headerLinks`
  there instead, so there is only ever one menu button.
- `components/SiteFooter.astro` — full-width footer
- `nav.ts` — link data (header nav, footer sections, social links)
- `testing/` — the browser tests every site runs against its production build
  (see [Shared browser tests](#shared-browser-tests))

## How each site consumes it

Each consuming site has a `fetch-shared-ui` build script that runs before
`astro build`. By default it shallow-clones this repo from GitHub and copies
`tokens.css`, `components/`, `nav.ts` and `testing/` into the consumer's
`src/shared-ui/` directory. That's the path CI uses — no setup required.

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

## Local development

```bash
nvm use                # Node from .nvmrc
npm install -g "$(node -p 'require("./package.json").packageManager')"  # the npm CI and Renovate use
npm ci
npm run check          # tsc + eslint + prettier
npm run fix            # eslint --fix + prettier --write
```

Every push and pull request runs the same `npm run check` via
[`.github/workflows/ci.yml`](.github/workflows/ci.yml) so broken shared-ui
code can never land on `main` and silently poison downstream consumer builds.

| Tool                                  | What it catches                                                                     |
| ------------------------------------- | ----------------------------------------------------------------------------------- |
| `tsc --noEmit`                        | TypeScript errors in `nav.ts` and any typed imports                                 |
| `eslint` (with `astro-eslint-parser`) | Unused variables, `no-undef`, bad JS/TS in `<script>` blocks of `.astro` components |
| `prettier`                            | Formatting drift (print width, quotes, trailing commas)                             |

## Shared browser tests

`testing/` holds the parts of the sites' browser tests (Playwright) that are
the same everywhere:

- `serve-dist.mjs` serves a build the way Caddy does in production: the site's
  security headers (from a JSON file the site keeps), a 308 to the
  trailing-slash URL for directories, and the build's `404.html` with status
  404 for a missing path.
- `checks.ts` records what a visitor would hit on a page (console errors, CSP
  violations, failed or cross-origin requests, broken images) and scrolls a
  page through so lazy content loads.
- `site-tests.ts` registers the tests every site runs: each sitemap page loads
  cleanly, every internal link and anchor resolves without a redirect, and a
  missing page returns 404.

A site keeps its own Playwright config, page list, screenshots, production
headers and site-specific tests, and calls the shared tests from a spec file:

```ts
import { test, expect } from '@playwright/test';
import { defineSiteTests } from '../../src/shared-ui/testing/site-tests';

defineSiteTests({ test, expect, distDir: 'dist', requiredPages: ['/', '/install/'] });
```

The site passes its own `test` and `expect` because these files import
Playwright for types only. In symlink mode they live outside the site, where a
runtime import would load a second copy of `@playwright/test`, which
Playwright refuses to run with.

## Updating

Merging a change to the shipped files (`nav.ts`, `tokens.css`, `components/`,
`testing/`) tags a release ([`release.yml`](.github/workflows/release.yml)):
a patch, or a minor when a commit since the last tag is a `feat:`.

- **jellyrock.app** gets the release automatically: its `shared-ui-bump`
  workflow opens the bump PR and auto-merges it when its screenshots match the
  ones this repo's [consumer preview](.github/workflows/consumer-preview.yml)
  approved on the change's PR.
- **docs** gets a Renovate PR. Patch bumps automerge on green CI; minor bumps
  wait for review until docs has browser tests.
