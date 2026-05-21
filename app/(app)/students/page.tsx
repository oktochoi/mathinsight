'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useStudents } from '@/hooks/useStudents';
import { useClasses } from '@/hooks/useClasses';
import { linkStudentPortals } from '@/lib/portalLink';
import {
  isParentLinked,
  isStudentPortalLinked,
  studentParentEmail,
  studentPortalEmail,
} from '@/lib/studentPortal';
import { ClassesSection } from '@/components/settings/ClassesSection';
import { StudentsByStudentView } from '@/components/students/StudentsByStudentView';
import { STATUS_LABELS, STATUS_STYLES } from '@/lib/statusLabels';
import { ErrorBanner, TableSkeleton, EmptyState, PageLoader } from '@/components/ui/DataStates';
import type { Student, StudentStatus } from '@/types/database';

const gradeOptions = ['전체', '중1', '중2', '중3', '고1', '고2', '고3'];
const statusOptions: { label: string; value: string }[] = [
  { label: '전체', value: '전체' },
  { label: STATUS_LABELS.stable, value: 'stable' },
  { label: STATUS_LABELS.attention, value: 'attention' },
  { label: STATUS_LABELS.consultation, value: 'consultation' },
];

function StudentsPageContent() {
  const searchParams = useSearchParams();
  const { students, loading, error, refetch, addStudent, updateStudent, deleteStudent } =
    useStudents();
  const { classes } = useClasses();
  const [search, setSearch] = useState('');
  const [grade, setGrade] = useState('전체');
  const [classFilter, setClassFilter] = useState('전체');
  const [status, setStatus] = useState('전체');
  const [viewMode, setViewMode] = useState<'list' | 'by-student'>('list');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [showClasses, setShowClasses] = useState(true);
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

  const filtered = useMemo(
    () =>
      students.filter((s) => {
        if (search && !s.name.includes(search)) return false;
        if (grade !== '전체' && s.grade !== grade) return false;
        if (classFilter !== '전체' && s.class_id !== classFilter) return false;
        if (status !== '전체' && s.status !== status) return false;
        return true;
      }),
    [students, search, grade, classFilter, status]
  );

  useEffect(() => {
    if (filtered.length === 0) return;
    if (!selectedStudentId || !filtered.some((s) => s.id === selectedStudentId)) {
      setSelectedStudentId(filtered[0].id);
    }
  }, [filtered, selectedStudentId]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
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

  const openEdit = (s: Student) => {
    setEditingId(s.id);
    setForm({
      name: s.name,
      grade: s.grade,
      class_id: s.class_id ?? '',
      school: s.school ?? '',
      status: s.status,
      parent_email: studentParentEmail(s),
      student_email: studentPortalEmail(s),
    });
    setShowModal(true);
  };

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId || loading) return;
    const target = students.find((s) => s.id === editId);
    if (target) openEdit(target);
  }, [searchParams, students, loading]);

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
      await refetch();
      setSubmitting(false);
      setShowModal(false);
      const base = editingId ? '저장되었습니다.' : '등록되었습니다.';
      showToast(
        linkResult.warnings.length > 0 ? `${base} ${linkResult.warnings.join(' ')}` : base
      );
      return;
    }

    setSubmitting(false);
    setShowModal(false);
    showToast(editingId ? '수정되었습니다.' : '등록되었습니다.');
    await refetch();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`${name} 학생을 삭제할까요? 관련 기록도 삭제됩니다.`)) return;
    const { error: err } = await deleteStudent(id);
    showToast(err ? err : '삭제되었습니다.');
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-20 right-8 z-50 max-w-md rounded-xl px-5 py-3 text-sm font-semibold text-white bg-emerald-600 shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Students</h1>
          <p className="text-sm text-slate-500 mt-1">반 관리 · 학생별 보기 · 학부모/학생 연결</p>
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

      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowClasses((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer"
        >
          <span>반 이름 추가·수정</span>
          <i className={showClasses ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}></i>
        </button>
        {showClasses && (
          <div className="px-5 pb-5 border-t border-slate-100">
            <ClassesSection />
          </div>
        )}
      </div>

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
              {c.name} ({c.grade})
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
        <div className="flex rounded-xl border border-slate-200 overflow-hidden text-sm">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 cursor-pointer ${viewMode === 'list' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600'}`}
          >
            목록
          </button>
          <button
            type="button"
            onClick={() => setViewMode('by-student')}
            className={`px-4 py-2 cursor-pointer ${viewMode === 'by-student' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600'}`}
          >
            학생별 보기
          </button>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden bg-white border border-slate-200">
        {viewMode === 'by-student' ? (
          loading ? (
            <TableSkeleton />
          ) : (
            <StudentsByStudentView
              students={filtered}
              selectedId={selectedStudentId}
              onSelect={setSelectedStudentId}
            />
          )
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-500 uppercase">
                <th className="px-6 py-4">학생</th>
                <th className="px-6 py-4">학년</th>
                <th className="px-6 py-4">반</th>
                <th className="px-6 py-4">연결</th>
                <th className="px-6 py-4">상태</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <TableSkeleton />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      title="학생이 없습니다"
                      description="반을 추가한 뒤 학생을 등록해 보세요."
                    />
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
                    <td className="px-6 py-4 text-xs text-slate-500">
                      <span className={isParentLinked(student) ? 'text-emerald-600' : ''}>
                        부모 {isParentLinked(student) ? '✓' : studentParentEmail(student) ? '…' : '—'}
                      </span>
                      <span className="mx-1">·</span>
                      <span className={isStudentPortalLinked(student) ? 'text-emerald-600' : ''}>
                        학생 {isStudentPortalLinked(student) ? '✓' : studentPortalEmail(student) ? '…' : '—'}
                      </span>
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
                        <button
                          type="button"
                          className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer"
                        >
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
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl p-6 border border-slate-200 shadow-xl space-y-4">
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
            {classes.length === 0 && (
              <p className="text-xs text-amber-600">위 「반 이름 추가」에서 반을 먼저 만드세요.</p>
            )}
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
              <p className="text-xs font-semibold text-slate-600">학부모·학생 포털 (가입 이메일)</p>
              <input
                type="email"
                placeholder="학부모 이메일"
                value={form.parent_email}
                onChange={(e) => setForm({ ...form, parent_email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
              />
              <input
                type="email"
                placeholder="학생 계정 이메일"
                value={form.student_email}
                onChange={(e) => setForm({ ...form, student_email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
              />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                이메일은 학생 정보에 저장됩니다. 해당 역할로 회원가입한 계정이 있으면 자동 연결되며,
                없으면 가입 후 같은 이메일로 다시 저장하세요.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm border rounded-xl cursor-pointer"
              >
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

export default function StudentsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <StudentsPageContent />
    </Suspense>
  );
}
