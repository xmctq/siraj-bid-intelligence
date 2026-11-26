export type Inline = { type: "text"; value: string } | { type: "bold"; value: string } | { type: "cite"; index: number };
export type Block = { type: "paragraph"; content: Inline[] } | { type: "list"; items: Inline[][] };

const INLINE_PATTERN = /(\*\*[^*]+\*\*|\[\d+\])/g;

export function parseInline(text: string): Inline[] {
  return text
    .split(INLINE_PATTERN)
    .filter((part) => part.length > 0)
    .map((part): Inline => {
      if (part.startsWith("**") && part.endsWith("**")) return { type: "bold", value: part.slice(2, -2) };
      const cite = /^\[(\d+)\]$/.exec(part);
      if (cite) return { type: "cite", index: Number(cite[1]) };
      return { type: "text", value: part };
    });
}

/**
 * Parses the assistant's constrained plain-text format (paragraphs, "- " bullets, **bold**, [n] citations)
 * into blocks rendered as React elements, never as HTML, so model output can't inject markup.
 */
export function parseAnswer(text: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: "paragraph", content: parseInline(paragraph.join(" ")) });
    paragraph = [];
  };
  const flushList = () => {
    if (list.length) blocks.push({ type: "list", items: list.map(parseInline) });
    list = [];
  };

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    const bullet = /^(?:[-*•]|\d+[.)])\s+(.*)$/.exec(line);
    if (bullet) {
      flushParagraph();
      list.push(bullet[1] ?? "");
    } else if (line === "") {
      flushParagraph();
      flushList();
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushList();
  return blocks;
}
