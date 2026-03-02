'use client'

import useSWR from 'swr'
import type { Insight } from '@/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface UseInsightsParams {
  daysBack?: number
  limit?: number
  domain?: string | null
  path?: number | null
}

export function useInsights(params: UseInsightsParams = {}) {
  const searchParams = new URLSearchParams()
  if (params.daysBack) searchParams.set('days_back', String(params.daysBack))
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.domain) searchParams.set('domain', params.domain)
  if (params.path) searchParams.set('path', String(params.path))

  const query = searchParams.toString()
  const { data, error, isLoading, mutate } = useSWR<Insight[]>(
    `/api/insights${query ? `?${query}` : ''}`,
    fetcher
  )

  return {
    insights: data ?? [],
    loading: isLoading,
    error,
    refetch: mutate,
  }
}
