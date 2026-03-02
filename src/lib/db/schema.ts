import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

export const insights = pgTable('insights', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  synthesis: text('synthesis'),
  path: integer('path'),
  urgency: text('urgency').default('medium'),
  domain: text('domain'),
  source: text('source'),
  sourceType: text('source_type'),
  sourceUrl: text('source_url'),
  company: text('company'),
  stage: text('stage'),
  publishedDate: text('published_date'),
  ingestedAt: timestamp('ingested_at', { withTimezone: true }).defaultNow(),
  relevanceScore: real('relevance_score').default(0),
  isRead: boolean('is_read').default(false),
  tags: jsonb('tags').default([]),
  rawText: text('raw_text'),
  urlHash: text('url_hash').unique(),
  country: text('country'),
})

export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  insightId: integer('insight_id').references(() => insights.id),
  author: text('author').default('Team'),
  text: text('text'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const crawlLog = pgTable('crawl_log', {
  id: serial('id').primaryKey(),
  runAt: timestamp('run_at', { withTimezone: true }).defaultNow(),
  source: text('source'),
  found: integer('found').default(0),
  newItems: integer('new_items').default(0),
})
