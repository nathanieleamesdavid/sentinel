'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface Domain {
  name: string
  label: string
  color: string
  count: number
}

interface DomainSidebarProps {
  domains: Domain[]
  activeDomains: Set<string>
  onToggleDomain: (domain: string) => void
}

export function DomainSidebar({
  domains,
  activeDomains,
  onToggleDomain,
}: DomainSidebarProps) {
  return (
    <aside className="w-56 shrink-0 bg-card border-r border-border p-4 flex flex-col gap-1">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-2">
        Therapeutic Domains
      </h2>

      {domains.map((domain) => {
        const isActive = activeDomains.has(domain.name)
        return (
          <button
            key={domain.name}
            onClick={() => onToggleDomain(domain.name)}
            className={cn(
              'flex items-center gap-2.5 w-full px-2.5 py-2 rounded-md text-sm transition-colors text-left',
              isActive
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            <span
              className={cn(
                'size-2.5 rounded-full shrink-0 transition-opacity',
                isActive ? 'opacity-100' : 'opacity-40'
              )}
              style={{ backgroundColor: domain.color }}
            />

            <span className="flex-1 truncate">{domain.label}</span>

            <Badge
              variant="secondary"
              className={cn(
                'text-[10px] px-1.5 py-0 h-5 rounded-full font-medium tabular-nums',
                isActive
                  ? 'bg-secondary text-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {domain.count}
            </Badge>
          </button>
        )
      })}
    </aside>
  )
}
