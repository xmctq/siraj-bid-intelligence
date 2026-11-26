export type DocumentPage = { pageNumber: number; text: string };

/**
 * Neutralises anything in the document that could close our wrapper tags and smuggle
 * text outside the "untrusted data" boundary.
 */
function escapeTags(text: string): string {
  return text.replace(/<\/?\s*(page|document)\b[^>]*>/gi, (match) => match.replace(/</g, "‹").replace(/>/g, "›"));
}

export function formatDocument(pages: DocumentPage[]): string {
  const body = pages
    .map((page) => `<page number="${page.pageNumber}">\n${escapeTags(page.text) || "(no text on this page)"}\n</page>`)
    .join("\n");
  return `<document>\n${body}\n</document>`;
}

const STOP_WORDS = new Set(
  "the a an and or of to in on for is are be with what which who when where how does do this that tender rfp document any there it its by as at from".split(
    " ",
  ),
);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

/**
 * Keeps prompts within budget for long documents: scores pages by query-term frequency
 * (with a mild IDF weight) and returns the best pages in reading order. Short documents
 * are returned whole, which gives the model the most context.
 */
export function selectRelevantPages(pages: DocumentPage[], query: string, maxChars: number): DocumentPage[] {
  const totalChars = pages.reduce((sum, page) => sum + page.text.length, 0);
  if (totalChars <= maxChars) return pages;

  const queryTerms = [...new Set(tokenize(query))];
  const pageTokens = pages.map((page) => tokenize(page.text));
  const documentFrequency = new Map<string, number>();
  for (const term of queryTerms) {
    documentFrequency.set(term, pageTokens.filter((tokens) => tokens.includes(term)).length);
  }

  const scored = pages.map((page, index) => {
    const tokens = pageTokens[index] ?? [];
    let score = 0;
    for (const term of queryTerms) {
      const tf = tokens.filter((token) => token === term).length;
      if (tf > 0) score += (1 + Math.log(tf)) * Math.log(1 + pages.length / (documentFrequency.get(term) ?? 1));
    }
    // The first pages usually hold the tender summary and key dates.
    if (page.pageNumber <= 2) score += 0.5;
    return { page, score };
  });

  const selected: DocumentPage[] = [];
  let used = 0;
  for (const { page } of scored.sort((a, b) => b.score - a.score)) {
    if (used + page.text.length > maxChars) continue;
    selected.push(page);
    used += page.text.length;
  }
  return selected.sort((a, b) => a.pageNumber - b.pageNumber);
}
