import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: 'not_authenticated' }, { status: 401 });
    }

    const body = (await request.json()) as { token?: string };
    const token = body.token?.trim();
    if (!token) {
      return NextResponse.json({ ok: false, error: 'token_required' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('accept_academy_invitation', {
      p_token: token,
    });

    if (error) {
      return NextResponse.json({ ok: false, error: 'accept_failed' }, { status: 500 });
    }

    const result = data as {
      ok?: boolean;
      error?: string;
      expected_email?: string;
      role?: string;
    };

    if (!result?.ok) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
