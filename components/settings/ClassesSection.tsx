'use client';

import { useState } from 'react';
import { useClasses } from '@/hooks/useClasses';
import { ErrorBanner } from '@/components/ui/DataStates';

const gradeOptions = ['중1', '중2', '중3', '고1', '고2', '고3', '미지정'];

export function ClassesSection() {
  const { classes, loading, error, addClass, updateClass, deleteClass } = useClasses();
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

  const handleAdd = async () => {
    setBusy(true);
    const { error: err } = await addClass(name, grade);
    setBusy(false);
    if (err) showToast(err);
    else {
      showToast('반이 추가되었습니다.');
      setName('');
    }
  };

  const startEdit = (id: string, n: string, g: string) => {
    setEditingId(id);
    setEditName(n);
    setEditGrade(g);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setBusy(true);
    const { error: err } = await updateClass(editingId, editName, editGrade);
    setBusy(false);
    if (err) showToast(err);
    else {
      showToast('반 정보가 저장되었습니다.');
      setEditingId(null);
    }
  };

  const handleDelete = async (id: string, className: string) => {
    if (!confirm(`「${className}」 반을 삭제할까요?`)) return;
    setBusy(true);
    const { error: err } = await deleteClass(id);
    setBusy(false);
    showToast(err ?? '삭제되었습니다.');
  };

  return (
    <div className="rounded-2xl p-6 bg-white border border-slate-200 space-y-4">
      {toast && <p className="text-sm text-emerald-700">{toast}</p>}
      {error && <ErrorBanner message={error} />}

      <div>
        <h3 className="text-sm font-bold text-slate-900">반 관리</h3>
        <p className="text-xs text-slate-500 mt-1">
          학생 등록·수업 기록에서 사용할 반을 추가·수정·삭제합니다. 학생이나 수업 기록이 있는 반은 삭제할 수 없습니다.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="반 이름 (예: A반)"
          className="flex-1 min-w-[120px] px-3 py-2 border rounded-xl text-sm"
        />
        <select
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          className="px-3 py-2 border rounded-xl text-sm"
        >
          {gradeOptions.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAdd}
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
        <ul className="divide-y divide-slate-100 border border-slate-100 rounded-xl">
          {classes.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm">
              {editingId === c.id ? (
                <>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="px-2 py-1 border rounded-lg flex-1 min-w-[80px]"
                  />
                  <select
                    value={editGrade}
                    onChange={(e) => setEditGrade(e.target.value)}
                    className="px-2 py-1 border rounded-lg"
                  >
                    {gradeOptions.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={busy}
                    className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white cursor-pointer"
                  >
                    저장
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="text-xs px-3 py-1.5 rounded-lg border cursor-pointer"
                  >
                    취소
                  </button>
                </>
              ) : (
                <>
                  <span className="font-medium text-slate-800">
                    {c.name} <span className="text-slate-400 font-normal">({c.grade})</span>
                  </span>
                  <span className="flex-1" />
                  <button
                    type="button"
                    onClick={() => startEdit(c.id, c.name, c.grade)}
                    className="text-xs px-3 py-1.5 rounded-lg border cursor-pointer"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id, c.name)}
                    disabled={busy}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 cursor-pointer"
                  >
                    삭제
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
