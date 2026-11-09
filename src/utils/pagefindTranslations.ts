// Pagefind's UI strings for Japanese pages. The Default UI of Pagefind
// 1.6.0 renders in English regardless of <html lang>, so pass these
// explicitly (copied from Pagefind's own ja.json).
const JA = {
  placeholder: "検索",
  clear_search: "クリア",
  load_more: "次を読み込む",
  search_label: "このサイトを検索",
  filters_label: "フィルタ",
  zero_results: "[SEARCH_TERM]の検索に一致する情報はありませんでした",
  many_results: "[SEARCH_TERM]の[COUNT]件の検索結果",
  one_result: "[SEARCH_TERM]の[COUNT]件の検索結果",
  alt_search:
    "[SEARCH_TERM]の検索に一致する情報はありませんでした。[DIFFERENT_TERM]の検索結果を表示しています",
  search_suggestion:
    "[SEARCH_TERM]の検索に一致する情報はありませんでした。次のいずれかの検索を試してください",
  searching: "[SEARCH_TERM]を検索しています",
};

/** UI strings for the page's language, or undefined for Pagefind's own. */
export const pagefindTranslations = () =>
  document.documentElement.lang === "ja" ? JA : undefined;
