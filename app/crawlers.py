"""
Sentinel Crawlers
Data ingestion from PubMed, ClinicalTrials.gov, and biotech news RSS feeds.
"""
import time
import json
import logging
from datetime import datetime, timedelta

from app.config import CRAWL_LOOKBACK_DAYS
from app.database import insert_insight
from app.synthesis import synthesize

log = logging.getLogger("sentinel.crawlers")


def crawl_pubmed(days_back=7):
    """Crawl PubMed for aging/longevity research papers."""
    try:
        import requests
        log.info("Crawling PubMed (last %d days)...", days_back)
        terms = [
            "aging longevity", "senescence therapy", "epigenetic reprogramming aging",
            "telomere aging", "mTOR aging", "NAD+ aging", "senolytics", "inflammaging",
            "cognitive decline drug", "sarcopenia treatment", "neurodegeneration aging",
        ]
        found, new = 0, 0
        for term in terms[:5]:
            url = (
                f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
                f"?db=pubmed&term={requests.utils.quote(term)}&reldate={days_back}"
                f"&datetype=pdat&retmax=20&retmode=json"
            )
            r = requests.get(url, timeout=15)
            ids = r.json().get("esearchresult", {}).get("idlist", [])
            if not ids:
                continue
            fetch_url = (
                f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
                f"?db=pubmed&id={','.join(ids)}&rettype=abstract&retmode=json"
            )
            fr = requests.get(fetch_url, timeout=20)
            articles = fr.json().get("PubmedArticleSet", {}).get("PubmedArticle", [])
            if isinstance(articles, dict):
                articles = [articles]
            for art in articles:
                try:
                    med = art["MedlineCitation"]
                    article = med["Article"]
                    title = article.get("ArticleTitle", "")
                    if isinstance(title, dict):
                        title = title.get("#text", str(title))
                    abstract_texts = article.get("Abstract", {}).get("AbstractText", "")
                    if isinstance(abstract_texts, list):
                        abstract = " ".join([
                            (t.get("#text", str(t)) if isinstance(t, dict) else str(t))
                            for t in abstract_texts
                        ])
                    elif isinstance(abstract_texts, dict):
                        abstract = abstract_texts.get("#text", str(abstract_texts))
                    else:
                        abstract = str(abstract_texts) if abstract_texts else ""
                    pmid = str(med.get("PMID", {}).get("#text", ""))
                    source_url = f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/"
                    found += 1
                    synth = synthesize(str(title), abstract, "pubmed")
                    if synth and synth.get("relevance_score", 0) >= 4:
                        result = insert_insight({
                            "title": str(title),
                            "synthesis": synth.get("synthesis"),
                            "path": synth.get("path"),
                            "urgency": synth.get("urgency", "medium"),
                            "domain": synth.get("domain"),
                            "source": "PubMed",
                            "source_type": "pubmed",
                            "source_url": source_url,
                            "company": synth.get("company"),
                            "stage": synth.get("stage"),
                            "relevance_score": synth.get("relevance_score", 0),
                            "tags": synth.get("tags", []),
                            "raw_text": abstract,
                            "country": synth.get("country"),
                        })
                        if result:
                            new += 1
                except Exception as e:
                    log.debug("Article parse error: %s", e)
            time.sleep(0.5)
        log.info("PubMed: %d found, %d new", found, new)
        return found, new
    except Exception as e:
        log.error("PubMed crawl failed: %s", e)
        return 0, 0


