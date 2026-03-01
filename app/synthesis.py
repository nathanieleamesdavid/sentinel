"""
Sentinel Synthesis
Wraps the Anthropic Claude API for biotech intelligence analysis.
"""
import json
import logging
from typing import Optional
from app.config import ANTHROPIC_API_KEY

log = logging.getLogger("sentinel.synthesis")


def synthesize(title: str, abstract: str, source_type: str) -> Optional[dict]:
    """
    Use Claude to analyze a biotech item and return structured intelligence.
    Returns a dict with synthesis, path, urgency, domain, company, stage, tags,
    relevance_score, and country — or None on failure.
    """
    if not ANTHROPIC_API_KEY:
        log.warning("No ANTHROPIC_API_KEY set — skipping synthesis for '%s'", title[:60])
        return None
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        prompt = f"""You are an intelligence analyst for Medeed, a sovereign longevity biopharmaceutical company in Abu Dhabi.

Medeed has two investment modes:
- Path 1: Novel biology with no company yet — potential venture/seed opportunity
- Path 2: Late preclinical company approaching first-in-human study — deal/licensing target

Analyze this biotech item and return a JSON object with these exact fields:
{{
  "synthesis": "2-3 sentence business-relevant summary.",
  "path": 1 or 2 (or null if neither),
  "urgency": "high", "medium", or "low",
  "domain": one of: "cancer", "immune", "epigenetic", "cognitive", "metabolic", "musculo", "vascular", "sensory", "sleep",
  "company": "company name if applicable, else null",
  "stage": "preclinical/phase1/phase2/phase3/approved/null",
  "tags": ["tag1", "tag2"],
  "relevance_score": 0-10,
  "country": "ISO 3166-1 alpha-2 country code of the lead institution or company (e.g. US, GB, CN, DE, JP), or null"
}}

Return ONLY the JSON object, no other text.

Source type: {source_type}
Title: {title}
Abstract/Content: {abstract[:2000]}"""
        msg = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=600,
            messages=[{"role": "user", "content": prompt}]
        )
        text = msg.content[0].text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return json.loads(text)
    except Exception as e:
        log.warning("Synthesis failed for '%s': %s", title[:60], e)
        return None
