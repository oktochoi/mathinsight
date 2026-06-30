import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { normalizeSenderRole, notifyChatRecipients } from '@/lib/chat/notify';

type Body = {
  channelId?: string;
  studentId?: string;
  classId?: string;
  directAudience?: 'parent' | 'student';
  body?: string;
};

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('id, name, role, academy_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ ok: false, error: '프로필을 찾을 수 없습니다.' }, { status: 403 });
    }

    const payload = (await request.json()) as Body;
    const text = payload.body?.trim();

    if (!text) {
      return NextResponse.json({ ok: false, error: '메시지 내용이 필요합니다.' }, { status: 400 });
    }

    let channelId = payload.channelId?.trim();

    if (!channelId && payload.studentId?.trim()) {
      let audience = payload.directAudience;
      if (!audience) {
        if (profile.role === 'parent') audience = 'parent';
        else if (profile.role === 'student') audience = 'student';
      }
      const { data: rpcId, error: rpcErr } = await supabase.rpc('get_or_create_direct_chat_channel', {
        p_student_id: payload.studentId.trim(),
        p_audience: audience ?? null,
      });
      if (rpcErr || !rpcId) {
        return NextResponse.json(
          { ok: false, error: rpcErr?.message ?? '채널을 만들 수 없습니다.' },
          { status: 400 }
        );
      }
      channelId = rpcId as string;
    }

    if (!channelId && payload.classId?.trim()) {
      const { data: rpcId, error: rpcErr } = await supabase.rpc(
        'get_or_create_class_group_chat_channel',
        { p_class_id: payload.classId.trim() }
      );
      if (rpcErr || !rpcId) {
        return NextResponse.json(
          { ok: false, error: rpcErr?.message ?? '반 단톡을 만들 수 없습니다.' },
          { status: 400 }
        );
      }
      channelId = rpcId as string;
    }

    if (!channelId) {
      return NextResponse.json(
        { ok: false, error: 'channelId, studentId 또는 classId가 필요합니다.' },
        { status: 400 }
      );
    }

    const { data: channel } = await supabase
      .from('chat_channels')
      .select('id, type, student_id, class_id, academy_id, direct_audience')
      .eq('id', channelId)
      .maybeSingle();

    if (!channel) {
      return NextResponse.json({ ok: false, error: '채널을 찾을 수 없습니다.' }, { status: 404 });
    }

    const senderRole = normalizeSenderRole(profile.role as string);

    const { data: message, error: insertErr } = await supabase
      .from('chat_messages')
      .insert({
        channel_id: channelId,
        sender_id: user.id,
        sender_role: senderRole,
        body: text,
      })
      .select('id, created_at')
      .single();

    if (insertErr) {
      return NextResponse.json({ ok: false, error: insertErr.message }, { status: 403 });
    }

    const pushUrl =
      profile.role === 'parent'
        ? '/parent#inquiry'
        : profile.role === 'student'
          ? '/student#chat'
          : `/messages?mode=chat&channel=${channelId}`;

    const pushResult = await notifyChatRecipients(
      supabase,
      channel,
      user.id,
      profile.name || '알림',
      text,
      pushUrl
    );

    return NextResponse.json({
      ok: true,
      channelId,
      messageId: message?.id,
      pushed: pushResult.sent,
      pushSkipped: pushResult.skipped,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
