import { and, count, desc, eq, gte, isNotNull, sql } from 'drizzle-orm'
import { db } from './client'
import { comments, crawlLog, insights } from './schema'

export async function getInsights(filters: {
  daysBack?: number
  limit?: number
  domain?: string
  path?: number
}) {
  const conditions = [isNotNull(insights.synthesis)]

  if (filters.daysBack) {
    conditions.push(
      gte(
        insights.ingestedAt,
        sql`now() - interval '${sql.raw(String(filters.daysBack))} days'`
      )
    )
  }

  if (filters.domain) {
    conditions.push(eq(insights.domain, filters.domain))
  }

  if (filters.path !== undefined) {
    conditions.push(eq(insights.path, filters.path))
  }

  return db
    .select()
    .from(insights)
    .where(and(...conditions))
    .orderBy(desc(insights.ingestedAt))
    .limit(filters.limit ?? 50)
}

export async function getInsightById(id: number) {
  const rows = await db
    .select()
    .from(insights)
    .where(eq(insights.id, id))
    .limit(1)

  return rows[0] ?? null
}

export async function getDomainCounts() {
  return db
    .select({
      domain: insights.domain,
      count: count(),
    })
    .from(insights)
    .groupBy(insights.domain)
}

export async function getStats() {
  const [totalRow] = await db
    .select({ value: count() })
    .from(insights)

  const [path1Row] = await db
    .select({ value: count() })
    .from(insights)
    .where(eq(insights.path, 1))

  const [path2Row] = await db
    .select({ value: count() })
    .from(insights)
    .where(eq(insights.path, 2))

  const [unreadRow] = await db
    .select({ value: count() })
    .from(insights)
    .where(eq(insights.isRead, false))

  return {
    total: totalRow.value,
    path1: path1Row.value,
    path2: path2Row.value,
    unread: unreadRow.value,
  }
}

export async function markAsRead(id: number) {
  return db
    .update(insights)
    .set({ isRead: true })
    .where(eq(insights.id, id))
}

export async function insertInsight(
  data: typeof insights.$inferInsert
): Promise<boolean> {
  const result = await db
    .insert(insights)
    .values(data)
    .onConflictDoNothing({ target: insights.urlHash })
    .returning({ id: insights.id })

  return result.length > 0
}

export async function getComments(insightId: number) {
  return db
    .select()
    .from(comments)
    .where(eq(comments.insightId, insightId))
    .orderBy(comments.createdAt)
}

export async function insertComment(
  insightId: number,
  author: string,
  text: string
) {
  await db.insert(comments).values({ insightId, author, text })
  return getComments(insightId)
}

export async function logCrawl(
  source: string,
  found: number,
  newItems: number
) {
  return db.insert(crawlLog).values({ source, found, newItems })
}
