'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { StudentsDataTable } from '@/components/students/StudentsDataTable';
import type { LessonLog, ConsultationFollowup } from '@/types/database';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';
import { useStudents } from '@/hooks/useStudents';
import { useClasses } from '@/hooks/useClasses';
import {
  fetchStudentGuardianInputs,
  linkRegisteredParentByPhone,
  linkRegisteredStudentByPhone,
  registerStudentWithGuardians,
  syncStudentGuardians,
  type GuardianInput,
} from '@/lib/studentRegistration';
import { GuardianFields } from '@/components/students/GuardianFields';
import { isParentLinked, isStudentPortalLinked } from '@/lib/studentPortal';
import type { ConnectionRelationship } from '@/types/database';
import { formatPhoneDisplay } from '@/lib/phone';
import { AcademyConnectionCodeSection } from '@/components/settings/AcademyConnectionCodeSection';
import { StudentsByStudentView } from '@/components/students/StudentsByStudentView';
import { STATUS_LABELS } from '@/lib/statusLabels';
import { ErrorBanner, TableSkeleton, EmptyState, PageLoader } from '@/components/ui/DataStates';
import { PageHeader } from '@/components/ui/PageHeader';
import { STUDENT_GRADE_OPTIONS } from '@/lib/gradeOptions';
import { BULK_STUDENT_PLACEHOLDER, parseBulkStudentLines } from '@/lib/bulkStudentImport';
import type { Student, StudentStatus, EnrollmentStatus } from '@/types/database';

const ENROLLMENT_LABELS: Record<EnrollmentStatus, string> = {
  prospect: '상담·예비',
  active: '재원 중',
  on_leave: '휴원',
  withdrawn: '퇴원',
  graduated: '졸업',
};

const gradeOptions = ['전체', ...STUDENT_GRADE_OPTIONS];
const statusOptions: { label: string; value: string }[] = [
  { label: '전체 상태', value: '전체' },
  { label: STATUS_LABELS.stable,        value: 'stable' },
  { label: STATUS_LABELS.attention,     value: 'attention' },
  { label: STATUS_LABELS.consultation,  value: 'consultation' },
];

const PAGE_TABS = [
  { key: 'students', label: '학생',    href: '/students' },
  { key: 'parents',  label: '학부모',  href: '/students?tab=parents' },
] as const;

function StudentsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get('tab') || 'students';
  const { profile } = useAuth();
  const { students, loading, error, refetch, addStudent, bulkAddStudents, updateStudent, withdrawStudent, deleteStudent } =
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
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkClassId, setBulkClassId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadedParentIds, setLoadedParentIds] = useState<string[]>([]);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const [guardianPhonesByStudent, setGuardianPhonesByStudent] = useState<Map<string, string[]>>(
    new Map()
  );
  const [connectionsByStudent, setConnectionsByStudent] = useState<
    Map<string, { relationship: ConnectionRelationship }[]>
  >(new Map());

  useEffect(() => {
    if (!profile?.academy_id || students.length === 0) return;
    const studentIds = students.map((s) => s.id);
    void (async () => {
      const { data } = await supabase
        .from('student_connections')
        .select('student_id, relationship')
        .in('student_id', studentIds);
      const map = new Map<string, { relationship: ConnectionRelationship }[]>();
      for (const row of (data ?? []) as { student_id: string; relationship: ConnectionRelationship }[]) {
        const arr = map.get(row.student_id) ?? [];
        arr.push({ relationship: row.relationship });
        map.set(row.student_id, arr);
      }
      setConnectionsByStudent(map);
    })();
  }, [profile?.academy_id, students]);

  useEffect(() => {
    if (tab !== 'parents' || !profile?.academy_id || students.length === 0) return;
    const studentIds = students.map((s) => s.id);
    void (async () => {
      const { data } = await supabase
        .from('parent_student_links')
        .select('student_id, parents(phone)')
        .in('student_id', studentIds);
      const map = new Map<string, string[]>();
      for (const row of data ?? []) {
        const parent = Array.isArray(row.parents) ? row.parents[0] : row.parents;
        const phone = (parent as { phone?: string | null } | null)?.phone?.trim();
        if (!phone) continue;
        const arr = map.get(row.student_id as string) ?? [];
        if (!arr.includes(phone)) arr.push(phone);
        map.set(row.student_id, arr);
      }
      setGuardianPhonesByStudent(map);
    })();
  }, [tab, profile?.academy_id, students]);

  useEffect(() => {
    if (tab === 'classes') router.replace('/classes');
  }, [tab, router]);

  const [form, setForm] = useState({
    name: '',
    grade: '중1',
    class_id: '' as string,
    school: '',
    phone: '',
    status: 'stable' as StudentStatus,
    enrollment_status: 'active' as EnrollmentStatus,
    registered_at: '',
    withdrawn_at: '',
    withdrawal_reason: '',
    guardians: [{ name: '', relationship: 'mother' as GuardianInput['relationship'], phone: '' }],
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
    setLoadedParentIds([]);
    setForm({
      name: '',
      grade: '중1',
      class_id: classes[0]?.id ?? '',
      school: '',
      phone: '',
      status: 'stable',
      enrollment_status: 'active',
      registered_at: new Date().toISOString().slice(0, 10),
      withdrawn_at: '',
      withdrawal_reason: '',
      guardians: [{ name: '', relationship: 'mother', phone: '' }],
    });
    setShowModal(true);
  };

  const openEdit = async (s: Student) => {
    setEditingId(s.id);
    setShowModal(true);
    setLoadingEdit(true);
    setLoadedParentIds([]);
    try {
      const guardians = await fetchStudentGuardianInputs(s.id);
      setLoadedParentIds(guardians.map((g) => g.parentId).filter(Boolean) as string[]);
      setForm({
        name: s.name,
        grade: s.grade,
        class_id: s.class_id ?? '',
        school: s.school ?? '',
        phone: s.phone ?? '',
        status: s.status,
        enrollment_status: s.enrollment_status ?? 'active',
        registered_at: s.registered_at ?? '',
        withdrawn_at: s.withdrawn_at ?? '',
        withdrawal_reason: s.withdrawal_reason ?? '',
        guardians,
      });
    } finally {
      setLoadingEdit(false);
    }
  };

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId || loading) return;
    const target = students.find((s) => s.id === editId);
    if (target) void openEdit(target);
  }, [searchParams, students, loading]);

  const handleSubmit = async () => {
    if (!form.name || !profile?.academy_id) return;
    setSubmitting(true);

    if (editingId) {
      const { error: updateErr } = await updateStudent(editingId, {
        name: form.name,
        grade: form.grade,
        class_id: form.class_id || null,
        school: form.school,
        phone: form.phone || null,
        status: form.status,
        enrollment_status: form.enrollment_status,
        registered_at: form.registered_at || null,
        withdrawn_at: form.withdrawn_at || null,
        withdrawal_reason: form.withdrawal_reason.trim() || null,
      });
      if (updateErr) {
        setSubmitting(false);
        showToast(updateErr);
        return;
      }

      const { error: guardianErr } = await syncStudentGuardians(
        profile.academy_id,
        editingId,
        form.guardians.filter((g) => g.name.trim() && g.phone.trim()),
        loadedParentIds
      );
      if (guardianErr) {
        setSubmitting(false);
        showToast(guardianErr);
        return;
      }

      if (form.phone) await linkRegisteredStudentByPhone(profile.academy_id, editingId, form.phone);
      for (const g of form.guardians) {
        if (g.phone.trim()) {
          await linkRegisteredParentByPhone(profile.academy_id, editingId, g.phone);
        }
      }

      setSubmitting(false);
      setShowModal(false);
      showToast('저장되었습니다.');
      await refetch();
      return;
    }

    const { error, studentId } = await registerStudentWithGuardians(
      profile.academy_id,
      {
        name: form.name,
        grade: form.grade,
        class_id: form.class_id || null,
        school: form.school,
        phone: form.phone,
        status: form.status,
      },
      form.guardians.filter((g) => g.name.trim() && g.phone.trim())
    );

    if (error || !studentId) {
      setSubmitting(false);
      showToast(error ?? '등록 실패');
      return;
    }

    if (form.phone) await linkRegisteredStudentByPhone(profile.academy_id, studentId, form.phone);
    for (const g of form.guardians) {
      if (g.phone.trim()) {
        await linkRegisteredParentByPhone(profile.academy_id, studentId, g.phone);
      }
    }

    setSubmitting(false);
    setShowModal(false);
    showToast('등록되었습니다. 학생·학부모에게 초대 링크를 공유하세요.');
    await refetch();
  };

  const handleBulkSubmit = async () => {
    const { rows, errors } = parseBulkStudentLines(bulkText);
    if (rows.length === 0) {
      showToast(errors[0] ?? '등록할 학생을 입력해 주세요.');
      return;
    }
    setSubmitting(true);
    const { error: bulkErr, added } = await bulkAddStudents(
      rows.map((r) => ({
        ...r,
        class_id: bulkClassId || null,
      }))
    );
    setSubmitting(false);
    if (bulkErr) {
      showToast(bulkErr);
      return;
    }
    setShowBulkModal(false);
    setBulkText('');
    const warn = errors.length > 0 ? ` (${errors.length}건 참고)` : '';
    showToast(`${added}명 등록되었습니다.${warn}`);
    await refetch();
  };

  return (
    <div className="space-y-5 w-full min-w-0 max-w-full">
      {toast && <div className="toast-fixed bg-emerald-600">{toast}</div>}

      {/* Header */}
      <PageHeader title={tab === 'parents' ? '학부모 연결' : '학생'}>
        {tab === 'students' && (
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowBulkModal(true)} className="app-btn app-btn-ghost">
              <i className="ri-file-list-3-line" />
              일괄 등록
            </button>
            <button type="button" onClick={openCreate} className="app-btn app-btn-primary">
              <i className="ri-user-add-line" />
              학생 등록
            </button>
          </div>
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

      <AcademyConnectionCodeSection />

      {/* ── 학부모 탭 ── */}
      {tab === 'parents' && (
        <div className="space-y-4">
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
                    {(guardianPhonesByStudent.get(s.id) ?? [])
                      .map((p) => formatPhoneDisplay(p))
                      .join(' · ') || '보호자 연락처 없음'}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] font-semibold px-2.5 py-1 rounded-full',
                      isStudentPortalLinked(s, connectionsByStudent.get(s.id))
                        ? 'app-badge-info'
                        : 'app-badge-muted'
                    )}
                  >
                    학생 {isStudentPortalLinked(s, connectionsByStudent.get(s.id)) ? '연결됨' : '미연결'}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] font-semibold px-2.5 py-1 rounded-full ml-auto',
                      isParentLinked(s, connectionsByStudent.get(s.id)) ? 'app-badge-success' : 'app-badge-warning'
                    )}
                  >
                    학부모 {isParentLinked(s, connectionsByStudent.get(s.id)) ? '연결됨' : '미연결'}
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
                      ? { background: 'var(--app-ink)', color: 'var(--app-on-accent)' }
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
                  connectionsByStudent={connectionsByStudent}
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
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6 space-y-4"
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

            {loadingEdit ? (
              <p className="text-sm text-center py-8" style={{ color: 'var(--app-ink-3)' }}>
                불러오는 중…
              </p>
            ) : (
              <>
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
              <p className="text-xs app-text-warning">
                설정 → 반 관리에서 반을 먼저 만드세요.
              </p>
            )}

            <div>
              <label className="app-label mb-1">학교</label>
              <input
                placeholder="예: ○○중학교"
                value={form.school}
                onChange={(e) => setForm({ ...form, school: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{
                  background: 'var(--app-surface-2)',
                  border: '1px solid var(--app-border)',
                  color: 'var(--app-ink)',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label className="app-label mb-1">학생 휴대폰 (선택)</label>
              <input
                type="tel"
                placeholder="01012345678"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{
                  background: 'var(--app-surface-2)',
                  border: '1px solid var(--app-border)',
                  color: 'var(--app-ink)',
                  outline: 'none',
                }}
              />
            </div>

            <GuardianFields
              guardians={form.guardians}
              onChange={(guardians) => setForm({ ...form, guardians })}
              allowEmpty={!!editingId}
            />

            <div
              className="space-y-3 pt-3"
              style={{ borderTop: '1px solid var(--app-border)' }}
            >
              <p className="text-xs font-semibold" style={{ color: 'var(--app-ink-2)' }}>
                등록·상태
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="app-label mb-1">재원 상태</label>
                  <select
                    value={form.enrollment_status}
                    onChange={(e) =>
                      setForm({ ...form, enrollment_status: e.target.value as EnrollmentStatus })
                    }
                    className="w-full px-3 py-2 rounded-xl text-sm"
                    style={{
                      background: 'var(--app-surface-2)',
                      border: '1px solid var(--app-border)',
                      color: 'var(--app-ink)',
                    }}
                  >
                    {(Object.keys(ENROLLMENT_LABELS) as EnrollmentStatus[]).map((key) => (
                      <option key={key} value={key}>
                        {ENROLLMENT_LABELS[key]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="app-label mb-1">학습 상태</label>
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
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="app-label mb-1">등록일</label>
                  <input
                    type="date"
                    value={form.registered_at}
                    onChange={(e) => setForm({ ...form, registered_at: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-sm"
                    style={{
                      background: 'var(--app-surface-2)',
                      border: '1px solid var(--app-border)',
                      color: 'var(--app-ink)',
                    }}
                  />
                </div>
                {(form.enrollment_status === 'withdrawn' || form.enrollment_status === 'graduated') && (
                  <div>
                    <label className="app-label mb-1">퇴원·졸업일</label>
                    <input
                      type="date"
                      value={form.withdrawn_at}
                      onChange={(e) => setForm({ ...form, withdrawn_at: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-sm"
                      style={{
                        background: 'var(--app-surface-2)',
                        border: '1px solid var(--app-border)',
                        color: 'var(--app-ink)',
                      }}
                    />
                  </div>
                )}
              </div>
              {(form.enrollment_status === 'withdrawn' || form.enrollment_status === 'graduated') && (
                <div>
                  <label className="app-label mb-1">퇴원·졸업 사유</label>
                  <input
                    placeholder="선택 입력"
                    value={form.withdrawal_reason}
                    onChange={(e) => setForm({ ...form, withdrawal_reason: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-sm"
                    style={{
                      background: 'var(--app-surface-2)',
                      border: '1px solid var(--app-border)',
                      color: 'var(--app-ink)',
                      outline: 'none',
                    }}
                  />
                </div>
              )}
            </div>

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
                disabled={submitting || !form.name.trim() || loadingEdit}
                className="app-btn app-btn-primary disabled:opacity-50"
              >
                {submitting ? '저장 중...' : '저장'}
              </button>
            </div>
              </>
            )}
          </div>
        </div>
      )}

      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6 space-y-4"
            style={{
              background: 'var(--app-surface)',
              border: '1px solid var(--app-border)',
              boxShadow: 'var(--s-xl)',
            }}
          >
            <h2 className="text-base font-bold" style={{ color: 'var(--app-ink)' }}>
              학생 일괄 등록
            </h2>
            <p className="text-xs" style={{ color: 'var(--app-ink-3)' }}>
              한 줄에 한 명씩 <strong>이름, 학년, 학교</strong> 순으로 입력하세요. (쉼표 또는 탭 구분)
            </p>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={BULK_STUDENT_PLACEHOLDER}
              rows={8}
              className="w-full px-3 py-2.5 rounded-xl text-sm font-mono"
              style={{
                background: 'var(--app-surface-2)',
                border: '1px solid var(--app-border)',
                color: 'var(--app-ink)',
                outline: 'none',
              }}
            />
            <div>
              <label className="app-label mb-1">공통 반 (선택)</label>
              <select
                value={bulkClassId}
                onChange={(e) => setBulkClassId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{
                  background: 'var(--app-surface-2)',
                  border: '1px solid var(--app-border)',
                  color: 'var(--app-ink)',
                }}
              >
                <option value="">반 없음</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.grade})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--app-border)' }}>
              <button type="button" onClick={() => setShowBulkModal(false)} className="app-btn app-btn-secondary">
                취소
              </button>
              <button
                type="button"
                onClick={() => void handleBulkSubmit()}
                disabled={submitting || !bulkText.trim()}
                className="app-btn app-btn-primary disabled:opacity-50"
              >
                {submitting ? '등록 중…' : '일괄 등록'}
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
