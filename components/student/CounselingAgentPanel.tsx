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
        setError(data.error ?? 'Agent 실행에 실패했습니다.');
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
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Counseling Agent</h3>
          <p className="text-xs text-slate-500 mt-1">
            {studentName} — 성적·숙제·상담·위험 신호를 RAG로 모아 상담 브리핑 생성
          </p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
        >
          {loading ? '분석 중…' : 'AI 상담 준비'}
        </button>
      </div>

      {error && (
        <p className="text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      {result && (
        <div className="space-y-4 text-sm bg-white rounded-xl border border-indigo-100/80 p-4">
          <p className="text-[10px] text-indigo-500 font-medium">
            {result.source === 'gemini' ? 'Gemini + RAG' : '규칙 기반'}
          </p>
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">상담 요약</p>
            <p className="text-slate-800 leading-relaxed">{result.summary}</p>
          </div>
          <BulletBlock title="주요 문제" items={result.mainIssues} />
          <BulletBlock title="상담 포인트" items={result.consultationPoints} />
          <BulletBlock title="추천 액션" items={result.recommendedActions} />
          <Link
            href={`/consultation-cards?student=${studentId}`}
            className="inline-flex text-xs font-semibold text-indigo-600 hover:underline"
          >
            상담 카드 만들기 →
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
      <p className="text-xs font-semibold text-slate-500 mb-1">{title}</p>
      <ul className="list-disc list-inside text-slate-700 space-y-1">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
