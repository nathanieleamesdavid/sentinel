/**
 * ClinicalTrials.gov Crawler
 * Queries the ClinicalTrials.gov v2 API for recruiting aging/longevity studies
 * and returns raw items for downstream synthesis.
 */

import type { RawItem } from "@/types";

const API_BASE = "https://clinicaltrials.gov/api/v2/studies";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function crawlClinicalTrials(
  daysBack: number
): Promise<RawItem[]> {
  const items: RawItem[] = [];

  try {
    const minDate = new Date(Date.now() - daysBack * 86_400_000)
      .toISOString()
      .split("T")[0];

    const params = new URLSearchParams({
      "query.cond":
        "aging OR longevity OR senescence OR neurodegeneration",
      "filter.advanced": `AREA[StartDate]RANGE[${minDate},MAX]`,
      "filter.overallStatus": "RECRUITING,NOT_YET_RECRUITING",
      fields:
        "NCTId,BriefTitle,BriefSummary,Phase,LeadSponsorName,StartDate,OverallStatus",
      pageSize: "30",
      format: "json",
    });

    const url = `${API_BASE}?${params.toString()}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });

    if (!res.ok) {
      console.error(
        `ClinicalTrials.gov request failed: HTTP ${res.status}`
      );
      return items;
    }

    const data = await res.json();
    const studies: unknown[] = data?.studies ?? [];

    for (const study of studies) {
      try {
        const proto = (study as Record<string, unknown>)
          .protocolSection as Record<string, unknown> | undefined;
        if (!proto) continue;

        const idMod = proto.identificationModule as
          | Record<string, unknown>
          | undefined;
        const descMod = proto.descriptionModule as
          | Record<string, unknown>
          | undefined;
        const designMod = proto.designModule as
          | Record<string, unknown>
          | undefined;
        const sponsorMod = proto.sponsorCollaboratorsModule as
          | Record<string, unknown>
          | undefined;

        const nctId = String(idMod?.nctId ?? "");
        const title = String(idMod?.briefTitle ?? "");
        const summary = String(descMod?.briefSummary ?? "");
        const phases = (designMod?.phases as string[] | undefined) ?? [];
        const phase = phases[0] ?? "N/A";
        const sponsor = String(
          (sponsorMod?.leadSponsor as Record<string, unknown> | undefined)
            ?.name ?? ""
        );

        const sourceUrl = `https://clinicaltrials.gov/study/${nctId}`;

        items.push({
          title,
          abstract: summary,
          sourceUrl,
          source: "ClinicalTrials",
          sourceType: "clinical_trial",
          company: sponsor,
          stage: phase,
        });

        await delay(300);
      } catch (studyErr) {
        console.error("ClinicalTrials study parse error:", studyErr);
      }
    }

    console.log(`ClinicalTrials: ${items.length} items fetched`);
  } catch (err) {
    console.error("ClinicalTrials crawl failed:", err);
  }

  return items;
}
