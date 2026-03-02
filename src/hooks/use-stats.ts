'use client'

import useSWR from 'swr'
import type { Stats } from '@/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useStats() {
  const { data, error, isLoading, mutate } = useSWR<Stats>(
    '/api/stats',
    fetcher
  )

  return {
    stats: data ?? null,
    loading: isLoading,
    error,
    refetch: mutate,
  }
}
