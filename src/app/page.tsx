'use client';

import { useState, useMemo, useCallback } from 'react';
import { useInsights } from '@/hooks/use-insights';
import { useDomains } from '@/hooks/use-domains';
import { useStats } from '@/hooks/use-stats';
import { DOMAINS } from '@/lib/constants';
import { Header } from '@/components/layout/header';
import { NavTabs } from '@/components/layout/nav-tabs';
import { DomainSidebar } from '@/components/layout/domain-sidebar';
import { DigestView } from '@/components/views/digest-view';
import { LandscapeView } from '@/components/views/landscape-view';
import { WorldMapView } from '@/components/views/world-map-view';
import { BodyMapView } from '@/components/views/body-map-view';
import { TrackerView } from '@/components/views/tracker-view';
import { InsightDetailPanel } from '@/components/insights/insight-detail-panel';
import type { Insight } from '@/types';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('digest');
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [activeDomains, setActiveDomains] = useState<Set<string>>(
    () => new Set(DOMAINS.map((d) => d.name))
  );

  const { insights, loading: insightsLoading, refetch } = useInsights();
  const { domains, loading: domainsLoading } = useDomains();
  const { stats, loading: statsLoading } = useStats();

  // Merge domain metadata (colors, positions) with counts from API
  const domainsWithCounts = useMemo(
    () =>
      DOMAINS.map((domain) => {
        const match = domains.find((d) => d.name === domain.name);
        return { ...domain, count: match?.count ?? 0 };
      }),
    [domains]
  );

  // Filter insights to only those in active domains
  const filteredInsights = useMemo(
    () => insights.filter((insight) => insight.domain && activeDomains.has(insight.domain)),
    [insights, activeDomains]
  );

  const handleToggleDomain = (domainName: string) => {
    setActiveDomains((prev) => {
      const next = new Set(prev);
      if (next.has(domainName)) {
        next.delete(domainName);
      } else {
        next.add(domainName);
      }
      return next;
    });
  };

  // Mark insight as read when opening detail panel
  const handleSelectInsight = useCallback((insight: Insight) => {
    setSelectedInsight(insight);
    if (!insight.isRead) {
      fetch(`/api/insights/${insight.id}/read`, { method: 'PATCH' }).catch(
        console.error
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        onCrawlTriggered={() => refetch()}
      />

      <div className="flex">
        <DomainSidebar
          domains={domainsWithCounts}
          activeDomains={activeDomains}
          onToggleDomain={handleToggleDomain}
        />

        <main className="flex-1 min-w-0">
          <NavTabs activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="p-0">
            {activeTab === 'digest' && (
              <DigestView
                insights={filteredInsights}
                loading={insightsLoading}
                selectedInsightId={selectedInsight?.id ?? null}
                onSelectInsight={handleSelectInsight}
              />
            )}
            {activeTab === 'landscape' && (
              <LandscapeView
                insights={filteredInsights}
                domains={domainsWithCounts}
              />
            )}
            {activeTab === 'world' && (
              <WorldMapView
                insights={filteredInsights}
              />
            )}
            {activeTab === 'body' && (
              <BodyMapView
                insights={filteredInsights}
              />
            )}
            {activeTab === 'tracker' && <TrackerView />}
          </div>
        </main>
      </div>

      <InsightDetailPanel
        insight={selectedInsight}
        onClose={() => setSelectedInsight(null)}
      />
    </div>
  );
}
