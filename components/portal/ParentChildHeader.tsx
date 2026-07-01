'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePortalChild } from '@/context/PortalChildContext';
import { ConnectStudentPanel } from '@/components/portal/ConnectStudentPanel';
import { PortalStat } from '@/components/portal/ParentUI';
import { usePortalClassProgress } from '@/hooks/useCurriculum';
import type { Student } from '@/types/database';
import { cn } from '@/lib/cn';

function homeworkHint(rate: number, hasLogs: boolean): { text: string; warn: boolean } {
  if (!hasLogs) return { text: '—', warn: false };
  if (rate >= 85) return { text: '잘 하고 있어요', warn: false };
  if (rate >= 60) return { text: '가끔 빠뜨려요', warn: true };
  return { text: '챙겨 주세요', warn: true };
}

export function ParentChildHeader({
  child,
  latestScore,
  hwRate,
  logCount,
  compact,
}: {
  child: Student;
  latestScore: number | null;
  hwRate: number;
  logCount: number;
  compact?: boolean;
}) {
  const { profile } = useAuth();
  const { children, selectedId, setSelectedId, reload } = usePortalChild();
  const [showAddChild, setShowAddChild] = useState(false);
  const { progress: classProgress } = usePortalClassProgress(child.class_id);
  const hwHint = homeworkHint(hwRate, logCount > 0);
  const academyName =
    (child as Student & { academies?: { name: string } })?.academies?.name ?? '학원';

  return (
    <header className="parent-card overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-400" />
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 border border-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-700 shrink-0">
            {child.name.slice(0, 1)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-indigo-600">{academyName}</p>
            <h1 className="text-xl font-bold text-stone-900 tracking-tight">{child.name}</h1>
            <p className="text-sm text-stone-500">{child.grade}</p>
          </div>
        </div>

        {!compact && (
          <p className="text-sm text-stone-600 mt-4">
            <span className="font-medium text-stone-800">{profile?.name ?? '학부모'}</span>님,
            선생님이 기록한 학습 관리 내역입니다.
          </p>
        )}

        <div className="mt-4 pt-4 border-t border-stone-100">
          <div className="flex items-center justify-between mb-2">
            {children.length > 1 && (
              <p className="text-xs font-medium text-stone-500">자녀 선택</p>
            )}
            <button
              type="button"
              onClick={() => setShowAddChild((v) => !v)}
              className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer ml-auto"
            >
              <i className="ri-add-line" />
              자녀 추가
            </button>
          </div>
          {showAddChild && (
            <div className="mb-3 p-4 rounded-xl border border-indigo-100 bg-indigo-50/40">
              <ConnectStudentPanel
                mode="parent"
                onSubmitted={() => {
                  setShowAddChild(false);
                  void reload();
                }}
              />
            </div>
          )}
          {children.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {children.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-sm font-semibold border cursor-pointer transition-all',
                    c.id === selectedId
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-stone-50 text-stone-700 border-stone-200'
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {classProgress && (
          <p className="text-xs text-indigo-600 mt-3">
            현재 진도: <strong>{classProgress.unit_name}</strong>
          </p>
        )}

        {!compact && (
          <div className="grid grid-cols-3 gap-3 mt-5 max-w-md">
            <PortalStat
              label="최근 점수"
              value={latestScore != null ? `${latestScore}점` : '—'}
              accent="score"
            />
            <PortalStat
              label="숙제"
              value={hwHint.text}
              sub={logCount > 0 ? `제출률 ${hwRate}%` : undefined}
              accent={hwHint.warn ? 'homework' : 'neutral'}
            />
            <PortalStat label="수업 기록" value={`${logCount}회`} accent="neutral" />
          </div>
        )}
      </div>
    </header>
  );
}
