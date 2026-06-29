'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { StudentsDataTable } from '@/components/students/StudentsDataTable';
import type { LessonLog, ConsultationFollowup } from '@/types/database';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/cn';
import { useStudents } from '@/hooks/useStudents';
import { useClasses } from '@/hooks/useClasses';
import { linkStudentPortals } from '@/lib/portalLink';
import {
  isParentLinked,
  studentParentEmail,
  studentPortalEmail,
} from '@/lib/studentPortal';
import { ClassesSection } from '@/components/settings/ClassesSection';
import { AcademyConnectionCodeSection } from '@/components/settings/AcademyConnectionCodeSection';
import { ConnectionRequestsSection } from '@/components/settings/ConnectionRequestsSection';
import { StudentsByStudentView } from '@/components/students/StudentsByStudentView';
import { STATUS_LABELS } from '@/lib/statusLabels';
import { ErrorBanner, TableSkeleton, EmptyState, PageLoader } from '@/components/ui/DataStates';
import { PageHeader } from '@/components/ui/PageHeader';
import type { Student, StudentStatus } from '@/types/database';

const gradeOptions = ['전체', '중1', '중2', '중3', '고1', '고2', '고3'];
const statusOptions: { label: string; value: string }[] = [
  { label: '전체 상태', value: '전체' },
  { label: STATUS_LABELS.stable,        value: 'stable' },
  { label: STATUS_LABELS.attention,     value: 'attention' },
  { label: STATUS_LABELS.consultation,  value: 'consultation' },
];

const PAGE_TABS = [
  { key: 'students', label: '학생',    href: '/students' },
  { key: 'classes',  label: '반',      href: '/students?tab=classes' },
  { key: 'parents',  label: '학부모',  href: '/students?tab=parents' },
] as const;

function StudentsPageContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'students';
  const { profile } = useAuth();
  const { students, loading, error, refetch, addStudent, updateStudent, withdrawStudent, deleteStudent } =
    useStudents();
  const [logsByStudent, setLogsByStudent] = useState<Map<string, LessonLog[]>>(new Map());
  const [followupsByStudent, setFollowupsByStudent] = useState<Map<string, ConsultationFollowup[]>>(
    new Map()
  );
  const [pendingCardsByStudent, setPendingCardsByStudent] = useState<Map<string, number>>(new Map());

  const loadBadgeData = useCallback(async () => {
    if (!profile?.academy_id) return;
    const studentIds = students.map((s) => s.id);
    const [logsRes, fuRes, cardsRes] = await Promise.all([
      supabase
        .from('lesson_logs')
        .select('*')
        .eq('academy_id', profile.academy_id)
        .order('lesson_date', { ascending: false })
        .limit(400),
      supabase
        .from('consultation_followups')
        .select('*')
        .eq('academy_id', profile.academy_id)
        .eq('status', 'pending'),
      studentIds.length > 0
        ? supabase
            .from('consultation_cards')
            .select('student_id, consultation_status')
            .in('student_id', studentIds)
            .eq('consultation_status', 'pending')
        : Promise.resolve({ data: [], error: null }),
    ]);
    const logMap = new Map<string, LessonLog[]>();
    for (const log of (logsRes.data ?? []) as LessonLog[]) {
      const arr = logMap.get(log.student_id) ?? [];
      arr.push(log);
      logMap.set(log.student_id, arr);
    }
    const fuMap = new Map<string, ConsultationFollowup[]>();
    for (const fu of (fuRes.data ?? []) as ConsultationFollowup[]) {
      const arr = fuMap.get(fu.student_id) ?? [];
      arr.push(fu);
      fuMap.set(fu.student_id, arr);
    }
    const pendingMap = new Map<string, number>();
    for (const row of (cardsRes.data ?? []) as { student_id: string }[]) {
      pendingMap.set(row.student_id, (pendingMap.get(row.student_id) ?? 0) + 1);
    }
    setLogsByStudent(logMap);
    setFollowupsByStudent(fuMap);
    setPendingCardsByStudent(pendingMap);
  }, [profile?.academy_id, students]);

  const { classes } = useClasses();
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '');

  useEffect(() => { void loadBadgeData(); }, [loadBadgeData, students.length]);
  useEffect(() => {
    const q = searchParams.get('q');
    if (q != null) setSearch(q);
  }, [searchParams]);

  const [grade, setGrade] = useState('전체');
  const [classFilter, setClassFilter] = useState('전체');
  const [status, setStatus] = useState('전체');
  const [enrollmentFilter, setEnrollmentFilter] = useState<'active' | 'withdrawn' | 'all'>('active');
  const [viewMode, setViewMode] = useState<'list' | 'by-student'>('list');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showExtra, setShowExtra] = useState(false);
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

  const activeCount     = students.filter((s) => s.enrollment_status !== 'withdrawn' && s.enrollment_status !== 'graduated').length;
  const withdrawnCount  = students.filter((s) => s.enrollment_status === 'withdrawn' || s.enrollment_status === 'graduated').length;

  const filtered = useMemo(
    () =>
      students.filter((s) => {
        if (search && !s.name.includes(search)) return false;
        if (grade !== '전체' && s.grade !== grade) return false;
        if (classFilter !== '전체' && s.class_id !== classFilter) return false;
        if (status !== '전체' && s.status !== status) return false;
        if (enrollmentFilter === 'active') {
          if (s.enrollment_status === 'withdrawn' || s.enrollment_status === 'graduated') return false;
        } else if (enrollmentFilter === 'withdrawn') {
          if (s.enrollment_status !== 'withdrawn' && s.enrollment_status !== 'graduated') return false;
        }
        return true;
      }),
    [students, search, grade, classFilter, status, enrollmentFilter]
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
    setShowExtra(false);
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
    setShowExtra(true);
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
    let studentId = editingId ?? '';
    if (editingId) {
      const { error: updateErr } = await updateStudent(editingId, payload);
      if (updateErr) { setSubmitting(false); showToast(updateErr); return; }
    } else {
      const { error: addErr, id } = await addStudent(payload);
      if (addErr) { setSubmitting(false); showToast(addErr); return; }
      studentId = id ?? '';
    }
    if (studentId) {
      const link = await linkStudentPortals(studentId, {
        parentEmail: form.parent_email,
        studentEmail: form.student_email,
      });
      if (link.error) {
        setSubmitting(false);
        showToast(`저장됐으나 연결 실패: ${link.error}`);
        await refetch();
        return;
      }
    }
    setSubmitting(false);
    setShowModal(false);
    showToast(
      editingId
        ? '저장되었습니다.'
        : '등록되었습니다. 학부모·학생 이메일을 입력하면 가입 계정과 자동 연결됩니다.'
    );
    await refetch();
  };

  return (
    <div className="space-y-5 w-full min-w-0 max-w-full">
      {toast && <div className="toast-fixed bg-emerald-600">{toast}</div>}

      {/* Header */}
      <PageHeader title={tab === 'classes' ? '반' : tab === 'parents' ? '학부모' : '학생'}>
        {tab === 'students' && (
          <button type="button" onClick={openCreate} className="app-btn app-btn-primary">
            <i className="ri-user-add-line" />
            학생 등록
          </button>
        )}
      </PageHeader>

      {/* Page tabs */}
      <div
        className="flex gap-0 border-b"
        style={{ borderColor: 'var(--app-border)' }}
      >
        {PAGE_TABS.map(({ key, label, href }) => (
          <Link
            key={key}
            href={href}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
              tab === key
                ? 'border-[var(--app-accent)] text-[var(--app-accent-text)]'
                : 'border-transparent hover:border-[var(--app-border-strong)]'
            )}
            style={{ color: tab === key ? 'var(--app-accent-text)' : 'var(--app-ink-3)' }}
          >
            {label}
          </Link>
        ))}
      </div>

      {error && <ErrorBanner message={error} onRetry={refetch} />}

      {/* ── 반 탭 ── */}
      {tab === 'classes' && (
        <div className="app-card p-5">
          <ClassesSection />
        </div>
      )}

      {/* ── 학부모 탭 ── */}
      {tab === 'parents' && (
        <div className="space-y-4">
          <AcademyConnectionCodeSection />
          <ConnectionRequestsSection />
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'var(--app-surface)',
              border: '1px solid var(--app-border)',
              boxShadow: 'var(--s-sm)',
            }}
          >
            <div
              className="px-5 py-3.5 flex items-center justify-between"
              style={{ borderBottom: '1px solid var(--app-border)' }}
            >
              <h2 className="text-sm font-semibold" style={{ color: 'var(--app-ink)' }}>
                학부모 연결 현황
              </h2>
              <Link
                href="/messages"
                className="text-xs font-medium hover:opacity-70 transition-opacity"
                style={{ color: 'var(--app-accent)' }}
              >
                문의함 →
              </Link>
            </div>
            <ul>
              {students.map((s) => (
                <li
                  key={s.id}
                  className="px-5 py-3 flex flex-wrap items-center gap-3"
                  style={{ borderBottom: '1px solid var(--app-border)' }}
                >
                  <Link
                    href={`/students/${s.id}`}
                    className="text-sm font-semibold hover:underline"
                    style={{ color: 'var(--app-ink)' }}
                  >
                    {s.name}
                  </Link>
                  <span className="text-xs" style={{ color: 'var(--app-ink-3)' }}>
                    {studentParentEmail(s) || '이메일 없음'}
                  </span>
                  <span
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-full ml-auto"
                    style={
                      isParentLinked(s)
                        ? { background: '#f0fdf4', color: '#059669' }
                        : { background: '#fffbeb', color: '#92400e' }
                    }
                  >
                    {isParentLinked(s) ? '연결됨' : '미연결'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ── 학생 탭 ── */}
      {tab === 'students' && (
        <>
          {/* 재원 상태 필터 */}
          <div
            className="flex items-center gap-1 p-1 rounded-xl w-fit"
            style={{ background: 'var(--app-surface-2)', border: '1px solid var(--app-border)' }}
          >
            {([
              ['active',    '재원 중',    activeCount],
              ['withdrawn', '퇴원·졸업',  withdrawnCount],
              ['all',       '전체',       students.length],
            ] as const).map(([key, label, count]) => (
              <button
                key={key}
                type="button"
                onClick={() => setEnrollmentFilter(key)}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all flex items-center gap-1.5',
                  enrollmentFilter === key
                    ? 'shadow-sm text-[var(--app-ink)] bg-[var(--app-surface)]'
                    : 'text-[var(--app-ink-3)] hover:text-[var(--app-ink)]'
                )}
                style={
                  enrollmentFilter === key
                    ? { color: 'var(--app-ink)', boxShadow: 'var(--s-xs)' }
                    : { color: 'var(--app-ink-3)' }
                }
              >
                {label}
                <span
                  className="tabular-nums text-[10px] font-bold px-1.5 py-0.5 rounded-md min-w-[20px] text-center"
                  style={
                    enrollmentFilter === key
                      ? { background: 'var(--app-accent-bg)', color: 'var(--app-accent-text)' }
                      : { background: 'var(--app-border)', color: 'var(--app-ink-4)' }
                  }
                >
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* Filter + View toggle bar */}
          <div
            className="rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3"
            style={{
              background: 'var(--app-surface)',
              border: '1px solid var(--app-border)',
              boxShadow: 'var(--s-xs)',
            }}
          >
            {/* Search */}
            <div className="relative flex-1 min-w-[160px]">
              <i
                className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                style={{ color: 'var(--app-ink-4)' }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="이름 검색"
                className="w-full pl-8 pr-3 py-2 rounded-xl text-sm"
                style={{
                  background: 'var(--app-surface-2)',
                  border: '1px solid var(--app-border)',
                  color: 'var(--app-ink)',
                  outline: 'none',
                }}
              />
            </div>

            {/* Dropdowns */}
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm"
              style={{
                background: 'var(--app-surface-2)',
                border: '1px solid var(--app-border)',
                color: 'var(--app-ink)',
              }}
            >
              {gradeOptions.map((g) => (
                <option key={g} value={g}>{g === '전체' ? '전체 학년' : g}</option>
              ))}
            </select>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm"
              style={{
                background: 'var(--app-surface-2)',
                border: '1px solid var(--app-border)',
                color: 'var(--app-ink)',
              }}
            >
              <option value="전체">전체 반</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.grade})</option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm"
              style={{
                background: 'var(--app-surface-2)',
                border: '1px solid var(--app-border)',
                color: 'var(--app-ink)',
              }}
            >
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            {/* View toggle */}
            <div
              className="flex rounded-xl overflow-hidden shrink-0 ml-auto"
              style={{ border: '1px solid var(--app-border)' }}
            >
              {(['list', 'by-student'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className="px-3.5 py-2 text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5"
                  style={
                    viewMode === mode
                      ? { background: 'var(--app-ink)', color: '#fff' }
                      : { background: 'var(--app-surface)', color: 'var(--app-ink-3)' }
                  }
                >
                  <i className={mode === 'list' ? 'ri-list-unordered' : 'ri-user-3-line'} />
                  {mode === 'list' ? '목록' : '학생별'}
                </button>
              ))}
            </div>

            {/* Result count */}
            <span className="text-xs shrink-0" style={{ color: 'var(--app-ink-3)' }}>
              {filtered.length}명
            </span>
          </div>

          {/* Table */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'var(--app-surface)',
              border: '1px solid var(--app-border)',
              boxShadow: 'var(--s-sm)',
            }}
          >
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
              <StudentsDataTable
                students={filtered}
                logsByStudent={logsByStudent}
                followupsByStudent={followupsByStudent}
                pendingCardsByStudent={pendingCardsByStudent}
                loading={loading}
                gradeFilter={grade}
                classFilter={classFilter}
                onWithdraw={async (id, name) => {
                  if (!confirm(`${name} 학생을 퇴원 처리할까요?\n수업 기록은 유지됩니다.`)) return;
                  const { error: err } = await withdrawStudent(id);
                  showToast(err ? err : `${name} 학생이 퇴원 처리되었습니다.`);
                }}
                onEdit={openEdit}
              />
            )}
          </div>
        </>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div
            className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-6 space-y-4"
            style={{
              background: 'var(--app-surface)',
              border: '1px solid var(--app-border)',
              boxShadow: 'var(--s-xl)',
            }}
          >
            <h2
              className="text-base font-bold"
              style={{ color: 'var(--app-ink)', letterSpacing: '-0.02em' }}
            >
              {editingId ? '학생 수정' : '학생 등록'}
            </h2>

            <div>
              <label className="app-label mb-1">이름 *</label>
              <input
                placeholder="이름을 입력하세요"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{
                  background: 'var(--app-surface-2)',
                  border: '1px solid var(--app-border)',
                  color: 'var(--app-ink)',
                  outline: 'none',
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="app-label mb-1">학년</label>
                <select
                  value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{
                    background: 'var(--app-surface-2)',
                    border: '1px solid var(--app-border)',
                    color: 'var(--app-ink)',
                  }}
                >
                  {gradeOptions.filter((g) => g !== '전체').map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="app-label mb-1">반</label>
                <select
                  value={form.class_id}
                  onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{
                    background: 'var(--app-surface-2)',
                    border: '1px solid var(--app-border)',
                    color: 'var(--app-ink)',
                  }}
                >
                  <option value="">반 없음</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {classes.length === 0 && (
              <p className="text-xs" style={{ color: '#d97706' }}>
                설정 → 반 관리에서 반을 먼저 만드세요.
              </p>
            )}

            <button
              type="button"
              onClick={() => setShowExtra((v) => !v)}
              className="flex items-center gap-1.5 text-xs cursor-pointer hover:opacity-70 transition-opacity"
              style={{ color: 'var(--app-ink-3)' }}
            >
              <i className={`ri-arrow-${showExtra ? 'up' : 'down'}-s-line`} />
              추가 정보 {showExtra ? '접기' : '펼치기'}
            </button>

            {showExtra && (
              <div
                className="space-y-3 pt-3"
                style={{ borderTop: '1px solid var(--app-border)' }}
              >
                {[
                  { label: '학교', key: 'school' as const, placeholder: '예: ○○중학교', type: 'text' },
                  { label: '학부모 이메일', key: 'parent_email' as const, placeholder: 'parent@example.com', type: 'email' },
                  { label: '학생 이메일', key: 'student_email' as const, placeholder: 'student@example.com', type: 'email' },
                ].map(({ label, key, placeholder, type }) => (
                  <div key={key}>
                    <label className="app-label mb-1">{label}</label>
                    <input
                      type={type}
                      placeholder={placeholder}
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-sm"
                      style={{
                        background: 'var(--app-surface-2)',
                        border: '1px solid var(--app-border)',
                        color: 'var(--app-ink)',
                        outline: 'none',
                      }}
                    />
                  </div>
                ))}

                <div>
                  <label className="app-label mb-1">등록 상태</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as StudentStatus })}
                    className="w-full px-3 py-2 rounded-xl text-sm"
                    style={{
                      background: 'var(--app-surface-2)',
                      border: '1px solid var(--app-border)',
                      color: 'var(--app-ink)',
                    }}
                  >
                    {(['stable', 'attention', 'consultation'] as StudentStatus[]).map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>

                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--app-ink-4)' }}>
                  가입된 계정이 있으면 저장 시 자동 연결됩니다.
                </p>
              </div>
            )}

            <div
              className="flex justify-end gap-2 pt-2"
              style={{ borderTop: '1px solid var(--app-border)' }}
            >
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="app-btn app-btn-secondary"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !form.name.trim()}
                className="app-btn app-btn-primary disabled:opacity-50"
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
