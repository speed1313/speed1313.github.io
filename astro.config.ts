import { defineConfig, envField } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import { transformerFileName } from "./src/utils/transformers/fileName";
import { SITE } from "./src/config";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { unified } from "@astrojs/markdown-remark";
import blogAssets, { remarkBlogAssets } from "./src/integrations/blogAssets";
import fs from "node:fs";

// Pages whose canonical URL points elsewhere, kept out of the sitemap:
// /en/about/ duplicates /about/, and an English-only post's Japanese page
// repeats the English original.
const nonCanonicalPages = new Set(["/en/about/"]);
for (const dir of fs.readdirSync("src/data/blog")) {
  const post = `src/data/blog/${dir}/index.md`;
  if (
    !fs.existsSync(post) ||
    fs.existsSync(`src/data/blog/${dir}/index.ja.md`)
  ) {
    continue;
  }
  const front = fs.readFileSync(post, "utf8").split("\n---")[0];
  const slug = /^slug:\s*(\S+)/m.exec(front)?.[1] ?? dir;
  if (/^lang:\s*en\s*$/m.test(front)) nonCanonicalPages.add(`/posts/${slug}/`);
}

// https://astro.build/config
export default defineConfig({
  site: SITE.website,
  integrations: [
    blogAssets(),
    sitemap({
      filter: page =>
        // Archives was removed and now redirects to the post list.
        !/\/archives\/$/.test(page) &&
        // Old URLs that now only redirect: translations moved to
        // /<lang>/posts/<slug>/, and the post and tag lists became the
        // home page (/posts/, /posts/<n>/, and everything under /tags/).
        !/\/posts\/[^/]+\/(en|ja)\/$/.test(page) &&
        !/\/posts\/(\d+\/)?$/.test(page) &&
        !/\/tags\//.test(page) &&
        // The search page only redirects to the search window.
        !/\/search\/$/.test(page) &&
        !nonCanonicalPages.has(new URL(page).pathname),
    }),
  ],
  // Keep Astro 6's whitespace handling, which keeps a space between inline
  // elements (Astro 7 strips it like JSX).
  compressHTML: true,
  markdown: {
    // The remark/rehype pipeline, for remark-math, rehype-katex, and the
    // blog asset plugin (Astro 7's default processor is Sätteri).
    processor: unified({
      remarkPlugins: [remarkBlogAssets, remarkMath],
      rehypePlugins: [rehypeKatex],
    }),
    shikiConfig: {
      // For more themes, visit https://shiki.style/themes
      themes: { light: "min-light", dark: "night-owl" },
      defaultColor: false,
      wrap: false,
      transformers: [
        transformerFileName({ style: "v2", hideDot: false }),
        transformerNotationHighlight(),
        transformerNotationWordHighlight(),
        transformerNotationDiff({ matchAlgorithm: "v3" }),
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ["@resvg/resvg-js"],
    },
  },
  image: {
    responsiveStyles: true,
    layout: "constrained",
  },
  env: {
    schema: {
      PUBLIC_GOOGLE_SITE_VERIFICATION: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
    },
  },
});
