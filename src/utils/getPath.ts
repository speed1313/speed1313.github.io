import { BLOG_PATH } from "@/content.config";
import { slugifyStr } from "./slugify";

/**
 * Get full path of a blog post
 * @param id - id of the blog post (aka slug)
 * @param filePath - the blog post full file location
 * @param includeBase - whether to include `/posts` in return value
 * @returns blog post path
 */
export function getPath(
  id: string,
  filePath: string | undefined,
  includeBase = true
) {
  const segments = filePath
    ?.replace(BLOG_PATH, "")
    .split("/")
    .filter(path => path !== ""); // remove empty string in the segments ["", "other-path"] <- empty string will be removed

  // A post stored as `<dir>/index.md` (or `<dir>/index.<lang>.md`) is
  // represented by its slug, so its own directory is not part of the path.
  const isIndexFile = /^index(\.[\w-]+)?\.md$/.test(segments?.at(-1) ?? "");

  const pathSegments = segments
    ?.slice(0, isIndexFile ? -2 : -1) // remove the file name (and the post's own directory)
    .filter(path => !path.startsWith("_")) // exclude directories start with underscore "_"
    .map(segment => slugifyStr(segment)); // slugify each segment path

  const basePath = includeBase ? "/posts" : "";

  // Making sure `id` does not contain the directory
  const blogId = id.split("/");
  const slug = blogId.length > 0 ? blogId.slice(-1) : blogId;

  // If not inside the sub-dir, simply return the file path
  if (!pathSegments || pathSegments.length < 1) {
    return [basePath, slug].join("/");
  }

  return [basePath, ...pathSegments, slug].join("/");
}
