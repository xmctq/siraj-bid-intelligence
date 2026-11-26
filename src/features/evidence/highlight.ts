export type TextSegment = { text: string; highlighted: boolean };

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildPattern(words: string[]): RegExp | null {
  if (words.length === 0) return null;
  return new RegExp(words.map(escapeRegExp).join("[\\s\\W]+"), "i");
}

/**
 * Locates a quote inside page text, tolerating whitespace/punctuation differences between
 * the model's quote and the extracted text. Falls back to the quote's first words.
 */
export function splitByQuote(text: string, quote: string | undefined): TextSegment[] {
  if (!quote) return [{ text, highlighted: false }];
  const words = quote
    .replace(/[“”"'‘’…]/g, " ")
    .split(/[\s\W]+/u)
    .filter(Boolean);

  for (const candidate of [words, words.slice(0, 8), words.slice(0, 5)]) {
    if (candidate.length < Math.min(3, words.length)) continue;
    const pattern = buildPattern(candidate);
    const match = pattern?.exec(text);
    if (match && match.index !== undefined) {
      return [
        { text: text.slice(0, match.index), highlighted: false },
        { text: match[0], highlighted: true },
        { text: text.slice(match.index + match[0].length), highlighted: false },
      ].filter((segment) => segment.text.length > 0);
    }
  }
  return [{ text, highlighted: false }];
}
