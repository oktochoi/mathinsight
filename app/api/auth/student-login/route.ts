import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import {
  normalizeLoginCode,
  studentSyntheticEmail,
} from '@/lib/invite/studentAuth';

const GENERIC_ERROR = '코드 또는 PIN이 올바르지 않습니다.';
const IP_WINDOW_MS = 60_000;
const IP_MAX = 30;
const ipHits = new Map<string, { count: number; at: number }>();

function checkIpRate(ip: string): boolean {
  const now = Date.now();
  const row = ipHits.get(ip);
  if (!row || now - row.at > IP_WINDOW_MS) {
    ipHits.set(ip, { count: 1, at: now });
    return true;
  }
  row.count += 1;
  return row.count <= IP_MAX;
}

function clientIp(request: Request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

async function findAuthUserByEmail(admin: ReturnType<typeof supabaseAdmin>, email: string) {
  for (let page = 1; page <= 5; page++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit;
    if (data.users.length < 200) break;
  }
  return null;
}

async function ensureStudentAuthUser(studentId: string, loginCode: string, pin: string) {
  const email = studentSyntheticEmail(loginCode);
  const admin = supabaseAdmin();

  const { data: st } = await admin
    .from('students')
    .select('academy_id, name')
    .eq('id', studentId)
    .single();

  if (!st?.academy_id) throw new Error('student_not_found');

  const existing = await findAuthUserByEmail(admin, email);

  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, { password: pin });
    return { userId: existing.id, email };
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password: pin,
    email_confirm: true,
    user_metadata: { role: 'student', student_id: studentId },
  });

  if (error || !created.user) {
    throw new Error(error?.message ?? 'auth_create_failed');
  }

  await admin.from('users').upsert({
    id: created.user.id,
    role: 'student',
    name: (st.name as string) ?? '학생',
    academy_id: st.academy_id,
    onboarding_complete: true,
  });

  await admin.from('student_connections').upsert(
    {
      student_id: studentId,
      user_id: created.user.id,
      relationship: 'student',
    },
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

  return { userId: created.user.id, email };
}

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    if (!checkIpRate(ip)) {
      return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 429 });
    }

    const body = (await request.json()) as { loginCode?: string; pin?: string };
    const loginCode = normalizeLoginCode(body.loginCode ?? '');
    const pin = (body.pin ?? '').trim();

    if (!loginCode || pin.length < 4) {
      await new Promise((r) => setTimeout(r, 300));
      return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 401 });
    }

    const admin = supabaseAdmin();
    const { data: lookup } = await admin.rpc('get_student_for_login', {
      p_login_code: loginCode,
    });

    const info = lookup as {
      ok?: boolean;
      error?: string;
      student_id?: string;
      pin_must_reset?: boolean;
    } | null;

    if (!info?.ok || !info.student_id) {
      await admin.rpc('record_student_pin_failure', { p_login_code: loginCode });
      await new Promise((r) => setTimeout(r, 300));
      return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 401 });
    }

    if (info.error === 'locked') {
      return NextResponse.json(
        { ok: false, error: '잠시 후 다시 시도해 주세요. (10분 잠금)' },
        { status: 423 }
      );
    }

    const email = studentSyntheticEmail(loginCode);
    await ensureStudentAuthUser(info.student_id, loginCode, pin);

    const { data: signIn, error: signErr } = await admin.auth.signInWithPassword({
      email,
      password: pin,
    });

    if (signErr || !signIn.session) {
      await admin.rpc('record_student_pin_failure', { p_login_code: loginCode });
      await new Promise((r) => setTimeout(r, 300));
      return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 401 });
    }

    await admin.rpc('clear_student_pin_lock', { p_student_id: info.student_id });

    return NextResponse.json({
      ok: true,
      session: {
        access_token: signIn.session.access_token,
        refresh_token: signIn.session.refresh_token,
      },
      pinMustReset: info.pin_must_reset ?? false,
      studentId: info.student_id,
      loginCode,
    });
  } catch {
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 500 });
  }
}
