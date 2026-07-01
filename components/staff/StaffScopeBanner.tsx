'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useStaffScope } from '@/hooks/useStaffScope';
import { useClasses } from '@/hooks/useLessonLogs';
import { cn } from '@/lib/cn';

export function StaffScopeBanner({ className }: { className?: string }) {
  const scope = useStaffScope();
  const { classes } = useClasses();

  const assignedClasses = useMemo(() => {
    if (!scope.isTeacher || scope.classIds.length === 0) return [];
    const idSet = new Set(scope.classIds);
    return classes.filter((c) => idSet.has(c.id));
  }, [classes, scope.classIds, scope.isTeacher]);

  if (scope.loading || !scope.isTeacher) return null;

  if (assignedClasses.length === 0) {
    return (
      <div
        className={cn(
          'rounded-xl px-4 py-3 text-sm flex flex-wrap items-center justify-between gap-3',
          className
        )}
        style={{
          background: 'var(--app-warning-bg)',
          border: '1px solid var(--app-warning-border, var(--app-border))',
          color: 'var(--app-warning-text)',
        }}
      >
        <p>
          <span className="font-semibold">담당 반이 아직 배정되지 않았습니다.</span>
          <span className="block text-xs mt-0.5 opacity-90">
            원장님께 반 배정을 요청해 주세요. 배정 전에는 학생·수업 목록이 비어 있을 수 있습니다.
          </span>
        </p>
        <Link
          href="/settings?tab=classes"
          className="text-xs font-semibold underline shrink-0"
          style={{ color: 'var(--app-warning-text)' }}
        >
          반 관리 안내 →
        </Link>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl px-4 py-2.5 text-xs flex flex-wrap items-center gap-2',
        className
      )}
      style={{
        background: 'var(--app-surface-2)',
        border: '1px solid var(--app-border)',
        color: 'var(--app-ink-3)',
      }}
    >
      <i className="ri-team-line text-sm" style={{ color: 'var(--app-accent)' }} aria-hidden />
      <span className="font-medium" style={{ color: 'var(--app-ink-2)' }}>
        담당 반
      </span>
      <span className="flex flex-wrap gap-1.5">
        {assignedClasses.map((c) => (
          <span
            key={c.id}
            className="inline-flex items-center rounded-full px-2 py-0.5 font-semibold"
            style={{ background: 'var(--app-surface)', color: 'var(--app-ink)', border: '1px solid var(--app-border)' }}
          >
            {c.name}
          </span>
        ))}
      </span>
      <span className="text-[11px] w-full sm:w-auto sm:ml-auto" style={{ color: 'var(--app-ink-4)' }}>
        담당 반 학생·수업만 표시됩니다
      </span>
    </div>
  );
}
