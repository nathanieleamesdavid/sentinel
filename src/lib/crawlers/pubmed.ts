/**
 * PubMed Crawler
 * Searches PubMed E-utilities for aging/longevity research papers and returns
 * raw items for downstream synthesis.
 */

import { XMLParser } from "fast-xml-parser";
import { SEARCH_TERMS } from "@/lib/constants";
import type { RawItem } from "@/types";

const ESEARCH_BASE =
  "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";
const EFETCH_BASE =
  "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract plain text from an XML text node that may be a string, an object
 * with a `#text` property, or an array of such nodes.
 */
function extractText(node: unknown): string {
  if (node == null) return "";
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) {
    return node
      .map((n) =>
        typeof n === "object" && n !== null && "#text" in n
          ? String((n as Record<string, unknown>)["#text"])
          : String(n)
      )
      .join(" ");
  }
  if (typeof node === "object" && "#text" in (node as Record<string, unknown>)) {
    return String((node as Record<string, unknown>)["#text"]);
  }
  return String(node);
}

export async function crawlPubmed(
  daysBack: number
): Promise<RawItem[]> {
  const items: RawItem[] = [];
  const xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
  });

  for (const term of SEARCH_TERMS) {
    try {
      // Step 1: Search for PubMed IDs via esearch (JSON response)
      const searchParams = new URLSearchParams({
        db: "pubmed",
        term,
        reldate: String(daysBack),
        datetype: "pdat",
        retmax: "20",
        retmode: "json",
      });
      const searchUrl = `${ESEARCH_BASE}?${searchParams.toString()}`;
      const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(15_000) });

      if (!searchRes.ok) {
        console.error(
          `PubMed esearch failed for "${term}": HTTP ${searchRes.status}`
        );
        await delay(500);
        continue;
      }

      const searchData = await searchRes.json();
      const ids: string[] =
        searchData?.esearchresult?.idlist ?? [];

      if (ids.length === 0) {
        await delay(500);
        continue;
      }

      // Step 2: Fetch abstracts via efetch (XML response)
      const fetchParams = new URLSearchParams({
        db: "pubmed",
        id: ids.join(","),
        rettype: "abstract",
        retmode: "xml",
      });
      const fetchUrl = `${EFETCH_BASE}?${fetchParams.toString()}`;
      const fetchRes = await fetch(fetchUrl, { signal: AbortSignal.timeout(20_000) });

      if (!fetchRes.ok) {
        console.error(
          `PubMed efetch failed for "${term}": HTTP ${fetchRes.status}`
        );
        await delay(500);
        continue;
      }

      const xml = await fetchRes.text();
      const parsed = xmlParser.parse(xml);

      // Normalise: PubmedArticleSet.PubmedArticle can be a single object or array
      let articles = parsed?.PubmedArticleSet?.PubmedArticle;
      if (!articles) {
        await delay(500);
        continue;
      }
      if (!Array.isArray(articles)) {
        articles = [articles];
      }

      for (const art of articles) {
        try {
          const medline = art.MedlineCitation;
          if (!medline) continue;

          const article = medline.Article;
          if (!article) continue;

          const title = extractText(article.ArticleTitle);
          const abstractNode = article.Abstract?.AbstractText;
          const abstract = extractText(abstractNode);
          const pmid = extractText(medline.PMID);
          const sourceUrl = `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;

          // Try to extract a published date
          const dateNode =
            article.Journal?.JournalIssue?.PubDate;
          let publishedDate: string | undefined;
          if (dateNode) {
            const year = extractText(dateNode.Year);
            const month = extractText(dateNode.Month);
            const day = extractText(dateNode.Day);
            if (year) {
              publishedDate = [year, month || "01", day || "01"].join("-");
            }
          }

          items.push({
            title,
            abstract,
            sourceUrl,
            source: "PubMed",
            sourceType: "pubmed",
            publishedDate,
          });
        } catch (artErr) {
          console.error("PubMed article parse error:", artErr);
        }
      }
    } catch (termErr) {
      console.error(`PubMed crawl error for term "${term}":`, termErr);
    }

    await delay(500);
  }

  console.log(`PubMed: ${items.length} items fetched`);
  return items;
}
