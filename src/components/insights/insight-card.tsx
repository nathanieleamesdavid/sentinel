'use client'

import { type Insight, type Domain } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const DOMAIN_COLORS: Record<Domain, string> = {
  cancer: '#e74c3c',
  immune: '#3498db',
  epigenetic: '#9b59b6',
  cognitive: '#8e44ad',
  metabolic: '#f39c12',
  musculo: '#27ae60',
  vascular: '#e67e22',
  sensory: '#1abc9c',
  sleep: '#2c3e50',
}

const URGENCY_DOT: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-gray-500',
}

interface InsightCardProps {
  insight: Insight
  isSelected: boolean
  onClick: () => void
}

export function InsightCard({ insight, isSelected, onClick }: InsightCardProps) {
  const domainColor = insight.domain ? DOMAIN_COLORS[insight.domain] : '#6b7280'
  const urgencyDot = URGENCY_DOT[insight.urgency] ?? URGENCY_DOT.low

  const formattedDate = insight.publishedDate
    ? new Date(insight.publishedDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  return (
    <Card
      className={cn(
        'cursor-pointer border bg-card transition-colors hover:border-primary/50',
        isSelected
          ? 'border-primary shadow-[0_0_0_1px] shadow-primary'
          : 'border-border'
      )}
      onClick={onClick}
    >
      <CardHeader className="gap-1.5 pb-0">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-semibold text-foreground">
            {insight.title}
          </CardTitle>
          <span
            className={cn('mt-1 h-2.5 w-2.5 shrink-0 rounded-full', urgencyDot)}
            title={`${insight.urgency} urgency`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {insight.domain && (
            <Badge
              className="border-0 text-[10px] font-medium text-primary-foreground"
              style={{ backgroundColor: domainColor }}
            >
              {insight.domain}
            </Badge>
          )}

          {insight.path && (
            <Badge
              variant="outline"
              className="border-border text-[10px] text-muted-foreground"
            >
              Path {insight.path}
            </Badge>
          )}

          {formattedDate && (
            <span className="text-[10px] text-muted-foreground">{formattedDate}</span>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {insight.synthesis && (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {insight.synthesis}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
