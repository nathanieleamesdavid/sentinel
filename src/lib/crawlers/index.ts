/**
 * Crawl Orchestrator
 * Runs all three crawlers, synthesizes each item with Claude, filters by
 * relevance, inserts into the database, and logs results.
 */

import crypto from "crypto";
import { crawlPubmed } from "@/lib/crawlers/pubmed";
import { crawlClinicalTrials } from "@/lib/crawlers/clinical-trials";
import { crawlNews } from "@/lib/crawlers/news";
import { synthesize } from "@/lib/synthesis/synthesize";
import { insertInsight, logCrawl } from "@/lib/db/queries";
import { RELEVANCE_THRESHOLD } from "@/lib/constants";
import type { RawItem } from "@/types";

export interface CrawlResult {
  source: string;
  found: number;
  newItems: number;
}

function urlHash(url: string): string {
  return crypto.createHash("md5").update(url).digest("hex");
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Process a batch of raw items: synthesize, filter by relevance, and insert
 * into the database. Returns the count of newly inserted items.
 */
async function processItems(
  items: RawItem[],
  sourceName: string
): Promise<number> {
  let newItems = 0;

  for (const item of items) {
    try {
      const sourceType = (item.sourceType ?? "news") as "pubmed" | "clinical_trial" | "news";
      const synth = await synthesize(item, sourceType);
      await delay(300); // Rate limit: avoid hammering the API

      if (!synth || synth.relevanceScore < RELEVANCE_THRESHOLD) {
        continue;
      }

      const hash = urlHash(item.sourceUrl);

      const inserted = await insertInsight({
        title: item.title,
        synthesis: synth.synthesis,
        path: synth.path,
        urgency: synth.urgency,
        domain: synth.domain,
        source: item.source ?? sourceName,
        sourceType: sourceType,
        sourceUrl: item.sourceUrl,
        company: item.company ?? synth.company,
        stage: item.stage ?? synth.stage,
        relevanceScore: synth.relevanceScore,
        tags: synth.tags,
        rawText: item.abstract,
        urlHash: hash,
        country: synth.country,
      });

      if (inserted) {
        newItems++;
      }
    } catch (itemErr) {
      console.error(
        `Error processing item "${item.title.slice(0, 60)}":`,
        itemErr
      );
    }
  }

  return newItems;
}

export async function runCrawl(
  lookbackDays: number = 7
): Promise<CrawlResult[]> {
  console.log("=".repeat(50));
  console.log(`Starting crawl (lookback=${lookbackDays} days)`);
  console.log("=".repeat(50));

  const results: CrawlResult[] = [];

  // --- PubMed ---
  let pubmedItems: RawItem[] = [];
  try {
    pubmedItems = await crawlPubmed(lookbackDays);
  } catch (err) {
    console.error("PubMed crawler failed:", err);
  }
  const pubmedNew = await processItems(pubmedItems, "PubMed");
  results.push({ source: "PubMed", found: pubmedItems.length, newItems: pubmedNew });
  await logCrawl("PubMed", pubmedItems.length, pubmedNew);

  // --- ClinicalTrials ---
  let ctItems: RawItem[] = [];
  try {
    ctItems = await crawlClinicalTrials(lookbackDays);
  } catch (err) {
    console.error("ClinicalTrials crawler failed:", err);
  }
  const ctNew = await processItems(ctItems, "ClinicalTrials");
  results.push({ source: "ClinicalTrials", found: ctItems.length, newItems: ctNew });
  await logCrawl("ClinicalTrials", ctItems.length, ctNew);

  // --- News ---
  let newsItems: RawItem[] = [];
  try {
    newsItems = await crawlNews();
  } catch (err) {
    console.error("News crawler failed:", err);
  }
  const newsNew = await processItems(newsItems, "News");
  results.push({ source: "News", found: newsItems.length, newItems: newsNew });
  await logCrawl("News", newsItems.length, newsNew);

  console.log("Crawl complete.", JSON.stringify(results));
  return results;
}
