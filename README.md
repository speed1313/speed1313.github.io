# speed1313.github.io

Source of [speed1313.github.io](https://speed1313.github.io), the personal website and blog of Issa Sugiura. Posts are published in Japanese and English.

Built with [Astro](https://astro.build) on the [AstroPaper](https://github.com/satnaing/astro-paper) theme, with [Pagefind](https://pagefind.app) for search.

## Setup

Requires Node.js 22.23.4 or later and [bun](https://bun.sh) (npm scripts also work).

```sh
bun install
npm run dev        # http://localhost:4321
```

| Command                           | What it does                                                  |
| --------------------------------- | ------------------------------------------------------------- |
| `npm run dev`                     | Local dev server                                              |
| `npm run build`                   | Type check, production build to `dist/`, and the search index |
| `npm run preview`                 | Serve the build (search only works here, not in `dev`)        |
| `npm run lint` / `npm run format` | ESLint / Prettier                                             |
| `npm run build:cv`                | Compile the CV with xelatex and copy it to `public/cv.pdf`    |

## Writing a post

Each post is a directory under `src/data/blog/`; the directory name is the URL slug.

```
src/data/blog/<slug>/
├── index.md       # the original (Japanese unless `lang: en` is set)
├── index.en.md    # the translation (index.ja.md for an English original)
└── figure.png     # images and files used by the post
```

1. Write `index.md` with this frontmatter:

   ```yaml
   ---
   title: "タイトル"
   author: speed1313
   pubDatetime: 2026-11-01
   slug: <slug>
   featured: false
   draft: false
   tags:
     - Notes # one of: Benchmarks, Models, Resources, Agents, Notes, Tips, Events, Life
   description: "A sentence or two for the post list and the OG image."
   ---
   ```

2. Write the translation next to it with only `title`, `description`, and `translatedDatetime` in its frontmatter, and the same headings, images, code, and math.
3. Refer to files next to the post with relative paths (`![alt](./figure.png)`, `<img src="./figure.png">`, `[pdf](./paper.pdf)`).

Japanese pages are served at `/posts/<slug>/` and English pages at `/en/posts/<slug>/`. OG images are generated for both languages at build time. Set `draft: true` to keep a post (and its files) out of the build.

## Publishing

`main` is protected, so every change goes through a pull request:

1. Create a branch, make the change, and check it with `npm run dev`.
2. Run `npm run lint`, `npm run format`, and `npm run build`.
3. Open a pull request and merge it.

Merging to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which builds the site and deploys it to GitHub Pages. It can also be run manually from the Actions tab.

## About page and CV

- About page content lives in `src/data/about.ts`.
- The CV source is `cv/files/cv_sugiura.tex`. After editing it, run `npm run build:cv` and commit both the source and `public/cv.pdf`.

## License

The code is based on AstroPaper and is under the [MIT License](LICENSE). Posts, images, and the CV are © Issa Sugiura.
