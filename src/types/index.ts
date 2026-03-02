export type Path = 1 | 2

export type Urgency = 'high' | 'medium' | 'low'

export type Domain =
  | 'cancer'
  | 'immune'
  | 'epigenetic'
  | 'cognitive'
  | 'metabolic'
  | 'musculo'
  | 'vascular'
  | 'sensory'
  | 'sleep'

export type SourceType = 'pubmed' | 'clinical_trial' | 'news'

export type Stage = 'preclinical' | 'phase1' | 'phase2' | 'phase3' | 'approved'

export interface Insight {
  id: number
  title: string
  synthesis: string | null
  path: Path | null
  urgency: Urgency
  domain: Domain | null
  source: string
  sourceType: SourceType
  sourceUrl: string
  company: string | null
  stage: Stage | null
  publishedDate: string | null
  ingestedAt: string
  relevanceScore: number
  isRead: boolean
  tags: string[]
  rawText: string | null
  urlHash: string
  country: string | null
}

export interface Comment {
  id: number
  insightId: number
  author: string
  text: string
  createdAt: string
}

export interface CrawlLogEntry {
  id: number
  runAt: string
  source: string
  found: number
  newItems: number
}

export interface SynthesisResult {
  synthesis: string
  path: Path | null
  urgency: Urgency
  domain: Domain
  company: string | null
  stage: Stage | null
  tags: string[]
  relevanceScore: number
  country: string | null
}

export interface RawItem {
  title: string
  abstract: string
  sourceUrl: string
  publishedDate?: string | null
  source?: string
  sourceType?: SourceType
  company?: string
  stage?: string
}

export interface DomainInfo {
  id: number
  name: Domain
  label: string
  count: number
}

export interface Stats {
  total: number
  path1: number
  path2: number
  unread: number
}
