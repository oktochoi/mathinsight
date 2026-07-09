import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { requireStaff } from '@/lib/api/staffAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { generateInitialPin, normalizeLoginCode, studentSyntheticEmail } from '@/lib/invite/studentAuth';
import { getStudentInviteUrl } from '@/lib/invite/urls';

async function findAuthUserByEmail(email: string) {
  const admin = supabaseAdmin();
  for (let page = 1; page <= 5; page++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit;
    if (data.users.length < 200) break;
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const auth = await requireStaff(supabase);
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    const body = (await request.json()) as { studentId?: string };
    if (!body.studentId?.trim()) {
      return NextResponse.json({ ok: false, error: 'studentId가 필요합니다.' }, { status: 400 });
    }

    const studentId = body.studentId.trim();
    const admin = supabaseAdmin();

    const { data: inviteResult, error } = await admin.rpc('create_student_invite', {
      p_student_id: studentId,
    });

    const result = inviteResult as { ok?: boolean; login_code?: string; error?: string };
    if (error || !result?.ok || !result.login_code) {
      return NextResponse.json({ ok: false, error: result?.error ?? '코드 발급 실패' }, { status: 400 });
    }

    const loginCode = result.login_code;
    const initialPin = generateInitialPin(4);
    const authPin = initialPin.padStart(6, '0');
    const email = studentSyntheticEmail(loginCode);

    const { data: st } = await admin
      .from('students')
      .select('name, academy_id')
      .eq('id', studentId)
      .eq('academy_id', auth.academyId)
      .maybeSingle();

    if (!st) {
      return NextResponse.json({ ok: false, error: '학생을 찾을 수 없습니다.' }, { status: 404 });
    }

    const existing = await findAuthUserByEmail(email);
    if (existing) {
      await admin.auth.admin.updateUserById(existing.id, { password: authPin });
    } else {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password: authPin,
        email_confirm: true,
        user_metadata: { role: 'student', student_id: studentId },
      });
      if (createErr || !created.user) {
        return NextResponse.json({ ok: false, error: '계정 생성 실패' }, { status: 500 });
      }
      await admin.from('users').upsert({
        id: created.user.id,
        role: 'student',
        name: st.name,
        academy_id: st.academy_id,
        onboarding_complete: true,
      });
      await admin.from('student_connections').upsert(
        { student_id: studentId, user_id: created.user.id, relationship: 'student' },
        { onConflict: 'student_id,user_id' }
      );
      await admin.from('academy_memberships').upsert(
        {
          user_id: created.user.id,
          academy_id: st.academy_id,
          role: 'student',
          status: 'active',
        },
        { onConflict: 'user_id,academy_id,role' }
      );
    }

    return NextResponse.json({
      ok: true,
      loginCode,
      initialPin,
      inviteUrl: getStudentInviteUrl(loginCode),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
