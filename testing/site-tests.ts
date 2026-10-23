// The browser tests every JellyRock site runs against its production build. Each one guards
// something a dependency bump can break without failing `astro check` or the build: a script
// that errors or that the production CSP blocks, an asset that 404s, a link that redirects,
// or a page that overflows a phone screen.
//
// A site calls defineSiteTests from one of its spec files, passing its own `test` and `expect`
// (see checks.ts for why), and adds its own tests beside it.
/// <reference types="node" />
import fs from 'node:fs';
import path from 'node:path';
import type { test as playwrightTest, expect as playwrightExpect } from '@playwright/test';
import { sitemapPaths, watchForProblems, collectCspViolations, scrollThrough, brokenImages } from './checks';

export interface SiteTestOptions {
  test: typeof playwrightTest;
  expect: typeof playwrightExpect;
  /** The site's build, relative to the current directory. */
  distDir: string;
  /** Pages the sitemap must list, e.g. ['/', '/install/']. */
  requiredPages?: string[];
}

export function defineSiteTests({ test, expect, distDir, requiredPages = ['/'] }: SiteTestOptions) {
  const pages = sitemapPaths(distDir);

  test('the sitemap lists the site pages', () => {
    expect(pages).toEqual(expect.arrayContaining(requiredPages));
  });

  for (const pagePath of pages) {
    test(`${pagePath} loads cleanly`, async ({ page, baseURL }) => {
      const problems = await watchForProblems(page, new URL(baseURL!).origin);

      const response = await page.goto(pagePath);
      expect(response?.status(), 'HTTP status').toBe(200);
      // The sitemap URL itself must answer 200: a redirect means the sitemap, links and canonical
      // disagree with the URL the server actually serves (directories get a trailing slash).
      expect(response?.request().redirectedFrom()?.url(), 'sitemap URL redirects').toBeUndefined();
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical && new URL(canonical).pathname, 'canonical URL').toBe(pagePath);
      await scrollThrough(page);
      await collectCspViolations(page, problems);

      expect(problems.consoleErrors, 'console errors').toEqual([]);
      expect(problems.cspViolations, 'blocked by the production CSP').toEqual([]);
      expect(problems.failedRequests, 'failed requests').toEqual([]);
      expect(problems.externalRequests, 'requests to other origins (the CSP blocks these)').toEqual([]);

      await expect(page.locator('header.jr-site-header'), 'shared header').toBeVisible();
      await expect(page.locator('footer').first(), 'footer').toBeVisible();
      await expect(page.locator('h1').first(), 'page heading').toBeVisible();
      await expect(page, 'page title').toHaveTitle(/\S/);

      expect(await brokenImages(page), 'images that failed to render').toEqual([]);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, 'page wider than the screen (sideways scrolling)').toBeLessThanOrEqual(0);
    });
  }

  test('every internal link and in-page anchor resolves', async ({ request }) => {
    const htmlFiles = fs.globSync(path.join(distDir, '**/*.html'));
    const links = new Map<string, string>();
    for (const file of htmlFiles) {
      const html = fs.readFileSync(file, 'utf8');
      for (const [, href] of html.matchAll(/<a\s[^>]*href="([^"]+)"/g)) {
        if (href.startsWith('/') && !href.startsWith('//')) links.set(href, path.relative(distDir, file));
      }
    }
    expect(links.size).toBeGreaterThan(0);

    const broken: string[] = [];
    for (const [href, from] of links) {
      const [target, anchor] = href.split('#');
      // maxRedirects 0: a link that only works through a redirect (e.g. /features → /features/)
      // costs every visitor a round trip, so it counts as broken.
      const res = await request.get(target || '/', { maxRedirects: 0 });
      if (res.status() !== 200) {
        const location = res.headers()['location'];
        broken.push(`${href} (on ${from}) → ${res.status()}${location ? ` ${location}` : ''}`);
        continue;
      }
      if (anchor && !(await res.text()).includes(`id="${anchor}"`)) broken.push(`${href} (on ${from}) → no #${anchor}`);
    }
    expect(broken).toEqual([]);
  });

  test('a missing page returns 404', async ({ request }) => {
    expect((await request.get('/this-page-does-not-exist/')).status()).toBe(404);
  });
}
