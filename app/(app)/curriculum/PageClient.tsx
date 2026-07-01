'use client';

import { useMemo, useState } from 'react';
import { useClasses } from '@/hooks/useLessonLogs';
import { useCurriculum } from '@/hooks/useCurriculum';
import { DEFAULT_MATH_UNITS, CURRICULUM_SUBJECTS } from '@/lib/curriculumDefaults';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageLoader, ErrorBanner } from '@/components/ui/DataStates';
import { STAFF_PAGES } from '@/lib/staffPages';

const grades = Object.keys(DEFAULT_MATH_UNITS);

export default function CurriculumPage() {
  const { classes } = useClasses();
  const { units, progress, loading, error, importDefaultUnits, addCustomUnit, setClassProgress } = useCurriculum();

  const [subject, setSubject] = useState<string>('수학');
  const [importGrade, setImportGrade] = useState('중2');
  const [customUnitName, setCustomUnitName] = useState('');
  const [customGrade, setCustomGrade] = useState('중2');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [unitName, setUnitName] = useState('');
  const [notes, setNotes] = useState('');
  const [toast, setToast] = useState('');

  const subjectUnits = useMemo(() => units.filter((u) => u.subject === subject), [units, subject]);
  const importUnits = subjectUnits.filter((u) => u.grade === importGrade);
  const classProgress = progress.find((p) => p.class_id === selectedClassId);
  const selectedClass = classes.find((c) => c.id === selectedClassId);

  const unitOptions = useMemo(() => {
    const byGrade = new Map<string, typeof subjectUnits>();
    for (const u of subjectUnits) {
      const list = byGrade.get(u.grade) ?? [];
      list.push(u);
      byGrade.set(u.grade, list);
    }
    return [...byGrade.entries()].sort(([a], [b]) => {
      const ai = grades.indexOf(a);
      const bi = grades.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }, [subjectUnits]);

  const handleImport = async () => {
    const result = await importDefaultUnits(importGrade, subject);
    if (result.error) setToast(result.error);
    else {
      setToast(`${importGrade} ${subject} 기본 단원을 등록했습니다.`);
      setTimeout(() => setToast(''), 2500);
    }
  };

  const handleAddUnit = async () => {
    const result = await addCustomUnit({ subject, grade: customGrade, unit_name: customUnitName });
    if (result.error) setToast(result.error);
    else {
      setToast(`「${customUnitName.trim()}」 단원을 추가했습니다.`);
      setCustomUnitName('');
      setTimeout(() => setToast(''), 2500);
    }
  };

  const handleSaveProgress = async () => {
    if (!selectedClassId || !unitName.trim()) return;
    const unit = subjectUnits.find((u) => u.unit_name === unitName.trim());
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
          <span className="block app-label mb-1">과목</span>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="rounded-xl px-3 py-2 text-sm"
            style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface)', color: 'var(--app-ink)' }}
          >
            {CURRICULUM_SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        {subject === '수학' && (
          <>
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
          </>
        )}
      </div>

      {subject !== '수학' && (
        <div className="app-card p-4 flex flex-wrap gap-3 items-end">
          <label className="text-sm flex-1 min-w-[140px]">
            <span className="block app-label mb-1">학년</span>
            <select
              value={customGrade}
              onChange={(e) => setCustomGrade(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm"
              style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface)', color: 'var(--app-ink)' }}
            >
              {grades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm flex-[2] min-w-[180px]">
            <span className="block app-label mb-1">단원명 직접 등록</span>
            <input
              value={customUnitName}
              onChange={(e) => setCustomUnitName(e.target.value)}
              placeholder="예: 문법 1단원"
              className="w-full rounded-xl px-3 py-2 text-sm"
              style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface)', color: 'var(--app-ink)' }}
            />
          </label>
          <button
            type="button"
            onClick={() => void handleAddUnit()}
            disabled={!customUnitName.trim()}
            className="app-btn app-btn-secondary disabled:opacity-50"
          >
            단원 추가
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="app-card p-4">
          <h2 className="font-bold text-sm mb-3" style={{ color: 'var(--app-ink)' }}>
            {subject} 등록 단원 ({subjectUnits.length})
          </h2>
          {subjectUnits.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--app-ink-3)' }}>
              {subject === '수학'
                ? '학년을 선택하고 「기본 단원 등록」을 눌러 주세요.'
                : '위에서 단원명을 직접 등록해 주세요.'}
            </p>
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
            progress.map((p) => {
              const classGrade = p.classes?.grade ?? '';
              const gradeUnits = subjectUnits
                .filter((u) => u.grade === classGrade)
                .sort((a, b) => a.sort_order - b.sort_order);
              const currentIdx = gradeUnits.findIndex((u) => u.unit_name === p.unit_name);
              const pct =
                gradeUnits.length > 0 && currentIdx >= 0
                  ? Math.round(((currentIdx + 1) / gradeUnits.length) * 100)
                  : null;
              return (
                <li key={p.id} className="px-4 py-3 space-y-2">
                  <div className="flex justify-between text-sm gap-4">
                    <span className="font-medium" style={{ color: 'var(--app-ink)' }}>
                      {p.classes?.name ?? '반'} ({p.classes?.grade})
                    </span>
                    <span className="font-semibold text-right" style={{ color: 'var(--app-accent)' }}>
                      {p.unit_name}
                    </span>
                  </div>
                  {pct != null && (
                    <div className="space-y-1">
                      <div
                        className="h-1.5 rounded-full overflow-hidden"
                        style={{ background: 'var(--app-surface-2)' }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: 'var(--app-accent)' }}
                        />
                      </div>
                      <p className="text-[10px]" style={{ color: 'var(--app-ink-4)' }}>
                        {classGrade} {subject} · {currentIdx + 1}/{gradeUnits.length}단원 ({pct}%)
                      </p>
                    </div>
                  )}
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
