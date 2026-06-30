import { supabase } from '@/lib/supabase';
import { normalizePhoneKr } from '@/lib/phone';

export type PortalMatchStudent = {
  student_id: string;
  name: string;
  grade: string;
  school?: string | null;
  class_name?: string | null;
};

export type PortalMatchParent = {
  student_id: string;
  student_name: string;
  grade: string;
  class_name?: string | null;
  parent_name?: string;
  relationship?: string;
};

export type PreviewPortalResult =
  | {
      ok: true;
      academy_id: string;
      academy_name: string;
      academy_code: string;
      phone: string;
      mode: 'student' | 'parent';
      matches: PortalMatchStudent[] | PortalMatchParent[];
    }
  | { ok: false; error: string; detail?: string };

const ERROR_MESSAGES: Record<string, string> = {
  not_authenticated: '로그인이 필요합니다.',
  invalid_phone: '휴대폰 번호를 확인해 주세요.',
  invalid_code: '학원 코드가 올바르지 않습니다.',
  invalid_mode: '연결 유형이 올바르지 않습니다.',
  no_match: '등록된 정보와 일치하지 않습니다. 학원에 문의해 주세요.',
  student_not_found: '학생 정보를 찾을 수 없습니다.',
  student_role_required: '학생 계정으로 로그인해 주세요.',
  parent_role_required: '학부모 계정으로 로그인해 주세요.',
};

export function portalLinkErrorMessage(code?: string): string {
  if (!code) return '연결에 실패했습니다.';
  return ERROR_MESSAGES[code] ?? code;
}

export async function previewPortalLink(
  academyCode: string,
  phone: string,
  mode: 'student' | 'parent'
): Promise<PreviewPortalResult> {
  const { data, error } = await supabase.rpc('preview_portal_link', {
    p_academy_code: academyCode.trim().toUpperCase(),
    p_phone: normalizePhoneKr(phone),
    p_mode: mode,
  });

  if (error) {
    return {
      ok: false,
      error: error.message.includes('preview_portal_link')
        ? '연결 기능이 준비되지 않았습니다. Supabase 마이그레이션 044를 적용해 주세요.'
        : error.message,
    };
  }

  const result = data as PreviewPortalResult;
  if (!result?.ok) {
    return {
      ok: false,
      error: result?.error ?? 'unknown',
      detail: (result as { detail?: string }).detail,
    };
  }
  return result;
}

export async function confirmPortalLink(input: {
  academyCode: string;
  phone: string;
  mode: 'student' | 'parent';
  studentId?: string;
  relationship?: 'mother' | 'father' | 'guardian';
}): Promise<{ ok: boolean; error?: string; linkedCount?: number }> {
  const { data, error } = await supabase.rpc('confirm_portal_link', {
    p_academy_code: input.academyCode.trim().toUpperCase(),
    p_phone: normalizePhoneKr(input.phone),
    p_mode: input.mode,
    p_student_id: input.studentId ?? null,
    p_relationship: input.relationship ?? 'guardian',
  });

  if (error) {
    return {
      ok: false,
      error: error.message.includes('confirm_portal_link')
        ? '연결 기능이 준비되지 않았습니다. Supabase 마이그레이션 044를 적용해 주세요.'
        : error.message,
    };
  }

  const result = data as { ok: boolean; error?: string; linked_count?: number };
  if (!result?.ok) {
    return { ok: false, error: portalLinkErrorMessage(result?.error) };
  }
  return { ok: true, linkedCount: result.linked_count ?? 1 };
}
