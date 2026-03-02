'use client'

import { cn } from '@/lib/utils'

const tabs = [
  { value: 'digest', label: 'Digest' },
  { value: 'landscape', label: 'Landscape' },
  { value: 'world', label: 'World Map' },
  { value: 'body', label: 'Body Map' },
  { value: 'tracker', label: 'Tracker' },
] as const

interface NavTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function NavTabs({ activeTab, onTabChange }: NavTabsProps) {
  return (
    <nav className="flex items-center gap-1 px-6 py-2 bg-card border-b border-border">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value
        return (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            className={cn(
              'relative px-4 py-2 text-sm font-medium rounded-md transition-colors',
              isActive
                ? 'text-foreground bg-accent'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            {tab.label}
            {isActive && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        )
      })}
    </nav>
  )
}
