'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { CounselingAgentResult } from '@/types/database';

export function CounselingAgentPanel({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<CounselingAgentResult | null>(null);

  const run = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/agents/counseling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? '상담 준비에 실패했습니다.');
        setResult(null);
        return;
      }
      setResult({
        summary: data.summary,
        mainIssues: data.mainIssues,
        consultationPoints: data.consultationPoints,
        recommendedActions: data.recommendedActions,
        source: data.source,
      });
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface-2)' }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>상담 준비</h3>
          <p className="text-xs mt-1" style={{ color: 'var(--app-ink-3)' }}>
            {studentName} — 출결·숙제·성적·상담 기록을 모아 상담 준비 메모를 생성합니다
          </p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="app-btn app-btn-primary text-sm disabled:opacity-50 cursor-pointer"
        >
          {loading ? '준비 중…' : '상담 준비'}
        </button>
      </div>

      {error && (
        <p className="text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      {result && (
        <div className="space-y-4 text-sm rounded-xl p-4" style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)' }}>
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--app-ink-3)' }}>상담 요약</p>
            <p className="leading-relaxed" style={{ color: 'var(--app-ink)' }}>{result.summary}</p>
          </div>
          <BulletBlock title="주요 이슈" items={result.mainIssues} />
          <BulletBlock title="상담 준비 메모" items={result.consultationPoints} />
          <BulletBlock title="추천 조치" items={result.recommendedActions} />
          <Link
            href={`/consultation-cards?student=${studentId}`}
            className="inline-flex text-xs font-semibold hover:underline"
            style={{ color: 'var(--app-accent)' }}
          >
            상담 요약 저장 →
          </Link>
        </div>
      )}
    </div>
  );
}

function BulletBlock({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--app-ink-3)' }}>{title}</p>
      <ul className="list-disc list-inside space-y-1" style={{ color: 'var(--app-ink-2)' }}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
