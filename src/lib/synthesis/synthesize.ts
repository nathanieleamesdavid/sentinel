import Anthropic from "@anthropic-ai/sdk";
import type { SynthesisResult, RawItem, SourceType } from "@/types";

const MAX_RETRIES = 4;
const INITIAL_DELAY_MS = 500;
const MAX_DELAY_MS = 30_000;
const REQUEST_TIMEOUT_MS = 30_000;

let client: Anthropic | null = null;

function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) {
    return null;
  }
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: REQUEST_TIMEOUT_MS,
    });
  }
  return client;
}

/**
 * Claude returns snake_case JSON keys but our TypeScript types use camelCase.
 * Map the raw Claude response to our SynthesisResult type.
 */
function mapResponse(raw: Record<string, unknown>): SynthesisResult {
  return {
    synthesis: String(raw.synthesis ?? ""),
    path: (raw.path as SynthesisResult["path"]) ?? null,
    urgency: (raw.urgency as SynthesisResult["urgency"]) ?? "medium",
    domain: raw.domain as SynthesisResult["domain"],
    company: (raw.company as string) ?? null,
    stage: (raw.stage as SynthesisResult["stage"]) ?? null,
    tags: (raw.tags as string[]) ?? [],
    relevanceScore:
      typeof raw.relevance_score === "number"
        ? raw.relevance_score
        : typeof raw.relevanceScore === "number"
          ? raw.relevanceScore
          : 0,
    country: (raw.country as string) ?? null,
  };
}

function isRetryable(error: unknown): boolean {
  if (error instanceof Anthropic.RateLimitError) return true;
  if (error instanceof Anthropic.InternalServerError) return true;
  if (error instanceof Anthropic.APIConnectionError) return true;
  if (error instanceof Error && error.name === "TimeoutError") return true;
  // Overloaded responses
  if (
    error instanceof Anthropic.APIError &&
    error.status === 529
  )
    return true;
  return false;
}

function backoffDelay(attempt: number): number {
  // Exponential backoff with jitter: base * 2^attempt + random jitter
  const exponential = INITIAL_DELAY_MS * Math.pow(2, attempt);
  const jitter = Math.random() * INITIAL_DELAY_MS;
  return Math.min(exponential + jitter, MAX_DELAY_MS);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Call Claude to synthesize a raw crawled item into structured intelligence.
 * Retries with exponential backoff on transient errors (rate limits, timeouts,
 * server errors). Returns null on permanent failures.
 */
export async function synthesize(
  item: RawItem,
  sourceType: SourceType
): Promise<SynthesisResult | null> {
  const anthropic = getClient();
  if (!anthropic) {
    return null;
  }

  const truncatedAbstract = (item.abstract ?? "").slice(0, 2000);
  const titlePreview = item.title.slice(0, 60);

  const prompt = `You are an intelligence analyst for Medeed, a sovereign longevity biopharmaceutical company in Abu Dhabi.

Medeed has two investment modes:
- Path 1: Novel biology with no company yet — potential venture/seed opportunity
- Path 2: Late preclinical company approaching first-in-human study — deal/licensing target

Analyze this biotech item and return a JSON object with these exact fields:
{
  "synthesis": "2-3 sentence business-relevant summary.",
  "path": 1 or 2 (or null if neither),
  "urgency": "high", "medium", or "low",
  "domain": one of: "cancer", "immune", "epigenetic", "cognitive", "metabolic", "musculo", "vascular", "sensory", "sleep",
  "company": "company name if applicable, else null",
  "stage": "preclinical/phase1/phase2/phase3/approved/null",
  "tags": ["tag1", "tag2"],
  "relevance_score": 0-10,
  "country": "ISO 3166-1 alpha-2 country code of the lead institution or company (e.g. US, GB, CN, DE, JP), or null"
}

Return ONLY the JSON object, no other text.

Source type: ${sourceType}
Title: ${item.title}
Abstract/Content: ${truncatedAbstract}`;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const msg = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      });

      if (!msg.content || msg.content.length === 0) {
        console.warn(
          `[synthesize] empty response for "${titlePreview}", stop_reason: ${msg.stop_reason}`
        );
        return null;
      }

      const block = msg.content[0];
      if (block.type !== "text") {
        console.warn(
          `[synthesize] unexpected block type "${block.type}" for "${titlePreview}"`
        );
        return null;
      }

      let text = block.text.trim();

      if (text.startsWith("```")) {
        text = text.split("```")[1];
        if (text.startsWith("json")) {
          text = text.slice(4);
        }
      }

      const raw = JSON.parse(text) as Record<string, unknown>;
      return mapResponse(raw);
    } catch (error: unknown) {
      if (isRetryable(error) && attempt < MAX_RETRIES) {
        const wait = backoffDelay(attempt);
        console.warn(
          `[synthesize] retryable error for "${titlePreview}" (attempt ${attempt + 1}/${MAX_RETRIES}, waiting ${Math.round(wait)}ms): ${error instanceof Error ? error.message : String(error)}`
        );
        await delay(wait);
        continue;
      }

      const errMsg =
        error instanceof Error ? error.message : String(error);
      console.warn(
        `[synthesize] failed for "${titlePreview}" after ${attempt + 1} attempt(s): ${errMsg}`
      );
      return null;
    }
  }

  return null;
}
