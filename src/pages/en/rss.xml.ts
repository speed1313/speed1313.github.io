import rss from "@astrojs/rss";
import { SITE } from "@/config";
import { getLocalizedPosts } from "@/utils/translations";

export async function GET() {
  const posts = await getLocalizedPosts("en");
  return rss({
    title: SITE.title,
    description: SITE.desc,
    site: SITE.website,
    items: posts.map(({ data, href }) => ({
      link: href,
      title: data.title,
      description: data.description,
      pubDate: new Date(data.modDatetime ?? data.pubDatetime),
    })),
  });
}
