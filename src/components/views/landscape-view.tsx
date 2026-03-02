'use client'

import { Insight } from '@/types'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface DomainSummary {
  name: string
  label: string
  color: string
  count: number
}

interface LandscapeViewProps {
  insights: Insight[]
  domains: DomainSummary[]
}

export function LandscapeView({ insights, domains }: LandscapeViewProps) {
  function getTopInsightsForDomain(domainName: string): Insight[] {
    return insights
      .filter((insight) => insight.domain === domainName)
      .slice(0, 3)
  }

  if (domains.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">No domains available</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 p-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {domains.map((domain) => {
        const topInsights = getTopInsightsForDomain(domain.name)

        return (
          <Card
            key={domain.name}
            className="border-border bg-card"
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: domain.color }}
                  />
                  <CardTitle className="text-sm text-card-foreground">
                    {domain.label}
                  </CardTitle>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-background text-primary"
                >
                  {domain.count}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              {topInsights.length > 0 ? (
                <ul className="space-y-2">
                  {topInsights.map((insight) => (
                    <li
                      key={insight.id}
                      className="truncate text-xs text-muted-foreground"
                      title={insight.title}
                    >
                      {insight.title}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">No signals yet</p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
