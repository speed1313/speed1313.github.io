import type { APIRoute } from "astro";
import type { CollectionEntry } from "astro:content";
import type { Lang } from "@/content.config";
import { SITE } from "@/config";
import { getPath } from "@/utils/getPath";
import { generateOgImageForPost } from "@/utils/generateOgImages";
import { getLocalizedPosts } from "@/utils/translations";

/**
 * OG images for the posts in a language, served next to each post page
 * (/posts/<slug>/index.png, /en/posts/<slug>/index.png), so each image
 * shows the title in that page's language.
 */
export const ogImagePaths = async (lang: Lang) => {
  if (!SITE.dynamicOgImage) return [];
  const posts = await getLocalizedPosts(lang, { all: true });
  return posts
    .filter(({ data }) => !data.ogImage)
    .map(post => ({
      params: { slug: getPath(post.id, post.filePath, false) },
      props: post,
    }));
};

export const ogImageResponse: APIRoute = async ({ props }) => {
  if (!SITE.dynamicOgImage) {
    return new Response(null, { status: 404, statusText: "Not found" });
  }
  const buffer = await generateOgImageForPost(props as CollectionEntry<"blog">);
  return new Response(new Uint8Array(buffer), {
    headers: { "Content-Type": "image/png" },
  });
};
