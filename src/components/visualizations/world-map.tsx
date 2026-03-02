'use client'

import { useRef, useEffect, useState } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import { COUNTRY_CENTROIDS } from '@/lib/constants'
import type { Insight, Urgency } from '@/types'

interface WorldMapProps {
  insights: Insight[]
}

const URGENCY_COLORS: Record<Urgency, string> = {
  high: '#e74c3c',
  medium: '#E8703A',
  low: '#3498db',
}

const MAP_WIDTH = 960
const MAP_HEIGHT = 500

/**
 * D3-based world map visualization. Plots insight clusters at country
 * centroids with urgency-coded colors and animated pulsing rings.
 */
export default function WorldMap({ insights }: WorldMapProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [tooltip, setTooltip] = useState<{
    x: number
    y: number
    country: string
    count: number
  } | null>(null)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    // Read theme colors from CSS variables for D3 fill/stroke strings
    const computedStyle = getComputedStyle(document.documentElement)
    const borderColor = computedStyle.getPropertyValue('--border').trim()
    const bgColor = computedStyle.getPropertyValue('--background').trim()

    // Clear previous render
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild)
    }

    const sel = d3.select(svg)

    // Add CSS animation for pulsing rings
    const defs = sel.append('defs')
    const style = defs.append('style')
    style.text(`
      @keyframes pulse-ring {
        0% { opacity: 0.6; r: inherit; }
        100% { opacity: 0; r: 30; }
      }
      .pulse-ring {
        animation: pulse-ring 2s ease-out infinite;
      }
    `)

    const projection = d3.geoNaturalEarth1()
      .scale(160)
      .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2])

    const path = d3.geoPath().projection(projection)

    // Load and render world topology
    d3.json<Topology>('https://unpkg.com/world-atlas@2/countries-110m.json').then(
      (world) => {
        if (!world) return

        const countries = topojson.feature(
          world,
          world.objects.countries as GeometryCollection
        )

        // Draw country shapes
        sel
          .append('g')
          .attr('class', 'countries')
          .selectAll('path')
          .data(countries.features)
          .enter()
          .append('path')
          .attr('d', path as never)
          .attr('fill', bgColor)
          .attr('stroke', borderColor)
          .attr('stroke-width', 0.5)

        // Group insights by country
        const byCountry = new Map<string, Insight[]>()
        for (const insight of insights) {
          const code = insight.country
          if (!code) continue
          const key = code.toUpperCase()
          if (!byCountry.has(key)) {
            byCountry.set(key, [])
          }
          byCountry.get(key)!.push(insight)
        }

        if (byCountry.size === 0) return

        // Determine radius scale
        const counts = Array.from(byCountry.values()).map((arr) => arr.length)
        const maxCount = Math.max(...counts)
        const minCount = Math.min(...counts)
        const radiusScale =
          maxCount === minCount
            ? () => 8
            : d3.scaleLinear().domain([minCount, maxCount]).range([4, 20])

        // Determine dominant urgency for a group of insights
        function dominantUrgency(group: Insight[]): Urgency {
          const urgencyCounts: Record<Urgency, number> = {
            high: 0,
            medium: 0,
            low: 0,
          }
          for (const i of group) {
            urgencyCounts[i.urgency]++
          }
          if (urgencyCounts.high > 0) return 'high'
          if (urgencyCounts.medium > 0) return 'medium'
          return 'low'
        }

        const markersGroup = sel.append('g').attr('class', 'markers')

        byCountry.forEach((group, countryCode) => {
          const centroid = COUNTRY_CENTROIDS[countryCode]
          if (!centroid) return

          const projected = projection([centroid.lng, centroid.lat])
          if (!projected) return

          const [cx, cy] = projected
          const r = radiusScale(group.length) as number
          const urgency = dominantUrgency(group)
          const color = URGENCY_COLORS[urgency]

          const markerGroup = markersGroup.append('g')

          // Pulsing ring
          markerGroup
            .append('circle')
            .attr('cx', cx)
            .attr('cy', cy)
            .attr('r', r)
            .attr('fill', 'none')
            .attr('stroke', color)
            .attr('stroke-width', 1.5)
            .attr('class', 'pulse-ring')

          // Main circle
          markerGroup
            .append('circle')
            .attr('cx', cx)
            .attr('cy', cy)
            .attr('r', r)
            .attr('fill', color)
            .attr('fill-opacity', 0.75)
            .attr('stroke', color)
            .attr('stroke-width', 1)
            .attr('cursor', 'pointer')
            .on('mouseenter', (event: MouseEvent) => {
              const svgRect = svg.getBoundingClientRect()
              setTooltip({
                x: event.clientX - svgRect.left,
                y: event.clientY - svgRect.top - 10,
                country: countryCode,
                count: group.length,
              })
            })
            .on('mouseleave', () => {
              setTooltip(null)
            })
        })
      }
    )

    // Cleanup
    return () => {
      while (svg.firstChild) {
        svg.removeChild(svg.firstChild)
      }
    }
  }, [insights])

  return (
    <div className="relative w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        className="w-full h-auto"
        style={{ background: 'var(--card)' }}
      />
      {tooltip && (
        <div
          className="absolute pointer-events-none z-10 rounded bg-popover text-popover-foreground border border-border px-3 py-1.5 text-xs shadow-lg"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <span className="font-semibold">{tooltip.country}</span>
          {' '}&mdash;{' '}
          {tooltip.count} insight{tooltip.count !== 1 ? 's' : ''}
        </div>
      )}
      {insights.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            No insights to display on the map.
          </p>
        </div>
      )}
    </div>
  )
}
