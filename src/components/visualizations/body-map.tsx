'use client'

import { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import { DOMAINS } from '@/lib/constants'
import type { Insight, Domain } from '@/types'

interface BodyMapProps {
  insights: Insight[]
}

const SVG_WIDTH = 600
const SVG_HEIGHT = 900

/**
 * Vitruvian Man body map visualization. Overlays SVG circles at anatomical
 * positions corresponding to therapeutic domains, sized by insight count
 * with animated pulsing rings.
 */
export default function BodyMap({ insights }: BodyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<{
    x: number
    y: number
    label: string
    count: number
  } | null>(null)

  // Group insights by domain and count
  const domainCounts = new Map<Domain, number>()
  for (const insight of insights) {
    if (!insight.domain) continue
    domainCounts.set(
      insight.domain,
      (domainCounts.get(insight.domain) || 0) + 1
    )
  }

  // Compute radius scale
  const counts = Array.from(domainCounts.values())
  const maxCount = counts.length > 0 ? Math.max(...counts) : 1
  const minCount = counts.length > 0 ? Math.min(...counts) : 1

  function getRadius(count: number): number {
    if (maxCount === minCount) return 14
    const min = 8
    const max = 28
    return min + ((count - minCount) / (maxCount - minCount)) * (max - min)
  }

  // Build domain markers
  const markers = DOMAINS.filter((d) => (domainCounts.get(d.name) || 0) > 0).map(
    (domain) => {
      const count = domainCounts.get(domain.name) || 0
      const cx = (domain.bodyMapPosition.x / 100) * SVG_WIDTH
      const cy = (domain.bodyMapPosition.y / 100) * SVG_HEIGHT
      const r = getRadius(count)
      return { ...domain, count, cx, cy, r }
    }
  )

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[600px] mx-auto select-none"
    >
      {/* Vitruvian Man background */}
      <Image
        src="/vitruvian.jpg"
        alt="Vitruvian Man body map"
        width={SVG_WIDTH}
        height={SVG_HEIGHT}
        className="w-full h-auto opacity-30"
        priority
      />

      {/* SVG overlay */}
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'none' }}
      >
        <defs>
          <style>{`
            @keyframes body-pulse {
              0% {
                opacity: 0.5;
                transform-origin: center;
                r: inherit;
              }
              100% {
                opacity: 0;
                r: 40;
              }
            }
            .body-pulse-ring {
              animation: body-pulse 2.5s ease-out infinite;
            }
          `}</style>
        </defs>

        {markers.map((marker) => (
          <g key={marker.name} style={{ pointerEvents: 'auto' }}>
            {/* Pulsing ring */}
            <circle
              cx={marker.cx}
              cy={marker.cy}
              r={marker.r}
              fill="none"
              stroke={marker.color}
              strokeWidth={1.5}
              className="body-pulse-ring"
            />

            {/* Main circle */}
            <circle
              cx={marker.cx}
              cy={marker.cy}
              r={marker.r}
              fill={marker.color}
              fillOpacity={0.65}
              stroke={marker.color}
              strokeWidth={1.5}
              cursor="pointer"
              onMouseEnter={(e) => {
                const container = containerRef.current
                if (!container) return
                const rect = container.getBoundingClientRect()
                setTooltip({
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top - 10,
                  label: marker.label,
                  count: marker.count,
                })
              }}
              onMouseLeave={() => setTooltip(null)}
            />

            {/* Label */}
            <text
              x={marker.cx}
              y={marker.cy + marker.r + 14}
              textAnchor="middle"
              fill="var(--foreground)"
              fontSize={11}
              fontWeight={600}
              style={{
                textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                pointerEvents: 'none',
              }}
            >
              {marker.label} ({marker.count})
            </text>
          </g>
        ))}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none z-10 rounded bg-popover text-popover-foreground border border-border px-3 py-1.5 text-xs shadow-lg"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <span className="font-semibold">{tooltip.label}</span>
          {' '}&mdash;{' '}
          {tooltip.count} insight{tooltip.count !== 1 ? 's' : ''}
        </div>
      )}

      {/* Empty state */}
      {insights.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-muted-foreground bg-background/50 px-4 py-2 rounded">
            No insights to display on the body map.
          </p>
        </div>
      )}
    </div>
  )
}
