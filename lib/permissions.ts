'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import {
  computePermissions,
  type PermissionKey,
} from '@/lib/permissionKeys';

export type { PermissionKey } from '@/lib/permissionKeys';
export {
  ALL_PERMISSIONS,
  DEFAULT_PERMISSIONS,
  computePermissions,
} from '@/lib/permissionKeys';

export function useStaffPermissions() {
  const { profile } = useAuth();
  const role = (profile?.role as string) ?? null;
  const [overrides, setOverrides] = useState<{ permission_key: string; granted: boolean }[]>([]);

  useEffect(() => {
    if (!profile?.id || !profile?.academy_id) {
      setOverrides([]);
      return;
    }
    void (async () => {
      const { data } = await supabase
        .from('staff_permission_overrides')
        .select('permission_key, granted')
        .eq('user_id', profile.id)
        .eq('academy_id', profile.academy_id);
      setOverrides((data ?? []) as { permission_key: string; granted: boolean }[]);
    })();
  }, [profile?.id, profile?.academy_id]);

  const permSet = computePermissions(role, overrides);
  const can = (key: PermissionKey): boolean => permSet.has(key);

  return { can, role };
}
