'use client';

import { useCallback, useEffect, useState } from 'react';
import { useClasses } from '@/hooks/useClasses';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { ErrorBanner } from '@/components/ui/DataStates';
import { cn } from '@/lib/cn';

const gradeOptions = ['중1', '중2', '중3', '고1', '고2', '고3', '미지정'];

type SimpleStudent = { id: string; name: string; grade: string; class_id: string | null };

export function ClassesSection() {
  const { profile } = useAuth();
  const { classes, loading, error, addClass, updateClass, deleteClass } = useClasses();
  const bumpDataVersion = useAppStore((s) => s.bumpDataVersion);
  const dataVersion = useAppStore((s) => s.dataVersion);

  const [allStudents, setAllStudents] = useState<SimpleStudent[]>([]);
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);
  const [addingToClassId, setAddingToClassId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('중1');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const fetchStudents = useCallback(async () => {
    if (!profile?.academy_id) return;
    const { data } = await supabase
      .from('students')
      .select('id, name, grade, class_id')
      .eq('academy_id', profile.academy_id)
      .in('enrollment_status', ['active', 'on_leave', 'prospect'])
      .order('name');
    setAllStudents((data ?? []) as SimpleStudent[]);
  }, [profile?.academy_id]);

  useEffect(() => {
    void fetchStudents();
  }, [fetchStudents, dataVersion]);

  const handleAdd = async () => {
    setBusy(true);
    const { error: err } = await addClass(name, grade);
    setBusy(false);
    if (err) showToast(err);
    else { showToast('반이 추가되었습니다.'); setName(''); }
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setBusy(true);
    const { error: err } = await updateClass(editingId, editName, editGrade);
    setBusy(false);
    if (err) showToast(err);
    else { showToast('저장되었습니다.'); setEditingId(null); }
  };

  const handleDelete = async (id: string, className: string) => {
    if (!confirm(`「${className}」 반을 삭제할까요?`)) return;
    setBusy(true);
    const { error: err } = await deleteClass(id);
    setBusy(false);
    showToast(err ?? '삭제되었습니다.');
  };

  const handleAddStudent = async (classId: string, studentId: string) => {
    setBusy(true);
    await supabase.from('students').update({ class_id: classId }).eq('id', studentId);
    bumpDataVersion();
    await fetchStudents();
    setBusy(false);
    setAddingToClassId(null);
    showToast('학생을 반에 추가했습니다.');
  };

  const handleRemoveStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`${studentName} 학생을 반에서 빼시겠어요?`)) return;
    setBusy(true);
    await supabase.from('students').update({ class_id: null }).eq('id', studentId);
    bumpDataVersion();
    await fetchStudents();
    setBusy(false);
    showToast(`${studentName} 학생을 반에서 제거했습니다.`);
  };

  return (
    <div className="rounded-2xl p-6 bg-white border border-slate-200 space-y-4">
      {toast && <p className="text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">{toast}</p>}
      {error && <ErrorBanner message={error} />}

      <div>
        <h3 className="text-sm font-bold text-slate-900">반 관리</h3>
        <p className="text-xs text-slate-500 mt-1">반을 추가하고 소속 학생을 관리합니다.</p>
      </div>

      {/* 반 추가 폼 */}
      <div className="flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && name.trim() && void handleAdd()}
          placeholder="반 이름 (예: A반)"
          className="flex-1 min-w-[120px] px-3 py-2 border rounded-xl text-sm"
        />
        <select
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          className="px-3 py-2 border rounded-xl text-sm"
        >
          {gradeOptions.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <button
          type="button"
          onClick={() => void handleAdd()}
          disabled={busy || !name.trim()}
          className="px-4 py-2 rounded-xl bg-slate-800 text-white text-sm disabled:opacity-50 cursor-pointer"
        >
          반 추가
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">불러오는 중...</p>
      ) : classes.length === 0 ? (
        <p className="text-sm text-slate-500">등록된 반이 없습니다. 위에서 반을 추가해 주세요.</p>
      ) : (
        <ul className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
          {classes.map((c) => {
            const classStudents = allStudents.filter((s) => s.class_id === c.id);
            const unassigned = allStudents.filter((s) => s.class_id !== c.id);
            const isExpanded = expandedClassId === c.id;

            return (
              <li key={c.id}>
                {/* 반 헤더 행 */}
                <div className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm bg-white">
                  {editingId === c.id ? (
                    <>
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} className="px-2 py-1 border rounded-lg flex-1 min-w-[80px]" />
                      <select value={editGrade} onChange={(e) => setEditGrade(e.target.value)} className="px-2 py-1 border rounded-lg">
                        {gradeOptions.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                      <button type="button" onClick={() => void handleSaveEdit()} disabled={busy} className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white cursor-pointer">저장</button>
                      <button type="button" onClick={() => setEditingId(null)} className="text-xs px-3 py-1.5 rounded-lg border cursor-pointer">취소</button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setExpandedClassId(isExpanded ? null : c.id)}
                        className="flex items-center gap-2 flex-1 text-left"
                      >
                        <i className={cn('text-xs text-slate-400', isExpanded ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line')} />
                        <span className="font-medium text-slate-800">{c.name}</span>
                        <span className="text-slate-400 font-normal">({c.grade})</span>
                        <span className="ml-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          {classStudents.length}명
                        </span>
                      </button>
                      <button type="button" onClick={() => { setEditingId(c.id); setEditName(c.name); setEditGrade(c.grade); }} className="text-xs px-3 py-1.5 rounded-lg border cursor-pointer">수정</button>
                      <button type="button" onClick={() => void handleDelete(c.id, c.name)} disabled={busy} className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 cursor-pointer">삭제</button>
                    </>
                  )}
                </div>

                {/* 학생 목록 (펼쳤을 때) */}
                {isExpanded && (
                  <div className="bg-slate-50 px-4 pb-4 pt-2 border-t border-slate-100 space-y-3">
                    {classStudents.length === 0 ? (
                      <p className="text-xs text-slate-400 py-1">이 반에 등록된 학생이 없습니다.</p>
                    ) : (
                      <ul className="space-y-1">
                        {classStudents.map((s) => (
                          <li key={s.id} className="flex items-center gap-2 text-sm py-1">
                            <span className="flex-1 font-medium text-slate-800">{s.name}</span>
                            <span className="text-xs text-slate-400">{s.grade}</span>
                            <button
                              type="button"
                              onClick={() => void handleRemoveStudent(s.id, s.name)}
                              className="text-xs px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer"
                            >
                              반에서 빼기
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* 학생 추가 */}
                    {addingToClassId === c.id ? (
                      <div className="flex flex-wrap gap-2 pt-1">
                        <select
                          className="flex-1 min-w-[140px] px-3 py-1.5 border rounded-xl text-sm bg-white"
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) void handleAddStudent(c.id, e.target.value);
                          }}
                        >
                          <option value="" disabled>학생 선택…</option>
                          {unassigned.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.grade}){s.class_id ? ' · 다른 반' : ' · 미배정'}
                            </option>
                          ))}
                        </select>
                        <button type="button" onClick={() => setAddingToClassId(null)} className="text-xs px-3 py-1.5 rounded-xl border cursor-pointer">취소</button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAddingToClassId(c.id)}
                        className="text-xs px-3 py-1.5 rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50 cursor-pointer"
                      >
                        <i className="ri-user-add-line mr-1" />
                        학생 추가
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
