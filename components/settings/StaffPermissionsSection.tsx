'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { ErrorBanner } from '@/components/ui/DataStates';
import { computePermissions, DEFAULT_PERMISSIONS, type PermissionKey } from '@/lib/permissionKeys';
import { setStaffPermissionOverride, updateStaffMemberRole } from '@/lib/staffPermissions';
import { toDbRole } from '@/lib/roles';
import { cn } from '@/lib/cn';

type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type Override = { permission_key: string; granted: boolean };

const ROLE_OPTIONS = [
  { value: 'admin', label: '부원장/관리자' },
  { value: 'teacher', label: '강사' },
  { value: 'desk', label: '원무' },
] as const;

const ROLE_LABELS: Record<string, string> = {
  admin: '부원장',
  teacher: '강사',
  desk: '원무',
  owner: '원장',
};

// owner가 설정 화면에서 조절할 수 있는 권한 항목
const EDITABLE_PERMISSIONS: { key: PermissionKey; label: string; roles: string[] }[] = [
  { key: 'scope.all_students', label: '전체 학생 조회 (담당 반 외)', roles: ['teacher'] },
  { key: 'students.withdraw', label: '퇴원 처리', roles: ['desk'] },
  { key: 'counseling.view', label: '상담 조회', roles: ['desk'] },
  { key: 'counseling.manage', label: '상담 카드 작성', roles: ['desk'] },
  { key: 'settings.academy', label: '학원 정보 수정', roles: ['admin'] },
  { key: 'analytics.view', label: '분석 리포트 조회', roles: ['admin', 'teacher', 'desk'] },
  { key: 'billing.view', label: '수강료 조회', roles: ['teacher'] },
  { key: 'schedule.manage', label: '시간표 생성·수정·삭제', roles: ['teacher', 'desk'] },
];

function PermissionSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-0 p-0.5 transition-colors duration-200',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600',
        checked ? 'bg-blue-600' : 'bg-slate-300'
      )}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  );
}

