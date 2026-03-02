'use client'

import { Insight } from '@/types'
import { InsightCard } from '@/components/insights/insight-card'
import { ScrollArea } from '@/components/ui/scroll-area'

interface DigestViewProps {
  insights: Insight[]
  loading?: boolean
  selectedInsightId: number | null
  onSelectInsight: (insight: Insight) => void
}

export function DigestView({
  insights,
  loading,
  selectedInsightId,
  onSelectInsight,
}: DigestViewProps) {
  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading insights...</p>
        </div>
      </div>
    )
  }

  if (insights.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm font-medium text-foreground">No insights found</p>
          <p className="text-xs text-muted-foreground">
            Try adjusting your domain filters or trigger a crawl to fetch new data.
          </p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[calc(100vh-8rem)]">
      <div className="grid gap-4 p-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {insights.map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            isSelected={insight.id === selectedInsightId}
            onClick={() => onSelectInsight(insight)}
          />
        ))}
      </div>
    </ScrollArea>
  )
}
