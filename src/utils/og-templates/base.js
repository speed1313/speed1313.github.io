import fs from "node:fs";
import { loadDefaultJapaneseParser } from "budoux";
import satori from "satori";
import { SITE } from "@/config";
import loadGoogleFonts from "../loadGoogleFont";

// The favicon's bird mark, shown next to the site name.
const mark = `data:image/svg+xml;base64,${fs
  .readFileSync("public/favicon.svg")
  .toString("base64")}`;

const parser = loadDefaultJapaneseParser();

/** Approximate width in em of text in Noto Sans JP Bold. */
const emWidth = text =>
  [...text].reduce((sum, ch) => {
    if (ch === " ") return sum + 0.25;
    if (/[A-Z]/.test(ch)) return sum + 0.64;
    if (/[a-z0-9]/.test(ch)) return sum + 0.52;
    if (/[\u0000-\u024f]/.test(ch)) return sum + 0.32;
    return sum + 1;
  }, 0);

// Runs of kanji or katakana, each with the hiragana after it.
const SCRIPT_RUN =
  /[\u4e00-\u9fff々]+[\u3040-\u309f]*|[\u30a0-\u30ffー]+[\u3040-\u309f]*|[^\u4e00-\u9fff々\u30a0-\u30ffー]+/g;

/**
 * Words and Japanese phrases; lines break only between them. Phrases too
 * long to fit a line well are split where the script changes, e.g. "大規模日本語"
 * and "マルチモーダル".
 */
const tokenize = text => {
  const tokens = text
    .split(/(?<= )/)
    .flatMap(word => parser.parse(word))
    .flatMap(phrase =>
      emWidth(phrase) > 12 ? (phrase.match(SCRIPT_RUN) ?? [phrase]) : [phrase]
    );
  // Keep opening brackets with the text they open.
  for (let i = 0; i < tokens.length - 1; i++) {
    const [, rest, open] = /^(.*?)([(（「『【]+)$/.exec(tokens[i]) ?? [];
    if (open) {
      tokens[i] = rest;
      tokens[i + 1] = open + tokens[i + 1];
    }
  }
  return tokens.filter(Boolean);
};

/**
 * Split tokens into `count` lines with the shortest longest line, so the
 * lines come out about even. Returns the lines and that longest width.
 */
const balance = (tokens, count) => {
  const n = tokens.length;
  const width = (i, j) => emWidth(tokens.slice(i, j).join("").trimEnd());
  // best[k][j]: the longest line when the first j tokens fill k lines.
  const best = Array.from({ length: count + 1 }, () =>
    Array(n + 1).fill(Infinity)
  );
  const from = Array.from({ length: count + 1 }, () => Array(n + 1).fill(0));
  best[0][0] = 0;
  for (let k = 1; k <= count; k++) {
    for (let j = 1; j <= n; j++) {
      for (let i = k - 1; i < j; i++) {
        const longest = Math.max(best[k - 1][i], width(i, j));
        if (longest < best[k][j]) {
          best[k][j] = longest;
          from[k][j] = i;
        }
      }
    }
  }
  const lines = [];
  for (let k = count, j = n; k > 0; k--) {
    const i = from[k][j];
    lines.unshift(tokens.slice(i, j).join("").trim());
    j = i;
  }
  return { lines, longest: best[count][n] };
};

/**
 * The largest font size (and its lines) at which the title fits: up to
 * two lines at the largest size, three below it.
 */
const layoutTitle = (title, maxWidth = 980) => {
  const tokens = tokenize(title);
  for (const [size, maxLines] of [
    [80, 2],
    [68, 3],
    [58, 3],
    [50, 3],
  ]) {
    for (let count = 1; count <= Math.min(maxLines, tokens.length); count++) {
      const { lines, longest } = balance(tokens, count);
      if (longest * size <= maxWidth) return { size, lines };
    }
  }
  return { size: 44, lines: balance(tokens, 3).lines };
};

/**
 * A 1200x630 image in the site's black and white: an optional label (the
 * post's tag) above a large title, and the site address with its mark under
 * it, all centered so crops of the top and bottom keep them.
 */
export default async ({
  title,
  label,
  footer = new URL(SITE.website).hostname,
  dark = false,
}) => {
  const { size, lines } = layoutTitle(title);
  const fg = dark ? "#f5f5f7" : "#1d1d1f";
  const bg = dark ? "#1d1d1f" : "#fdfdfd";
  return satori(
    {
      type: "div",
      props: {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 110px",
          background: bg,
          color: fg,
          fontFamily: "Noto Sans JP",
        },
        children: [
          label && {
            type: "div",
            props: {
              style: { display: "flex", fontSize: 28, opacity: 0.5 },
              children: label,
            },
          },
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginTop: label ? 20 : 0,
                fontSize: size,
                fontWeight: 700,
                lineHeight: 1.3,
                letterSpacing: "-0.01em",
              },
              // One element per line, broken between phrases above.
              children: lines.map(line => ({
                type: "div",
                props: { style: { whiteSpace: "nowrap" }, children: line },
              })),
            },
          },
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginTop: 44,
                fontSize: 26,
                fontWeight: 700,
                opacity: 0.85,
              },
              children: [
                {
                  type: "img",
                  props: { src: mark, width: 40, height: 40 },
                },
                footer,
              ],
            },
          },
        ].filter(Boolean),
      },
    },
    {
      width: 1200,
      height: 630,
      embedFont: true,
      fonts: await loadGoogleFonts(title + (label ?? "") + footer),
    }
  );
};
