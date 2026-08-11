'use client';

import { useState } from 'react';
import { useClassSchedules, type ClassScheduleInsert } from '@/hooks/useClassSchedules';
import { useClasses } from '@/hooks/useClasses';
import { useAuth } from '@/context/AuthContext';
import { useStaffPermissions } from '@/lib/permissions';
import { DAY_LABELS, SCHEDULE_TYPE_LABELS, formatTimeRange } from '@/lib/scheduleLabels';
import type { ScheduleExceptionType, ScheduleType } from '@/types/database';
import { EXCEPTION_TYPE_LABELS } from '@/lib/scheduleLabels';
import { ErrorBanner } from '@/components/ui/DataStates';

const scheduleTypes: ScheduleType[] = ['regular', 'makeup', 'special', 'canceled'];

export function ClassSchedulesSection() {
  const { profile } = useAuth();
  const { can } = useStaffPermissions();
  const canManage = can('schedule.manage');
  const { classes } = useClasses();
  const { schedules, loading, error, addSchedule, deleteSchedule, addException, exceptions } =
    useClassSchedules();
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const [exForm, setExForm] = useState({
    class_id: '',
    exception_date: new Date().toISOString().slice(0, 10),
    exception_type: 'makeup' as ScheduleExceptionType,
    start_time: '19:00',
    end_time: '20:30',
    memo: '',
  });
  const [form, setForm] = useState<ClassScheduleInsert>({
    class_id: '',
    title: '정기수업',
    day_of_week: 1,
    start_time: '19:00',
    end_time: '20:30',
    schedule_type: 'regular',
    location: '',
    memo: '',
    is_recurring: true,
    is_visible_to_parent: true,
    teacher_id: profile?.id ?? null,
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleAdd = async () => {
    if (!canManage) {
      showToast('일정을 수정할 권한이 없습니다.');
      return;
    }
    if (!form.class_id) {
      showToast('반을 선택해 주세요.');
      return;
    }
    setBusy(true);
    const { error: err } = await addSchedule({
      ...form,
      location: form.location || null,
      memo: form.memo || null,
      teacher_id: profile?.id ?? null,
    });
    setBusy(false);
    showToast(err ?? '일정이 추가되었습니다.');
  };

  const handleDelete = async (id: string) => {
    if (!canManage) {
      showToast('일정을 삭제할 권한이 없습니다.');
      return;
    }
    if (!confirm('이 일정을 삭제할까요?')) return;
    setBusy(true);
    const { error: err } = await deleteSchedule(id);
    setBusy(false);
    showToast(err ?? '삭제되었습니다.');
  };

  return (
    <div className="rounded-2xl p-6 bg-white border border-slate-200 space-y-4">
      {toast && <p className="text-sm text-emerald-700">{toast}</p>}
      {error && <ErrorBanner message={error} />}

      <div>
        <h3 className="text-sm font-bold text-slate-900">반별 수업 일정</h3>
        <p className="text-xs text-slate-500 mt-1">
          {canManage
            ? '매주 반복되는 정기수업·보강·특강·휴강을 등록합니다. 시간표와 학부모 포털에 반영됩니다.'
            : '담당 반 일정을 조회합니다. 생성·수정·삭제는 원장·원무에게 요청해 주세요.'}
        </p>
      </div>

      {canManage && (
        <>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <select
              value={form.class_id}
              onChange={(e) => setForm((f) => ({ ...f, class_id: e.target.value }))}
              className="px-3 py-2 border rounded-xl"
            >
              <option value="">반 선택</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.grade})
                </option>
              ))}
            </select>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="수업 제목"
              className="px-3 py-2 border rounded-xl"
            />
            <select
              value={form.day_of_week}
              onChange={(e) => setForm((f) => ({ ...f, day_of_week: Number(e.target.value) }))}
              className="px-3 py-2 border rounded-xl"
            >
              {DAY_LABELS.map((d, i) => (
                <option key={i} value={i}>
                  매주 {d}요일
                </option>
              ))}
            </select>
            <select
              value={form.schedule_type}
              onChange={(e) =>
                setForm((f) => ({ ...f, schedule_type: e.target.value as ScheduleType }))
              }
              className="px-3 py-2 border rounded-xl"
            >
              {scheduleTypes.map((t) => (
                <option key={t} value={t}>
                  {SCHEDULE_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <input
              type="time"
              value={form.start_time}
              onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
              className="px-3 py-2 border rounded-xl"
            />
            <input
              type="time"
              value={form.end_time}
              onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
              className="px-3 py-2 border rounded-xl"
            />
            <input
              value={form.location ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="강의실·장소"
              className="px-3 py-2 border rounded-xl sm:col-span-2"
            />
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={form.is_visible_to_parent}
                onChange={(e) =>
                  setForm((f) => ({ ...f, is_visible_to_parent: e.target.checked }))
                }
              />
              학부모·학생에게 공개
            </label>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={busy}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm disabled:opacity-50 cursor-pointer"
          >
            일정 추가
          </button>
        </>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">불러오는 중…</p>
      ) : schedules.length === 0 ? (
        <p className="text-sm text-slate-500">등록된 일정이 없습니다.</p>
      ) : (
        <ul className="divide-y border rounded-xl text-sm">
          {schedules.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-2 px-4 py-3">
              <span className="font-medium">
                {(s.classes as { name?: string })?.name ?? '반'} · 매주 {DAY_LABELS[s.day_of_week]}
              </span>
              <span className="text-slate-500">
                {formatTimeRange(s.start_time, s.end_time)} · {SCHEDULE_TYPE_LABELS[s.schedule_type]}
              </span>
              <span className="flex-1" />
              {canManage && (
                <button
                  type="button"
                  onClick={() => handleDelete(s.id)}
                  className="text-xs text-red-600 cursor-pointer"
                >
                  삭제
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canManage && (
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-700 mb-2">날짜별 변경 (보강·휴강·특강)</h4>
          <div className="grid sm:grid-cols-2 gap-2 text-sm mb-2">
            <select
              value={exForm.class_id}
              onChange={(e) => setExForm((f) => ({ ...f, class_id: e.target.value }))}
              className="px-3 py-2 border rounded-xl"
            >
              <option value="">반 선택</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={exForm.exception_date}
              onChange={(e) => setExForm((f) => ({ ...f, exception_date: e.target.value }))}
              className="px-3 py-2 border rounded-xl"
            />
            <select
              value={exForm.exception_type}
              onChange={(e) =>
                setExForm((f) => ({
                  ...f,
                  exception_type: e.target.value as ScheduleExceptionType,
                }))
              }
              className="px-3 py-2 border rounded-xl"
            >
              {(['makeup', 'canceled', 'time_changed', 'special'] as const).map((t) => (
                <option key={t} value={t}>
                  {EXCEPTION_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <input
              type="time"
              value={exForm.start_time}
              onChange={(e) => setExForm((f) => ({ ...f, start_time: e.target.value }))}
              className="px-3 py-2 border rounded-xl"
            />
          </div>
          <button
            type="button"
            disabled={busy || !exForm.class_id}
            onClick={async () => {
              setBusy(true);
              const { error: err } = await addException({
                class_schedule_id: null,
                class_id: exForm.class_id,
                exception_date: exForm.exception_date,
                exception_type: exForm.exception_type,
                start_time: exForm.start_time,
                end_time: exForm.end_time,
                memo: exForm.memo || null,
                is_visible_to_parent: true,
              });
              setBusy(false);
              showToast(err ?? '예외 일정이 추가되었습니다.');
            }}
            className="px-4 py-2 rounded-xl border text-sm cursor-pointer"
          >
            예외 일정 추가
          </button>
          {exceptions.length > 0 && (
            <ul className="mt-3 text-xs text-slate-500 space-y-1">
              {exceptions.slice(0, 5).map((e) => (
                <li key={e.id}>
                  {e.exception_date} · {EXCEPTION_TYPE_LABELS[e.exception_type]}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
