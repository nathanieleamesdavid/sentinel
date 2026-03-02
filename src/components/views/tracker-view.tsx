'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'

export function TrackerView() {
  return (
    <div className="flex h-full items-center justify-center p-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader className="text-center">
          <CardTitle className="text-lg text-card-foreground">
            Company Pipeline Tracker
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Coming Soon
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">
            This view will track biotech companies through their pipeline
            stages — from preclinical research through Phase 1, 2, 3 trials
            to approval — giving you a real-time overview of the longevity
            therapeutics landscape.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