function StaffRow({
  member,
  onRoleChange,
}: {
  member: StaffMember;
  onRoleChange: () => void;
}) {
  const { academy } = useAuth();
  const [role, setRole] = useState(member.role);
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [rowError, setRowError] = useState('');

  useEffect(() => {
    setRole(member.role);
  }, [member.role]);

  const showToast = (msg: string, isError = false) => {
    setToast(msg);
    if (isError) setRowError(msg);
    setTimeout(() => setToast(''), isError ? 4000 : 2000);
  };

  const loadOverrides = useCallback(async () => {
    if (!academy?.id) return;
    const { data } = await supabase
      .from('staff_permission_overrides')
      .select('permission_key, granted')
      .eq('user_id', member.id)
      .eq('academy_id', academy.id);
    setOverrides((data ?? []) as Override[]);
  }, [member.id, academy?.id]);

  useEffect(() => {
    if (expanded) void loadOverrides();
  }, [expanded, loadOverrides]);

  const effective = computePermissions(role, overrides);

  const handleRoleSave = async () => {
    setSaving(true);
    setRowError('');
    const dbRole = toDbRole(role);
    const { error } = await updateStaffMemberRole(member.id, dbRole);
    setSaving(false);
    if (error) {
      showToast(error, true);
      return;
    }
    showToast('역할이 변경되었습니다.');
    onRoleChange();
  };

  const togglePermission = async (key: PermissionKey) => {
    if (!academy?.id) return;
    setRowError('');
    const base = new Set<PermissionKey>(
      DEFAULT_PERMISSIONS[role === 'owner' ? 'owner' : role] ?? []
    );
    const currentlyGranted = effective.has(key);
    const baseGranted = base.has(key);
    const newGranted = !currentlyGranted;

    const { error } = await setStaffPermissionOverride(
      member.id,
      key,
      newGranted === baseGranted ? null : newGranted
    );
    if (error) {
      showToast(error, true);
      return;
    }
    showToast('권한이 저장되었습니다.');
    await loadOverrides();
  };

  const editableForRole = EDITABLE_PERMISSIONS.filter((p) => p.roles.includes(role));

  return (
    <li className="border border-slate-100 rounded-xl overflow-hidden">
      {/* 헤더 */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-white">
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
          {member.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{member.name}</p>
          <p className="text-xs text-slate-400 truncate">{member.email}</p>
        </div>
        {member.role !== 'admin' || role !== 'admin' ? (
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="px-2 py-1.5 border rounded-lg text-xs"
          >
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ) : (
          <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-medium">
            {ROLE_LABELS[member.role] ?? member.role}
          </span>
        )}
        {role !== member.role && (
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleRoleSave()}
            className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white disabled:opacity-50 cursor-pointer"
          >
            역할 저장
          </button>
        )}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
        >
          <i className={cn('text-xs', expanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line')} />
          {' '}권한 상세
        </button>
      </div>

      {toast && (
        <p
          className={cn(
            'text-xs px-4 py-2',
            rowError && toast === rowError
              ? 'text-red-700 bg-red-50'
              : 'text-emerald-700 bg-emerald-50'
          )}
        >
          {toast}
        </p>
      )}

      {/* 권한 상세 */}
      {expanded && (
        <div className="bg-slate-50 border-t border-slate-100 px-4 py-3 space-y-2">
          {editableForRole.length === 0 ? (
            <p className="text-xs text-slate-400">이 역할에 조정 가능한 권한이 없습니다.</p>
          ) : (
            editableForRole.map((p) => {
              const granted = effective.has(p.key);
              const isCustom = overrides.some((o) => o.permission_key === p.key);
              return (
                <div key={p.key} className="flex items-center gap-3 py-1.5 min-h-8">
                  <PermissionSwitch
                    checked={granted}
                    onChange={() => void togglePermission(p.key)}
                  />
                  <span className="flex-1 min-w-0 text-sm text-slate-700 leading-snug">{p.label}</span>
                  {isCustom && (
                    <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-100">
                      커스텀
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </li>
  );
}

export function StaffPermissionsSection() {
  const { profile, academy } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStaff = useCallback(async () => {
    if (!academy?.id) return;
    setLoading(true);
    const { data, error: err } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('academy_id', academy.id)
      .in('role', ['admin', 'teacher', 'desk'])
      .neq('id', profile?.id ?? '')   // 본인 제외
      .order('name');
    if (err) setError('직원 목록을 불러오지 못했습니다.');
    else setStaff((data ?? []) as StaffMember[]);
    setLoading(false);
  }, [academy?.id, profile?.id]);

  useEffect(() => {
    void loadStaff();
  }, [loadStaff]);

  if (loading) return <p className="text-sm text-slate-400">불러오는 중…</p>;

  return (
    <div className="rounded-2xl p-6 bg-white border border-slate-200 space-y-4">
      {error && <ErrorBanner message={error} />}
      <div>
        <h3 className="text-sm font-bold text-slate-900">직원 권한 관리</h3>
        <p className="text-xs text-slate-500 mt-1">
          역할별 기본 권한을 기반으로 직원별 세부 권한을 조정합니다.
        </p>
      </div>

      {staff.length === 0 ? (
        <p className="text-sm text-slate-500 py-4 text-center">등록된 직원이 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {staff.map((m) => (
            <StaffRow key={m.id} member={m} onRoleChange={() => void loadStaff()} />
          ))}
        </ul>
      )}

      <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-700">역할별 기본 접근 범위</p>
        <p><span className="font-medium text-slate-800">부원장</span> — 전체 학생·수업·상담·학부모·수강료 (설정 제외)</p>
        <p><span className="font-medium text-slate-800">강사</span> — 담당 반 학생·수업 기록·상담·학부모 소통</p>
        <p><span className="font-medium text-slate-800">원무</span> — 학생 등록·재등록·학부모 소통·수강료</p>
      </div>
    </div>
  );
}
