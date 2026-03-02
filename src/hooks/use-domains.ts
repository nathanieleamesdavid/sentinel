'use client'

import useSWR from 'swr'
import type { DomainInfo } from '@/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useDomains() {
  const { data, error, isLoading, mutate } = useSWR<DomainInfo[]>(
    '/api/domains',
    fetcher
  )

  return {
    domains: data ?? [],
    loading: isLoading,
    error,
    refetch: mutate,
  }
}
