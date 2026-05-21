'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStudents } from '@/hooks/useStudents';
import { useClasses } from '@/hooks/useClasses';
import { linkStudentPortals } from '@/lib/portalLink';
import { STATUS_LABELS, STATUS_STYLES } from '@/lib/statusLabels';
import { ErrorBanner, TableSkeleton, EmptyState } from '@/components/ui/DataStates';
import type { StudentStatus } from '@/types/database';

const gradeOptions = ['전체', '중1', '중2', '중3', '고1', '고2', '고3'];
const statusOptions: { label: string; value: string }[] = [
  { label: '전체', value: '전체' },
  { label: STATUS_LABELS.stable, value: 'stable' },
  { label: STATUS_LABELS.attention, value: 'attention' },
  { label: STATUS_LABELS.consultation, value: 'consultation' },
];

export default function StudentsPage() {
  const { students, loading, error, refetch, addStudent, updateStudent, deleteStudent } =
    useStudents();
  const { classes } = useClasses();
  const [search, setSearch] = useState('');
  const [grade, setGrade] = useState('전체');
  const [classFilter, setClassFilter] = useState('전체');
  const [status, setStatus] = useState('전체');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  const [form, setForm] = useState({
    name: '',
    grade: '중1',
    class_id: '' as string,
    school: '',
    status: 'stable' as StudentStatus,
    parent_email: '',
    student_email: '',
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({
      name: '',
      grade: '중1',
      class_id: classes[0]?.id ?? '',
      school: '',
      status: 'stable',
      parent_email: '',
      student_email: '',
    });
    setShowModal(true);
  };

  const openEdit = (s: (typeof students)[0]) => {
    setEditingId(s.id);
    setForm({
      name: s.name,
      grade: s.grade,
      class_id: s.class_id ?? '',
      school: s.school ?? '',
      status: s.status,
      parent_email: s.parent_user?.email ?? '',
      student_email: s.student_portal?.email ?? '',
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name) return;
    setSubmitting(true);
    const payload = {
      name: form.name,
      grade: form.grade,
      class_id: form.class_id || null,
      school: form.school,
      status: form.status,
    };
    const result = editingId
      ? await updateStudent(editingId, payload)
      : await addStudent(payload);
    if (result.error) {
      setSubmitting(false);
      showToast(result.error);
      return;
    }

    const studentId =
      editingId ?? ('id' in result && typeof result.id === 'string' ? result.id : undefined);
    if (studentId) {
      const linkResult = await linkStudentPortals(studentId, {
        parentEmail: form.parent_email,
        studentEmail: form.student_email,
      });
      if (linkResult.error) {
        setSubmitting(false);
        showToast(linkResult.error);
        return;
      }
    }

    setSubmitting(false);
    showToast(editingId ? '수정되었습니다.' : '등록되었습니다.');
    setShowModal(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`${name} 학생을 삭제할까요? 관련 기록도 삭제됩니다.`)) return;
    const { error: err } = await deleteStudent(id);
    showToast(err ? err : '삭제되었습니다.');
  };

  const filtered = students.filter((s) => {
    if (search && !s.name.includes(search)) return false;
    if (grade !== '전체' && s.grade !== grade) return false;
    if (classFilter !== '전체' && s.class_id !== classFilter) return false;
    if (status !== '전체' && s.status !== status) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-20 right-8 z-50 rounded-xl px-5 py-3 text-sm font-semibold text-white bg-emerald-600 shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Students</h1>
          <p className="text-sm text-slate-500 mt-1">학생 목록 · Supabase 연동</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #1e3a5f, #0f1e32)' }}
        >
          <i className="ri-user-add-line"></i>학생 등록
        </button>
      </div>

      {error && <ErrorBanner message={error} onRetry={refetch} />}

      <div className="rounded-2xl p-5 flex flex-wrap gap-3 bg-white border border-slate-200">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이름 검색"
          className="flex-1 min-w-[180px] px-3 py-2 rounded-xl border border-slate-200 text-sm"
        />
        <select
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm"
        >
          {gradeOptions.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm"
        >
          <option value="전체">전체 반</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm"
        >
          {statusOptions.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl overflow-hidden bg-white border border-slate-200">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 text-xs text-slate-500 uppercase">
              <th className="px-6 py-4">학생</th>
              <th className="px-6 py-4">학년</th>
              <th className="px-6 py-4">반</th>
              <th className="px-6 py-4">상태</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <TableSkeleton />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState title="학생이 없습니다" description="학생을 등록하거나 필터를 변경해 보세요." />
                </td>
              </tr>
            ) : (
              filtered.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-semibold text-sm">{student.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{student.grade}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {(student.classes as { name?: string })?.name ?? '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[student.status]}`}
                    >
                      {STATUS_LABELS[student.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex gap-2 justify-end">
                    <Link href={`/students/${student.id}`}>
                      <button type="button" className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer">
                        상세
                      </button>
                    </Link>
                    <button
                      type="button"
                      onClick={() => openEdit(student)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(student.id, student.name)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 cursor-pointer"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 border border-slate-200 shadow-xl space-y-4">
            <h2 className="text-lg font-bold">{editingId ? '학생 수정' : '학생 등록'}</h2>
            <input
              placeholder="이름 *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
            />
            <select
              value={form.grade}
              onChange={(e) => setForm({ ...form, grade: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
            >
              {gradeOptions.filter((g) => g !== '전체').map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <select
              value={form.class_id}
              onChange={(e) => setForm({ ...form, class_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
            >
              <option value="">반 없음</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.grade})
                </option>
              ))}
            </select>
            <input
              placeholder="학교"
              value={form.school}
              onChange={(e) => setForm({ ...form, school: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
            />
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as StudentStatus })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
            >
              {(['stable', 'attention', 'consultation'] as StudentStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <p className="text-xs font-semibold text-slate-600">포털 연결 (회원가입 이메일)</p>
              <input
                type="email"
                placeholder="학부모 이메일 (비우면 연결 해제)"
                value={form.parent_email}
                onChange={(e) => setForm({ ...form, parent_email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
              />
              <input
                type="email"
                placeholder="학생 이메일 (비우면 연결 해제)"
                value={form.student_email}
                onChange={(e) => setForm({ ...form, student_email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
              />
              <p className="text-[11px] text-slate-400">
                학부모·학생 계정이 먼저 가입되어 있어야 합니다. 설정 화면의 안내를 참고하세요.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border rounded-xl cursor-pointer">
                취소
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-xl disabled:opacity-50 cursor-pointer"
              >
                {submitting ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
