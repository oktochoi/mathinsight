import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token')?.trim();
  if (!token) {
    return NextResponse.json({ ok: false, error: 'token_required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin().rpc('preview_academy_invitation', {
    p_token: token,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: 'preview_failed' }, { status: 500 });
  }

  return NextResponse.json(data);
}
