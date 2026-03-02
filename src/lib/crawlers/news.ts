/**
 * News RSS Crawler
 * Parses biotech RSS feeds and filters entries by longevity-related keywords.
 * Returns raw items for downstream synthesis.
 */

import Parser from "rss-parser";
import { NEWS_FEEDS, LONGEVITY_KEYWORDS } from "@/lib/constants";
import type { RawItem } from "@/types";

export async function crawlNews(): Promise<RawItem[]> {
  const items: RawItem[] = [];
  const parser = new Parser();

  for (const { name: sourceName, url: feedUrl } of NEWS_FEEDS) {
    try {
      const feed = await parser.parseURL(feedUrl);
      const entries = (feed.items ?? []).slice(0, 20);

      for (const entry of entries) {
        const title = entry.title ?? "";
        const summary =
          entry.summary ?? entry.contentSnippet ?? entry.content ?? "";
        const link = entry.link ?? "";

        // Keyword filter: check if any longevity keyword appears in the
        // combined title + summary text
        const text = `${title} ${summary}`.toLowerCase();
        const isRelevant = LONGEVITY_KEYWORDS.some((kw) =>
          text.includes(kw)
        );

        if (!isRelevant) continue;

        items.push({
          title,
          abstract: summary,
          sourceUrl: link,
          source: sourceName,
          sourceType: "news",
          publishedDate: entry.pubDate ?? entry.isoDate,
        });
      }
    } catch (feedErr) {
      console.error(`News feed error for "${sourceName}":`, feedErr);
    }
  }

  console.log(`News: ${items.length} items fetched`);
  return items;
}
