'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AgentLog, DashboardAgentInsight } from '@/types/database';
import type { AgentJobRow } from '@/components/dashboard/AgentWorkflowPanel';
import type { AgentFeedItem } from '@/components/dashboard/AgentActionFeed';

export function useDashboardAgent(options?: { refreshRiskOnLoad?: boolean }) {
  const [insight, setInsight] = useState<DashboardAgentInsight | null>(null);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [jobs, setJobs] = useState<AgentJobRow[]>([]);
  const [feed, setFeed] = useState<AgentFeedItem[]>([]);
  const [notifications, setNotifications] = useState({
    consultation: 0,
    makeup: 0,
    attention: 0,
    message: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = options?.refreshRiskOnLoad ? '?refreshRisk=1' : '';
      const [dashRes, logsRes, workflowRes, feedRes] = await Promise.all([
        fetch(`/api/agents/dashboard${qs}`),
        fetch('/api/agents/logs?limit=20'),
        fetch('/api/agents/workflow'),
        fetch('/api/agents/feed?limit=25'),
      ]);
      const dash = await dashRes.json();
      const logData = await logsRes.json();
      const workflow = await workflowRes.json();
      const feedData = await feedRes.json();

      if (!dash.ok) {
        setError(dash.error ?? 'Agent 데이터를 불러오지 못했습니다.');
        setInsight(null);
      } else {
        setInsight(dash.insight);
      }

      if (logData.ok) {
        setLogs(logData.logs ?? []);
      }

      if (workflow.ok) {
        setJobs(workflow.jobs ?? []);
      }

      if (feedData.ok) {
        setFeed(feedData.feed ?? []);
        if (feedData.notifications) {
          setNotifications(feedData.notifications);
        }
      }
    } catch {
      setError('네트워크 오류');
    } finally {
      setLoading(false);
    }
  }, [options?.refreshRiskOnLoad]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    insight,
    logs,
    jobs,
    feed,
    notifications,
    loading,
    error,
    refetch: load,
  };
}
