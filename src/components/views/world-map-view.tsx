'use client'

import { Suspense } from 'react'
import { Insight } from '@/types'
import WorldMap from '@/components/visualizations/world-map'

interface WorldMapViewProps {
  insights: Insight[]
}

function MapLoadingFallback() {
  return (
    <div className="flex h-full min-h-[400px] items-center justify-center">
      <p className="text-sm text-muted-foreground">Loading map...</p>
    </div>
  )
}

export function WorldMapView({ insights }: WorldMapViewProps) {
  return (
    <div className="h-full w-full p-4">
      <Suspense fallback={<MapLoadingFallback />}>
        <WorldMap insights={insights} />
      </Suspense>
    </div>
  )
}
