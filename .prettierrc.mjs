/** @type {import('prettier').Config} */
export default {
  printWidth: 120,
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  useTabs: false,

  plugins: ['prettier-plugin-astro'],
  // The whitespace rules the consuming sites compile with (`compressHTML: true`), so a reformat
  // never changes what they render. The plugin's own default, 'jsx', is Astro 7's default.
  astroCompressHTML: 'html',

  overrides: [{ files: '*.astro', options: { parser: 'astro' } }],
};
