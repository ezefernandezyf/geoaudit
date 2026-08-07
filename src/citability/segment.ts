import type { Cheerio, CheerioAPI } from "cheerio";
import type { AnyNode, ContentBlock } from "./types";
import { countSentences, countWords } from "./text";

/**
 * H2/H3 segmentation (RCI-2, RCI-13).
 *
 * Every H2/H3 in document order starts a new block; all paragraph, table and
 * list content that follows belongs to the most recent block until the next
 * heading. An H3 therefore becomes a sub-block of the preceding H2 section,
 * and the H2 block keeps the text that appears before its first H3 (RCI-2).
 * Content before the first heading is prepended to the first block so no
 * real text is dropped.
 *
 * When the extracted content has no H2/H3 at all, the whole content becomes a
 * single block (RCI-13). Bare text not wrapped in `<p>` is still captured.
 *
 * Signature note (deviation from design): design wrote `segmentBlocks($)`, but
 * segmentation must run over the EXTRACTED subset — running over the whole
 * document would leak nav/footer text into blocks. The stage boundary mirrors
 * the pipeline: extractMainContent($) -> segmentBlocks(extracted).
 */

const SEGMENT_SELECTOR = "h2, h3, p, table, ul, ol";

function newBlock(
  heading: string,
  headingLevel: 0 | 2 | 3,
  id: string,
  prelude: { paragraphs: string[]; hasTable: boolean; hasList: boolean },
): ContentBlock {
  return {
    id,
    heading,
    headingLevel,
    content: "",
    text: heading,
    paragraphs: [...prelude.paragraphs],
    wordCount: 0,
    sentenceCount: 0,
    hasTable: prelude.hasTable,
    hasList: prelude.hasList,
    hasQuestionHeading: heading.length > 0 && heading.endsWith("?"),
  };
}

function finalize(block: ContentBlock): void {
  block.content = block.paragraphs.join("\n");
  block.text = block.heading
    ? `${block.heading} ${block.content}`.trim()
    : block.content;
  block.wordCount = countWords(block.content);
  block.sentenceCount = countSentences(block.content);
}

export function segmentBlocks(
  root: Cheerio<AnyNode>,
  $: CheerioAPI,
): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const preludeParagraphs: string[] = [];
  let preludeHasTable = false;
  let preludeHasList = false;
  let current: ContentBlock | null = null;

  root.find(SEGMENT_SELECTOR).each((_index, element) => {
    const tag = element.tagName.toLowerCase();
    if (tag === "h2" || tag === "h3") {
      const heading = $(element).text().trim();
      current = newBlock(
        heading,
        tag === "h2" ? 2 : 3,
        String(blocks.length + 1),
        {
          paragraphs: preludeParagraphs,
          hasTable: preludeHasTable,
          hasList: preludeHasList,
        },
      );
      blocks.push(current);
    } else if (current !== null) {
      if (tag === "p") current.paragraphs.push($(element).text().trim());
      else if (tag === "table") current.hasTable = true;
      else if (tag === "ul" || tag === "ol") current.hasList = true;
    } else {
      // Content before the first heading: collected and merged into the
      // first block so it is never lost.
      if (tag === "p") preludeParagraphs.push($(element).text().trim());
      else if (tag === "table") preludeHasTable = true;
      else if (tag === "ul" || tag === "ol") preludeHasList = true;
    }
  });

  if (blocks.length === 0) {
    const block = newBlock("", 0, "1", {
      paragraphs: preludeParagraphs,
      hasTable: preludeHasTable,
      hasList: preludeHasList,
    });
    if (block.paragraphs.length === 0 && root.text().trim().length > 0) {
      block.paragraphs = [root.text().trim()];
    }
    finalize(block);
    blocks.push(block);
  } else {
    for (const block of blocks) finalize(block);
  }

  return blocks;
}
