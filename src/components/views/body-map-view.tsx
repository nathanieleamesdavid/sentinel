'use client'

import { Suspense } from 'react'
import { Insight } from '@/types'
import BodyMap from '@/components/visualizations/body-map'

interface BodyMapViewProps {
  insights: Insight[]
}

function BodyMapLoadingFallback() {
  return (
    <div className="flex h-full min-h-[400px] items-center justify-center">
      <p className="text-sm text-muted-foreground">Loading body map...</p>
    </div>
  )
}

export function BodyMapView({ insights }: BodyMapViewProps) {
  return (
    <div className="h-full w-full p-4">
      <Suspense fallback={<BodyMapLoadingFallback />}>
        <BodyMap insights={insights} />
      </Suspense>
    </div>
  )
}
