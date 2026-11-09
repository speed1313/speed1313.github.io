import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import type { Root, Html, Link } from "mdast";
import type { VFile } from "vfile";
import { visit } from "unist-util-visit";

/**
 * Files placed next to a post (`src/data/blog/<slug>/foo.png`) are served at
 * `/posts/<slug>/foo.png`, so posts can reference them with relative paths.
 *
 * Markdown images (`![alt](./foo.png)`) are already resolved and optimized by
 * Astro. This handles the rest: raw HTML (`<img src="./foo.png">`, `<video>`,
 * `<a href="./paper.pdf">`) and Markdown links to non-Markdown files.
 */

const BLOG_DIR = path.resolve("src/data/blog");
const POST_FILE = /^([^/]+)\/index(\.[\w-]+)?\.md$/;
const IGNORED = new Set([".DS_Store"]);

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
};

function isRelative(url: string) {
  return !/^([a-z][a-z\d+.-]*:|\/|#|\?|@)/i.test(url) && !url.startsWith("../");
}

function toPublicUrl(postDir: string, url: string) {
  return `/posts/${postDir}/${url.replace(/^\.\//, "")}`;
}

function postDirOf(file: VFile) {
  if (!file.path) return undefined;
  const rel = path.relative(BLOG_DIR, file.path).split(path.sep).join("/");
  return POST_FILE.exec(rel)?.[1];
}

export function remarkBlogAssets() {
  return (tree: Root, file: VFile) => {
    const postDir = postDirOf(file);
    if (!postDir) return;

    visit(tree, "html", (node: Html) => {
      node.value = node.value.replace(
        /\b(src|href|poster)=(["'])([^"']+)\2/g,
        (match, attr, quote, url) =>
          isRelative(url)
            ? `${attr}=${quote}${toPublicUrl(postDir, url)}${quote}`
            : match
      );
    });

    visit(tree, "link", (node: Link) => {
      if (isRelative(node.url) && !/\.md(#.*)?$/.test(node.url)) {
        node.url = toPublicUrl(postDir, node.url);
      }
    });
  };
}

function* walk(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(file);
    else if (entry.isFile()) yield file;
  }
}

function isDraft(root: string) {
  const post = path.join(root, "index.md");
  if (!fs.existsSync(post)) return false;
  const front = fs.readFileSync(post, "utf8").split(/\n---/)[0];
  return /^draft:\s*true\s*$/m.test(front);
}

function* postAssets(): Generator<{ file: string; urlPath: string }> {
  for (const dir of fs.readdirSync(BLOG_DIR, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    const root = path.join(BLOG_DIR, dir.name);
    // Draft posts aren't published, so neither are their files.
    if (isDraft(root)) continue;
    for (const file of walk(root)) {
      if (file.endsWith(".md") || IGNORED.has(path.basename(file))) continue;
      const rel = path.relative(root, file).split(path.sep).join("/");
      yield { file, urlPath: `posts/${dir.name}/${rel}` };
    }
  }
}

export default function blogAssets(): AstroIntegration {
  return {
    name: "blog-assets",
    hooks: {
      "astro:config:setup": ({ logger }) => {
        for (const { urlPath } of postAssets()) {
          // `/posts/<slug>/index.png` is the generated OG image.
          if (/^posts\/[^/]+\/index\.png$/.test(urlPath)) {
            logger.warn(`${urlPath} is shadowed by the OG image; rename it.`);
          }
        }
      },
      "astro:server:setup": ({ server }) => {
        server.middlewares.use((req, res, next) => {
          const pathname = decodeURIComponent(
            new URL(req.url ?? "/", "http://localhost").pathname
          );
          const match = /^\/posts\/([^/]+)\/(.+)$/.exec(pathname);
          if (!match || match[2].endsWith(".md")) return next();
          const file = path.join(BLOG_DIR, match[1], match[2]);
          if (!file.startsWith(BLOG_DIR + path.sep)) return next();
          if (isDraft(path.join(BLOG_DIR, match[1]))) return next();
          if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
            return next();
          }
          const type = MIME[path.extname(file).toLowerCase()];
          if (type) res.setHeader("Content-Type", type);
          fs.createReadStream(file).pipe(res);
        });
      },
      "astro:build:done": ({ dir, logger }) => {
        const outDir = fileURLToPath(dir);
        let count = 0;
        for (const { file, urlPath } of postAssets()) {
          const dest = path.join(outDir, urlPath);
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          fs.copyFileSync(file, dest);
          count++;
        }
        logger.info(`Copied ${count} post asset(s).`);
      },
    },
  };
}
