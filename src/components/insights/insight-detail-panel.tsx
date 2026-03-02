'use client'

import useSWR from 'swr'
import { type Insight, type Comment, type Domain } from '@/types'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { CommentForm } from '@/components/insights/comment-form'
import { ExternalLink } from 'lucide-react'

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

const URGENCY_LABEL: Record<string, { color: string; label: string }> = {
  high: { color: 'bg-red-500', label: 'High' },
  medium: { color: 'bg-yellow-500', label: 'Medium' },
  low: { color: 'bg-gray-500', label: 'Low' },
}

const STAGE_LABELS: Record<string, string> = {
  preclinical: 'Preclinical',
  phase1: 'Phase 1',
  phase2: 'Phase 2',
  phase3: 'Phase 3',
  approved: 'Approved',
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface InsightDetailPanelProps {
  insight: Insight | null
  onClose: () => void
}

export function InsightDetailPanel({
  insight,
  onClose,
}: InsightDetailPanelProps) {
  const {
    data: comments,
    mutate: mutateComments,
  } = useSWR<Comment[]>(
    insight ? `/api/insights/${insight.id}/comments` : null,
    fetcher
  )

  const domainColor = insight?.domain
    ? DOMAIN_COLORS[insight.domain]
    : '#6b7280'
  const urgencyInfo = insight
    ? URGENCY_LABEL[insight.urgency] ?? URGENCY_LABEL.low
    : null

  const formattedDate = insight?.publishedDate
    ? new Date(insight.publishedDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  return (
    <Sheet open={!!insight} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full border-border bg-card p-0 sm:max-w-lg"
      >
        {insight && (
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-6 p-6">
              {/* Header */}
              <SheetHeader className="gap-3 p-0">
                <SheetTitle className="text-lg font-semibold leading-snug text-foreground">
                  {insight.title}
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Detail panel for insight: {insight.title}
                </SheetDescription>

                <div className="flex flex-wrap items-center gap-2">
                  {insight.domain && (
                    <Badge
                      className="border-0 text-xs font-medium text-primary-foreground"
                      style={{ backgroundColor: domainColor }}
                    >
                      {insight.domain}
                    </Badge>
                  )}

                  {urgencyInfo && (
                    <Badge
                      variant="outline"
                      className="gap-1.5 border-border text-xs text-muted-foreground"
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${urgencyInfo.color}`}
                      />
                      {urgencyInfo.label}
                    </Badge>
                  )}

                  {insight.path && (
                    <Badge
                      variant="outline"
                      className="border-border text-xs text-muted-foreground"
                    >
                      Path {insight.path}
                    </Badge>
                  )}
                </div>
              </SheetHeader>

              <Separator />

              {/* Metadata grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {insight.stage && (
                  <MetaField
                    label="Stage"
                    value={STAGE_LABELS[insight.stage] ?? insight.stage}
                  />
                )}
                {insight.company && (
                  <MetaField label="Company" value={insight.company} />
                )}
                {insight.country && (
                  <MetaField label="Country" value={insight.country} />
                )}
                <MetaField
                  label="Relevance"
                  value={`${insight.relevanceScore}/10`}
                />
                {formattedDate && (
                  <MetaField label="Published" value={formattedDate} />
                )}
                <MetaField
                  label="Source"
                  value={insight.sourceType.replace('_', ' ')}
                />
              </div>

              <Separator />

              {/* Synthesis */}
              {insight.synthesis && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Synthesis
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {insight.synthesis}
                  </p>
                </div>
              )}

              {/* Tags */}
              {insight.tags.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {insight.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="bg-muted text-[11px] text-muted-foreground"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Source link */}
              {insight.sourceUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-fit border-border text-muted-foreground hover:border-primary hover:text-primary"
                >
                  <a
                    href={insight.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="size-3.5" />
                    View Source
                  </a>
                </Button>
              )}

              <Separator />

              {/* Comments */}
              <div className="flex flex-col gap-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Team Notes
                </h3>

                {comments && comments.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {comments.map((comment) => (
                      <Card
                        key={comment.id}
                        className="border-border bg-background"
                      >
                        <CardContent className="p-3">
                          <div className="mb-1.5 flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">
                              {comment.author}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleDateString(
                                'en-US',
                                {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                }
                              )}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {comment.text}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No notes yet.</p>
                )}

                <CommentForm
                  insightId={insight.id}
                  onCommentAdded={() => mutateComments()}
                />
              </div>
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  )
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-muted-foreground">{value}</span>
    </div>
  )
}
