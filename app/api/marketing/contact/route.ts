import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { CONTACT_EMAIL } from '@/lib/brand';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const RATE_WINDOW_MS = 60_000;
const recentByIp = new Map<string, number>();

function clientIp(request: Request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const ipHash = createHash('sha256').update(ip).digest('hex').slice(0, 16);
    const now = Date.now();
    const last = recentByIp.get(ipHash);
    if (last && now - last < RATE_WINDOW_MS) {
      return NextResponse.json(
        { ok: false, error: '잠시 후 다시 시도해 주세요.' },
        { status: 429 }
      );
    }

    const body = (await request.json()) as {
      name?: string;
      email?: string;
      academy?: string;
      type?: string;
      body?: string;
      website?: string;
    };

    if (body.website?.trim()) {
      return NextResponse.json({ ok: true });
    }

    const name = body.name?.trim();
    const email = body.email?.trim();
    const message = body.body?.trim();

    if (!name || !email || !message) {
      return NextResponse.json({ ok: false, error: '필수 항목을 입력해 주세요.' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: '이메일 형식이 올바르지 않습니다.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin().from('contact_inquiries').insert({
      name,
      email,
      academy: body.academy?.trim() || null,
      inquiry_type: body.type?.trim() || 'other',
      body: message,
      ip_hash: ipHash,
    });

    if (error) {
      return NextResponse.json({ ok: false, error: '문의 저장에 실패했습니다.' }, { status: 500 });
    }

    recentByIp.set(ipHash, now);

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Contact] ${name} <${email}> → ${CONTACT_EMAIL}`);
    }

    return NextResponse.json({
      ok: true,
      message: '문의가 접수되었습니다. 영업일 기준 1–2일 내 회신드리겠습니다.',
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
