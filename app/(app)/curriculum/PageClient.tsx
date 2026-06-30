'use client';

import { useMemo, useState } from 'react';
import { useClasses } from '@/hooks/useLessonLogs';
import { useCurriculum } from '@/hooks/useCurriculum';
import { DEFAULT_MATH_UNITS } from '@/lib/curriculumDefaults';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageLoader, ErrorBanner } from '@/components/ui/DataStates';
import { STAFF_PAGES } from '@/lib/staffPages';

const grades = Object.keys(DEFAULT_MATH_UNITS);

export default function CurriculumPage() {
  const { classes } = useClasses();
  const { units, progress, loading, error, importDefaultUnits, setClassProgress } = useCurriculum();

  const [importGrade, setImportGrade] = useState('중2');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [unitName, setUnitName] = useState('');
  const [notes, setNotes] = useState('');
  const [toast, setToast] = useState('');

  const importUnits = units.filter((u) => u.grade === importGrade);
  const classProgress = progress.find((p) => p.class_id === selectedClassId);
  const selectedClass = classes.find((c) => c.id === selectedClassId);

  const unitOptions = useMemo(() => {
    const byGrade = new Map<string, typeof units>();
    for (const u of units) {
      const list = byGrade.get(u.grade) ?? [];
      list.push(u);
      byGrade.set(u.grade, list);
    }
    return [...byGrade.entries()].sort(([a], [b]) => {
      const ai = grades.indexOf(a);
      const bi = grades.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }, [units]);

  const handleImport = async () => {
    const result = await importDefaultUnits(importGrade);
    if (result.error) setToast(result.error);
    else {
      setToast(`${importGrade} 수학 기본 단원을 등록했습니다.`);
      setTimeout(() => setToast(''), 2500);
    }
  };

  const handleSaveProgress = async () => {
    if (!selectedClassId || !unitName.trim()) return;
    const unit = units.find((u) => u.unit_name === unitName.trim());
    const result = await setClassProgress({
      class_id: selectedClassId,
      unit_name: unitName.trim(),
      curriculum_unit_id: unit?.id,
      notes: notes.trim() || undefined,
    });
    if (result.error) setToast(result.error);
    else {
      setToast(`${selectedClass?.name ?? '반'} 진도가 저장되었습니다.`);
      setTimeout(() => setToast(''), 2500);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      <PageHeader title={STAFF_PAGES.curriculum.title} />
      {error && <ErrorBanner message={error} />}
      {toast && (
        <p className="text-sm rounded-xl px-3 py-2 app-inline-success">
          {toast}
        </p>
      )}

      <div className="flex flex-wrap gap-3 items-end">
        <label className="text-sm">
          <span className="block app-label mb-1">기본 단원 불러오기 (학년)</span>
          <select
            value={importGrade}
            onChange={(e) => setImportGrade(e.target.value)}
            className="rounded-xl px-3 py-2 text-sm"
            style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface)', color: 'var(--app-ink)' }}
          >
            {grades.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => void handleImport()} className="app-btn app-btn-secondary">
          {importGrade} 기본 단원 등록
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="app-card p-4">
          <h2 className="font-bold text-sm mb-3" style={{ color: 'var(--app-ink)' }}>
            등록된 단원 ({units.length})
          </h2>
          {units.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--app-ink-3)' }}>학년을 선택하고 「기본 단원 등록」을 눌러 주세요.</p>
          ) : (
            <div className="space-y-3 max-h-[360px] overflow-y-auto">
              {unitOptions.map(([grade, gradeUnits]) => (
                <div key={grade}>
                  <p className="text-xs font-bold mb-1" style={{ color: 'var(--app-ink-4)' }}>{grade}</p>
                  <ol className="space-y-0.5 text-sm list-decimal list-inside" style={{ color: 'var(--app-ink-2)' }}>
                    {gradeUnits.map((u) => (
                      <li key={u.id}>{u.unit_name}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="app-card p-4 space-y-4">
          <h2 className="font-bold text-sm" style={{ color: 'var(--app-ink)' }}>반별 현재 진도</h2>
          <p className="text-xs" style={{ color: 'var(--app-ink-3)' }}>
            반 학년과 관계없이 원하는 단원을 선택할 수 있습니다. (예: 중3반 → 고1 단원)
          </p>

          <select
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              const p = progress.find((x) => x.class_id === e.target.value);
              setUnitName(p?.unit_name ?? '');
              setNotes(p?.notes ?? '');
            }}
            className="w-full rounded-xl px-3 py-2 text-sm"
            style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface)', color: 'var(--app-ink)' }}
          >
            <option value="">반 선택</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.grade})
              </option>
            ))}
          </select>

          <select
            value={unitName}
            onChange={(e) => setUnitName(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-sm"
            style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface)', color: 'var(--app-ink)' }}
          >
            <option value="">현재 단원 선택</option>
            {unitOptions.map(([grade, gradeUnits]) => (
              <optgroup key={grade} label={grade}>
                {gradeUnits.map((u) => (
                  <option key={u.id} value={u.unit_name}>
                    {u.unit_name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="진도 메모 (선택)"
            rows={2}
            className="w-full rounded-xl px-3 py-2 text-sm"
            style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface)', color: 'var(--app-ink)' }}
          />

          {selectedClassId && unitName && (
            <div
              className="rounded-xl p-4 space-y-2"
              style={{ background: 'var(--app-surface-2)', border: '1px solid var(--app-border)' }}
            >
              <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--app-ink-4)' }}>
                저장 전 확인
              </p>
              <p className="text-sm">
                <span className="font-semibold" style={{ color: 'var(--app-ink)' }}>
                  {selectedClass?.name}
                </span>
                <span style={{ color: 'var(--app-ink-3)' }}> → </span>
                <span className="font-semibold" style={{ color: 'var(--app-accent)' }}>
                  {unitName}
                </span>
              </p>
              {notes && (
                <p className="text-xs" style={{ color: 'var(--app-ink-3)' }}>
                  메모: {notes}
                </p>
              )}
              {classProgress && (
                <p className="text-[11px]" style={{ color: 'var(--app-ink-4)' }}>
                  이전 진도: {classProgress.unit_name} (수정 {classProgress.updated_at.slice(0, 10)})
                </p>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => void handleSaveProgress()}
            disabled={!selectedClassId || !unitName}
            className="w-full app-btn app-btn-primary disabled:opacity-50"
          >
            진도 저장
          </button>
        </div>
      </div>

      <div className="app-card overflow-hidden">
        <div className="px-4 py-3 font-bold text-sm" style={{ borderBottom: '1px solid var(--app-border)', color: 'var(--app-ink)' }}>
          전체 반 진도 요약
        </div>
        <ul className="divide-y divide-[var(--app-border)]">
          {progress.length === 0 ? (
            <li className="p-6 text-sm text-center" style={{ color: 'var(--app-ink-3)' }}>등록된 진도가 없습니다.</li>
          ) : (
            progress.map((p) => (
              <li key={p.id} className="px-4 py-3 flex justify-between text-sm gap-4">
                <span className="font-medium" style={{ color: 'var(--app-ink)' }}>
                  {p.classes?.name ?? '반'} ({p.classes?.grade})
                </span>
                <span className="font-semibold text-right" style={{ color: 'var(--app-accent)' }}>{p.unit_name}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
