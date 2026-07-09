import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { normalizeLoginCode } from '@/lib/invite/studentAuth';

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get('code')?.trim();
  if (!raw) {
    return NextResponse.json({ ok: false, error: 'code_required' }, { status: 400 });
  }

  const loginCode = normalizeLoginCode(raw);
  const { data, error } = await supabaseAdmin().rpc('get_student_for_login', {
    p_login_code: loginCode,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: 'preview_failed' }, { status: 500 });
  }

  const info = data as {
    ok?: boolean;
    name?: string;
    grade?: string;
    academy_name?: string;
  };

  if (!info?.ok) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    name: info.name,
    grade: info.grade,
    academyName: info.academy_name,
  });
}
