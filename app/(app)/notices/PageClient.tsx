'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useClasses } from '@/hooks/useLessonLogs';
import { useStudents } from '@/hooks/useStudents';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageLoader, ErrorBanner, EmptyState } from '@/components/ui/DataStates';
import { STAFF_PAGES } from '@/lib/staffPages';
import { cn } from '@/lib/cn';
import type { Announcement, AnnouncementTargetType } from '@/types/database';

function resetForm(setters: {
  setTitle: (v: string) => void;
  setBody: (v: string) => void;
  setTargetType: (v: AnnouncementTargetType) => void;
  setClassId: (v: string) => void;
  setStudentId: (v: string) => void;
  setEditingId: (v: string | null) => void;
}) {
  setters.setTitle('');
  setters.setBody('');
  setters.setTargetType('all');
  setters.setClassId('');
  setters.setStudentId('');
  setters.setEditingId(null);
}

export default function NoticesPage() {
  const embedded = usePathname()?.includes('/parent-hub');
  const { classes } = useClasses();
  const { students } = useStudents();
  const {
    items,
    loading,
    error,
    createAnnouncement,
    publishAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
  } = useAnnouncements();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetType, setTargetType] = useState<AnnouncementTargetType>('all');
  const [classId, setClassId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [toastError, setToastError] = useState(false);

  const showToast = (message: string, isError = false) => {
    setToast(message);
    setToastError(isError);
    setTimeout(() => {
      setToast('');
      setToastError(false);
    }, 2500);
  };

  const formSetters = {
    setTitle,
    setBody,
    setTargetType,
    setClassId,
    setStudentId,
    setEditingId,
  };

  const startEdit = (a: Announcement) => {
    setEditingId(a.id);
    setTitle(a.title);
    setBody(a.body);
    setTargetType(a.target_type);
    setClassId(a.class_id ?? '');
    setStudentId(a.student_id ?? '');
  };

  const handleSave = async (publish: boolean) => {
    if (!title.trim() || !body.trim()) return;
    if (targetType === 'class' && !classId) {
      showToast('반을 선택해 주세요.', true);
      return;
    }
    if (targetType === 'student' && !studentId) {
      showToast('학생을 선택해 주세요.', true);
      return;
    }

    setSaving(true);
    const input = {
      title,
      body,
      target_type: targetType,
      class_id: classId || undefined,
      student_id: studentId || undefined,
      publish,
    };

    const result = editingId
      ? await updateAnnouncement(editingId, input)
      : await createAnnouncement(input);

    setSaving(false);
    if (result.error) {
      showToast(result.error, true);
      return;
    }

    resetForm(formSetters);
    showToast(
      editingId
        ? publish
          ? '공지가 수정·발행되었습니다.'
          : '공지가 수정되었습니다.'
        : publish
          ? '공지가 발행되었습니다.'
          : '임시 저장되었습니다.'
    );
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('이 공지를 삭제할까요? 삭제 후에는 복구할 수 없습니다.')) return;
    setSaving(true);
    const result = await deleteAnnouncement(id);
    setSaving(false);
    if (result.error) {
      showToast(result.error, true);
      return;
    }
    if (editingId === id) resetForm(formSetters);
    showToast('공지가 삭제되었습니다.');
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      {!embedded && <PageHeader title={STAFF_PAGES.notices.title} />}
      {error && <ErrorBanner message={error} />}
      {toast && (
        <p className={cn('text-sm rounded-xl px-3 py-2', toastError ? 'app-inline-danger' : 'app-inline-success')}>
          {toast}
        </p>
      )}

      <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="app-card p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold" style={{ color: 'var(--app-ink)' }}>
              {editingId ? '공지 수정' : '공지 작성'}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={() => resetForm(formSetters)}
                className="text-xs font-semibold cursor-pointer hover:opacity-70"
                style={{ color: 'var(--app-ink-3)' }}
              >
                새로 작성
              </button>
            )}
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목"
            className="w-full rounded-xl px-3 py-2 text-sm"
            style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface)', color: 'var(--app-ink)' }}
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="내용"
            rows={5}
            className="w-full rounded-xl px-3 py-2 text-sm resize-y min-h-[120px]"
            style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface)', color: 'var(--app-ink)' }}
          />
          <select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value as AnnouncementTargetType)}
            className="w-full rounded-xl px-3 py-2 text-sm"
            style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface)', color: 'var(--app-ink)' }}
          >
            <option value="all">전체 (학부모·학생)</option>
            <option value="class">반별</option>
            <option value="student">특정 학생 학부모</option>
          </select>
          {targetType === 'class' && (
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
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
          )}
          {targetType === 'student' && (
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm"
              style={{ border: '1px solid var(--app-border)', background: 'var(--app-surface)', color: 'var(--app-ink)' }}
            >
              <option value="">학생 선택</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.grade})
                </option>
              ))}
            </select>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave(false)}
              className="flex-1 min-w-[120px] app-btn app-btn-ghost disabled:opacity-50"
            >
              {editingId ? '수정 저장' : '임시 저장'}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave(true)}
              className="flex-1 min-w-[120px] app-btn app-btn-primary disabled:opacity-50"
            >
              {editingId ? '수정 후 발행' : '발행'}
            </button>
          </div>
        </div>

        <div className="app-card overflow-hidden flex flex-col min-h-[320px]">
          <div className="px-4 py-3 font-bold text-sm shrink-0" style={{ borderBottom: '1px solid var(--app-border)', color: 'var(--app-ink)' }}>
            공지 목록
          </div>
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <EmptyState title="등록된 공지가 없습니다" description="왼쪽에서 공지를 작성해 주세요." />
            </div>
          ) : (
            <ul className="divide-y divide-[var(--app-border)] flex-1 overflow-y-auto max-h-[560px]">
              {items.map((a) => (
                <li
                  key={a.id}
                  className="px-4 py-3"
                  style={editingId === a.id ? { background: 'var(--app-accent-bg)' } : undefined}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm" style={{ color: 'var(--app-ink)' }}>{a.title}</p>
                      <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--app-ink-3)' }}>{a.body}</p>
                      <p className="text-[10px] mt-1" style={{ color: 'var(--app-ink-4)' }}>
                        {a.target_type === 'all'
                          ? '전체'
                          : a.target_type === 'class'
                            ? a.classes?.name ?? '반'
                            : a.students?.name ?? '학생'}
                        · {a.created_at.slice(0, 10)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full border',
                        a.status === 'published'
                          ? 'app-badge-success border-[var(--app-success-border)]'
                          : 'border-[var(--app-border)]'
                      )}
                      style={
                        a.status === 'published'
                          ? undefined
                          : { background: 'var(--app-surface-2)', color: 'var(--app-ink-3)' }
                      }
                    >
                      {a.status === 'published' ? '발행됨' : '임시'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => startEdit(a)}
                      className="text-xs font-semibold cursor-pointer hover:opacity-70"
                      style={{ color: 'var(--app-ink-2)' }}
                    >
                      수정
                    </button>
                    {a.status === 'draft' && (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={async () => {
                          const result = await publishAnnouncement(a.id);
                          if (result.error) showToast(result.error, true);
                          else showToast('발행되었습니다.');
                        }}
                        className="text-xs font-semibold hover:underline disabled:opacity-50 cursor-pointer"
                        style={{ color: 'var(--app-accent)' }}
                      >
                        발행
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleDelete(a.id)}
                      className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50 cursor-pointer"
                    >
                      삭제
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
