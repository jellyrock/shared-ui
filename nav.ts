/**
 * Shared navigation data for all JellyRock sites (homepage, user docs, dev docs).
 * Every site consumes this at build time so links stay in sync.
 */

export interface NavLink {
	text: string;
	href: string;
	/** Optional leading icon keyword. Renderer maps this to an inline SVG. */
	icon?: 'heart';
}

export interface FooterSection {
	title: string;
	links: NavLink[];
}

/** Top navigation links (shown between logo and Donate button) */
export const headerLinks: NavLink[] = [
	{ text: 'Install', href: 'https://jellyrock.app/install' },
	{ text: 'Features', href: 'https://jellyrock.app/features' },
	{ text: 'Screenshots', href: 'https://jellyrock.app/screenshots' },
	{ text: 'Documentation', href: 'https://docs.jellyrock.app' },
	{ text: 'Contact', href: 'https://jellyrock.app/contact' },
];

export const donateLink: NavLink = {
	text: 'Donate',
	href: 'https://jellyrock.app/donate',
};

export const siteHome: NavLink = {
	text: 'JellyRock',
	href: 'https://jellyrock.app',
};

/** Main footer sections (3-column layout) */
export const footerSections: FooterSection[] = [
	{
		title: 'App',
		links: [
			{ text: 'Install', href: 'https://jellyrock.app/install' },
			{ text: 'Features', href: 'https://jellyrock.app/features' },
			{ text: 'Screenshots', href: 'https://jellyrock.app/screenshots' },
		],
	},
	{
		title: 'Documentation',
		links: [
			{ text: 'User Docs', href: 'https://docs.jellyrock.app' },
			{ text: 'Dev Docs', href: 'https://dev.jellyrock.app' },
			{ text: 'API Reference', href: 'https://api.jellyrock.app' },
		],
	},
	{
		title: 'Community',
		links: [
			{ text: 'Source Code', href: 'https://github.com/jellyrock/jellyrock' },
			{ text: 'Matrix Chat', href: 'https://matrix.to/#/#jellyrock-app:matrix.org' },
			{ text: 'Translate', href: 'https://translate.jellyrock.app' },
			{ text: 'Donate', href: 'https://jellyrock.app/donate', icon: 'heart' },
		],
	},
];

/** Utility links rendered in the bottom row of the footer, alongside socials
 * and the license footnote. These are all "find my way around" / legal links. */
export const utilityLinks: NavLink[] = [
	{ text: 'Home', href: 'https://jellyrock.app/' },
	{ text: 'Privacy Policy', href: 'https://jellyrock.app/privacy' },
	{ text: 'Terms of Use', href: 'https://jellyrock.app/terms' },
	{ text: 'Sitemap', href: 'https://jellyrock.app/sitemap' },
];

export const socialLinks: NavLink[] = [
	{ text: 'GitHub', href: 'https://github.com/jellyrock/jellyrock' },
	{ text: 'Matrix', href: 'https://matrix.to/#/#jellyrock-app:matrix.org' },
];

export const siteDescription =
	'A free, open source Jellyfin client for Roku devices. Forked from the legacy jellyfin-roku app v2.2.5 and developed with a focus on stability, performance, and a great viewing experience. No ads, no tracking, no subscriptions.';

export const licenseFootnote = '';

/**
 * Convert an absolute URL to a relative path if it points to the same origin
 * as `currentOrigin`. Otherwise return the absolute URL unchanged.
 *
 * `currentOrigin` should be the configured site origin (Astro.site), not the
 * request URL — so it's stable between dev and prod.
 */
export function resolveHref(href: string, currentOrigin: string): string {
	try {
		const linkUrl = new URL(href);
		const current = new URL(currentOrigin);
		if (linkUrl.origin === current.origin) {
			return linkUrl.pathname + linkUrl.search + linkUrl.hash;
		}
		return href;
	} catch {
		return href;
	}
}
