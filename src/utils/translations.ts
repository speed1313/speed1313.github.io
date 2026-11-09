import { getCollection, type CollectionEntry } from "astro:content";
import type { Lang } from "@/content.config";
import { getPath } from "./getPath";
import getSortedPosts from "./getSortedPosts";

export type Translation = {
  entry: CollectionEntry<"blogTranslations">;
  lang: Lang;
};

export const LANG_LABELS: Record<Lang, string> = {
  ja: "日本語",
  en: "English",
};

/** Served without a prefix; every other language lives under `/<lang>/`. */
export const DEFAULT_LANG: Lang = "ja";

export const otherLang = (lang: Lang): Lang => (lang === "ja" ? "en" : "ja");

/** Prefix a site path (starting with "/") with the language. */
export function localePath(lang: Lang, path: string) {
  return lang === DEFAULT_LANG ? path : `/${lang}${path}`;
}

/** Split a pathname into its language and the path without the prefix. */
export function splitLocale(pathname: string): { lang: Lang; path: string } {
  const match = /^\/(en)(\/.*|$)/.exec(pathname);
  return match
    ? { lang: match[1] as Lang, path: match[2] || "/" }
    : { lang: DEFAULT_LANG, path: pathname };
}

const postDir = (filePath: string | undefined) =>
  filePath?.split("/").slice(0, -1).join("/");

/** Translations of a post, i.e. `index.<lang>.md` files next to it. */
export async function getTranslations(
  post: CollectionEntry<"blog">
): Promise<Translation[]> {
  const dir = postDir(post.filePath);
  const entries = await getCollection(
    "blogTranslations",
    ({ data, filePath }) => !data.draft && postDir(filePath) === dir
  );
  return entries.flatMap(entry => {
    const lang = /\/index\.([\w-]+)$/.exec(entry.id)?.[1] as Lang | undefined;
    return lang && lang !== post.data.lang ? [{ entry, lang }] : [];
  });
}

/**
 * What a post shows in a language: the original, a translation, or nothing
 * (`null`). The default language falls back to the original so every post
 * stays listed there.
 */
export function getVersion(
  post: CollectionEntry<"blog">,
  translations: Translation[],
  lang: Lang
): { translation?: Translation; fallback: boolean } | null {
  if (post.data.lang === lang) return { fallback: false };
  const translation = translations.find(t => t.lang === lang);
  if (translation) return { translation, fallback: false };
  return lang === DEFAULT_LANG ? { fallback: true } : null;
}

/** URL of a post in a language (without trailing slash, like getPath). */
export const postHref = (post: CollectionEntry<"blog">, lang: Lang) =>
  localePath(lang, getPath(post.id, post.filePath));

/** A post as shown in one language, usable wherever a blog entry is. */
export type LocalizedPost = CollectionEntry<"blog"> & {
  href: string;
  original: CollectionEntry<"blog">;
  translations: Translation[];
  translation?: Translation;
};

/**
 * Posts available in a language, with titles in that language. Sorted and
 * filtered for listing (no scheduled posts) unless `all` is set.
 */
export async function getLocalizedPosts(
  lang: Lang,
  { all = false } = {}
): Promise<LocalizedPost[]> {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  const localized = await Promise.all(
    posts.map(async post => {
      const translations = await getTranslations(post);
      const version = getVersion(post, translations, lang);
      if (!version) return [];
      const { translation } = version;
      return [
        {
          ...post,
          data: translation
            ? {
                ...post.data,
                title: translation.entry.data.title,
                description: translation.entry.data.description,
                lang: translation.lang,
              }
            : post.data,
          href: postHref(post, lang),
          original: post,
          translations,
          translation,
        },
      ];
    })
  );
  return all ? localized.flat() : getSortedPosts(localized.flat());
}

/** hreflang links for a page that exists in every language. */
export const listAlternates = (path: string) => [
  ...(["ja", "en"] as Lang[]).map(lang => ({
    lang,
    href: localePath(lang, path),
  })),
  { lang: "x-default", href: path },
];