def crawl_clinicaltrials(days_back=7):
    """Crawl ClinicalTrials.gov for recruiting aging/longevity studies."""
    try:
        import requests
        log.info("Crawling ClinicalTrials.gov (last %d days)...", days_back)
        min_date = (datetime.utcnow() - timedelta(days=days_back)).strftime("%Y-%m-%d")
        url = (
            f"https://clinicaltrials.gov/api/v2/studies"
            f"?query.cond=aging+OR+longevity+OR+senescence+OR+neurodegeneration"
            f"&filter.advanced=AREA[StartDate]RANGE[{min_date},MAX]"
            f"&filter.overallStatus=RECRUITING,NOT_YET_RECRUITING"
            f"&fields=NCTId,BriefTitle,BriefSummary,Phase,LeadSponsorName,StartDate,OverallStatus"
            f"&pageSize=30&format=json"
        )
        r = requests.get(url, timeout=20)
        studies = r.json().get("studies", [])
        found, new = len(studies), 0
        for study in studies:
            proto = study.get("protocolSection", {})
            id_mod = proto.get("identificationModule", {})
            desc_mod = proto.get("descriptionModule", {})
            design_mod = proto.get("designModule", {})
            sponsor_mod = proto.get("sponsorCollaboratorsModule", {})
            nct = id_mod.get("nctId", "")
            title = id_mod.get("briefTitle", "")
            summary = desc_mod.get("briefSummary", "")
            phases = design_mod.get("phases", [])
            phase = phases[0] if phases else "N/A"
            sponsor = sponsor_mod.get("leadSponsor", {}).get("name", "")
            synth = synthesize(title, summary, "clinical_trial")
            if synth and synth.get("relevance_score", 0) >= 4:
                result = insert_insight({
                    "title": title,
                    "synthesis": synth.get("synthesis"),
                    "path": 2,
                    "urgency": synth.get("urgency", "medium"),
                    "domain": synth.get("domain"),
                    "source": "ClinicalTrials",
                    "source_type": "clinical_trial",
                    "source_url": f"https://clinicaltrials.gov/study/{nct}",
                    "company": sponsor,
                    "stage": phase,
                    "relevance_score": synth.get("relevance_score", 0),
                    "tags": synth.get("tags", []),
                    "raw_text": summary,
                    "country": synth.get("country"),
                })
                if result:
                    new += 1
            time.sleep(0.3)
        log.info("ClinicalTrials: %d found, %d new", found, new)
        return found, new
    except Exception as e:
        log.error("ClinicalTrials crawl failed: %s", e)
        return 0, 0


def crawl_news():
    """Crawl biotech news RSS feeds for longevity-relevant articles."""
    try:
        import feedparser
        log.info("Crawling biotech news...")
        feeds = [
            ("STAT News", "https://www.statnews.com/feed/"),
            ("FierceBiotech", "https://www.fiercebiotech.com/rss/xml"),
            ("Endpoints News", "https://endpts.com/feed/"),
        ]
        longevity_keywords = [
            "aging", "longevity", "senescence", "alzheimer", "parkinson",
            "cancer", "oncology", "immune", "epigenetic", "cognitive", "metabolic",
            "sarcopenia", "neurodegeneration", "clinical trial", "phase 1", "phase 2",
            "ipo", "series a", "series b", "acquisition", "partnership", "fda approval",
        ]
        found, new = 0, 0
        for source_name, feed_url in feeds:
            try:
                feed = feedparser.parse(feed_url)
                for entry in feed.entries[:20]:
                    title = entry.get("title", "")
                    summary = entry.get("summary", entry.get("description", ""))
                    link = entry.get("link", "")
                    text = (title + " " + summary).lower()
                    if not any(kw in text for kw in longevity_keywords):
                        continue
                    found += 1
                    synth = synthesize(title, summary, "news")
                    if synth and synth.get("relevance_score", 0) >= 4:
                        result = insert_insight({
                            "title": title,
                            "synthesis": synth.get("synthesis"),
                            "path": synth.get("path"),
                            "urgency": synth.get("urgency", "medium"),
                            "domain": synth.get("domain"),
                            "source": source_name,
                            "source_type": "news",
                            "source_url": link,
                            "company": synth.get("company"),
                            "stage": synth.get("stage"),
                            "relevance_score": synth.get("relevance_score", 0),
                            "tags": synth.get("tags", []),
                            "raw_text": summary,
                            "country": synth.get("country"),
                        })
                        if result:
                            new += 1
                    time.sleep(0.3)
            except Exception as e:
                log.warning("Feed error %s: %s", source_name, e)
        log.info("News: %d found, %d new", found, new)
        return found, new
    except Exception as e:
        log.error("News crawl failed: %s", e)
        return 0, 0


def run_crawl(first_run=False):
    """Run all crawlers. Uses longer lookback on first run."""
    days = CRAWL_LOOKBACK_DAYS if first_run else 7
    log.info("=" * 50)
    log.info("Starting crawl (lookback=%d days)", days)
    log.info("=" * 50)
    crawl_pubmed(days_back=days)
    crawl_clinicaltrials(days_back=days)
    crawl_news()
    log.info("Crawl complete.")
