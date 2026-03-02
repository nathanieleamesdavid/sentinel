import { Domain } from '@/types'

/* ------------------------------------------------------------------ */
/*  Domains                                                           */
/* ------------------------------------------------------------------ */

export const DOMAINS: {
  id: number
  name: Domain
  label: string
  color: string
  bodyMapPosition: { x: number; y: number }
}[] = [
  { id: 1, name: 'cancer',     label: 'Cancer',              color: '#e74c3c', bodyMapPosition: { x: 50, y: 38 } },
  { id: 2, name: 'immune',     label: 'Immune System',       color: '#3498db', bodyMapPosition: { x: 42, y: 42 } },
  { id: 3, name: 'epigenetic', label: 'Epigenetics',         color: '#9b59b6', bodyMapPosition: { x: 50, y: 12 } },
  { id: 4, name: 'cognitive',  label: 'Cognitive',           color: '#8e44ad', bodyMapPosition: { x: 50, y: 8  } },
  { id: 5, name: 'metabolic',  label: 'Metabolic',           color: '#f39c12', bodyMapPosition: { x: 50, y: 48 } },
  { id: 6, name: 'musculo',    label: 'Musculoskeletal',     color: '#27ae60', bodyMapPosition: { x: 32, y: 65 } },
  { id: 7, name: 'vascular',   label: 'Vascular',            color: '#e67e22', bodyMapPosition: { x: 55, y: 35 } },
  { id: 8, name: 'sensory',    label: 'Sensory',             color: '#1abc9c', bodyMapPosition: { x: 44, y: 10 } },
  { id: 9, name: 'sleep',      label: 'Sleep',               color: '#2c3e50', bodyMapPosition: { x: 56, y: 10 } },
]

/* ------------------------------------------------------------------ */
/*  PubMed search terms                                               */
/* ------------------------------------------------------------------ */

export const SEARCH_TERMS: string[] = [
  'aging longevity',
  'senescence therapy',
  'epigenetic reprogramming aging',
  'telomere aging',
  'mTOR aging',
  'NAD+ aging',
  'senolytics',
  'inflammaging',
  'cognitive decline drug',
  'sarcopenia treatment',
  'neurodegeneration aging',
]

/* ------------------------------------------------------------------ */
/*  News RSS feeds                                                    */
/* ------------------------------------------------------------------ */

export const NEWS_FEEDS: { name: string; url: string }[] = [
  { name: 'STAT News',      url: 'https://www.statnews.com/feed/' },
  { name: 'FierceBiotech',  url: 'https://www.fiercebiotech.com/rss/xml' },
  { name: 'Endpoints News', url: 'https://endpts.com/feed/' },
]

/* ------------------------------------------------------------------ */
/*  News filtering keywords                                           */
/* ------------------------------------------------------------------ */

export const LONGEVITY_KEYWORDS: string[] = [
  'aging',
  'longevity',
  'senescence',
  'alzheimer',
  'parkinson',
  'cancer',
  'oncology',
  'immune',
  'epigenetic',
  'cognitive',
  'metabolic',
  'sarcopenia',
  'neurodegeneration',
  'clinical trial',
  'phase 1',
  'phase 2',
  'ipo',
  'series a',
  'series b',
  'acquisition',
  'partnership',
  'fda approval',
]

/* ------------------------------------------------------------------ */
/*  Relevance scoring                                                 */
/* ------------------------------------------------------------------ */

export const RELEVANCE_THRESHOLD = 4

/* ------------------------------------------------------------------ */
/*  Country centroids (ISO 3166-1 alpha-2)                            */
/* ------------------------------------------------------------------ */

export const COUNTRY_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  US: { lat: 39.8283,  lng: -98.5795  },
  GB: { lat: 55.3781,  lng: -3.4360   },
  CN: { lat: 35.8617,  lng: 104.1954  },
  DE: { lat: 51.1657,  lng: 10.4515   },
  JP: { lat: 36.2048,  lng: 138.2529  },
  FR: { lat: 46.6034,  lng: 1.8883    },
  KR: { lat: 35.9078,  lng: 127.7669  },
  AU: { lat: -25.2744, lng: 133.7751  },
  CA: { lat: 56.1304,  lng: -106.3468 },
  IL: { lat: 31.0461,  lng: 34.8516   },
  CH: { lat: 46.8182,  lng: 8.2275    },
  SE: { lat: 60.1282,  lng: 18.6435   },
  NL: { lat: 52.1326,  lng: 5.2913    },
  DK: { lat: 56.2639,  lng: 9.5018    },
  BE: { lat: 50.5039,  lng: 4.4699    },
  IT: { lat: 41.8719,  lng: 12.5674   },
  ES: { lat: 40.4637,  lng: -3.7492   },
  IN: { lat: 20.5937,  lng: 78.9629   },
  BR: { lat: -14.2350, lng: -51.9253  },
  SG: { lat: 1.3521,   lng: 103.8198  },
  AT: { lat: 47.5162,  lng: 14.5501   },
  NO: { lat: 60.4720,  lng: 8.4689    },
  FI: { lat: 61.9241,  lng: 25.7482   },
  IE: { lat: 53.1424,  lng: -7.6921   },
  NZ: { lat: -40.9006, lng: 174.8860  },
  TW: { lat: 23.6978,  lng: 120.9605  },
  HK: { lat: 22.3193,  lng: 114.1694  },
  CZ: { lat: 49.8175,  lng: 15.4730   },
  PL: { lat: 51.9194,  lng: 19.1451   },
  PT: { lat: 39.3999,  lng: -8.2245   },
}
