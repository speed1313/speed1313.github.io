import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import { SITE } from "@/config";

export const BLOG_PATH = "src/data/blog";

export const LANGS = ["ja", "en"] as const;
export type Lang = (typeof LANGS)[number];

// Each post lives in its own directory: `src/data/blog/<slug>/index.md`.
// Images and other files placed next to it can be referenced as `./file.png`.
const blog = defineCollection({
  loader: glob({ pattern: "**/index.md", base: `./${BLOG_PATH}` }),
  schema: ({ image }) =>
    z.object({
      author: z.string().default(SITE.author),
      pubDatetime: z.date(),
      modDatetime: z.date().optional().nullable(),
      title: z.string(),
      featured: z.boolean().optional(),
      draft: z.boolean().optional(),
      tags: z.array(z.string()).default(["others"]),
      ogImage: image().or(z.string()).optional(),
      description: z.string(),
      canonicalURL: z.string().optional(),
      hideEditPost: z.boolean().optional(),
      timezone: z.string().optional(),
      lang: z.enum(LANGS).default("ja"),
    }),
});

// Translations sit next to the original as `<slug>/index.<lang>.md`
// and are served at `/posts/<slug>/<lang>/`.
const blogTranslations = defineCollection({
  loader: glob({
    pattern: "**/index.*.md",
    base: `./${BLOG_PATH}`,
    generateId: ({ entry }) => entry.replace(/\.md$/, ""),
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    translatedDatetime: z.date(),
    draft: z.boolean().optional(),
  }),
});

export const collections = { blog, blogTranslations };
