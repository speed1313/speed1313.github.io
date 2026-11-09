export const SITE = {
  website: "https://speed1313.github.io", // replace this with your deployed domain
  author: "speed1313",
  profile: "",
  desc: "speed1313 Blog.",
  title: "speed1313 Blog",
  ogImage: "og.png",
  lightAndDarkMode: true,
  postPerPage: 8,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  editPost: {
    enabled: false,
    text: "Edit page",
    url: "https://github.com/speed1313/astro-paper/edit/main/",
  },
  dynamicOgImage: true,
  dir: "ltr", // "rtl" | "auto"
  lang: "en", // html lang code. Set this empty and default will be "en"
  timezone: "Asia/Tokyo", // Default global timezone (IANA format) https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
} as const;
