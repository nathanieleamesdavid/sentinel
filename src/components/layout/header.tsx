'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  lastRefreshed?: string
  onCrawlTriggered?: () => void
}

export function Header({ lastRefreshed, onCrawlTriggered }: HeaderProps) {
  const [isCrawling, setIsCrawling] = useState(false)

  async function handleCrawl() {
    setIsCrawling(true)
    try {
      const res = await fetch('/api/crawl', { method: 'POST' })
      if (!res.ok) {
        console.error('Crawl request failed:', res.statusText)
      }
      onCrawlTriggered?.()
    } catch (err) {
      console.error('Crawl request error:', err)
    } finally {
      setIsCrawling(false)
    }
  }

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-card border-b border-border">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-lg font-bold tracking-widest text-foreground">
            SENTINEL
          </h1>
          <p className="text-xs text-muted-foreground tracking-wide">
            Medeed Biotech Intelligence
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {lastRefreshed && (
          <span className="text-xs text-muted-foreground">
            Last refreshed: {lastRefreshed}
          </span>
        )}

        <Button
          size="sm"
          onClick={handleCrawl}
          disabled={isCrawling}
          className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isCrawling ? (
            <>
              <svg
                className="size-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Crawling...
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
              Refresh
            </>
          )}
        </Button>
      </div>
    </header>
  )
}
