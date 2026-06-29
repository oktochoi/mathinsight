import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { requireStaff } from '@/lib/api/staffAuth';
import { buildAcademyIcsFeed } from '@/lib/calendarIcs';
import type { ClassSchedule, ScheduleException } from '@/types/database';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token')?.trim();

    if (!token) {
      return new NextResponse('token required', { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: integration } = await supabase
      .from('academy_integrations')
      .select('academy_id, google_calendar_enabled')
      .eq('ics_feed_token', token)
      .maybeSingle();

    if (!integration?.academy_id) {
      return new NextResponse('Not found', { status: 404 });
    }

    const academyId = integration.academy_id;

    const [{ data: academy }, { data: schedules }, { data: exceptions }] = await Promise.all([
      supabase.from('academies').select('name').eq('id', academyId).maybeSingle(),
      supabase
        .from('class_schedules')
        .select('*, classes(id, name, grade)')
        .eq('academy_id', academyId),
      supabase.from('schedule_exceptions').select('*').eq('academy_id', academyId).limit(200),
    ]);

    const ics = buildAcademyIcsFeed(
      academy?.name ?? '학원',
      (schedules ?? []) as ClassSchedule[],
      (exceptions ?? []) as ScheduleException[]
    );

    return new NextResponse(ics, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'inline; filename="eduflow-schedule.ics"',
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (err) {
    console.error('[ics/GET]', err);
    return new NextResponse('Internal error', { status: 500 });
  }
}

/** 스태프가 토큰 없이 미리보기 */
export async function POST() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const auth = await requireStaff(supabase);
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    const [{ data: academy }, { data: schedules }, { data: exceptions }] = await Promise.all([
      supabase.from('academies').select('name').eq('id', auth.academyId).maybeSingle(),
      supabase
        .from('class_schedules')
        .select('*, classes(id, name, grade)')
        .eq('academy_id', auth.academyId),
      supabase.from('schedule_exceptions').select('*').eq('academy_id', auth.academyId).limit(200),
    ]);

    const ics = buildAcademyIcsFeed(
      academy?.name ?? '학원',
      (schedules ?? []) as ClassSchedule[],
      (exceptions ?? []) as ScheduleException[]
    );

    return NextResponse.json({ ok: true, preview: ics.slice(0, 800) });
  } catch (err) {
    console.error('[ics/POST]', err);
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}
