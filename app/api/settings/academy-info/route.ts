import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { requireStaff } from '@/lib/api/staffAuth';
import type { AcademyInfoCategory } from '@/lib/academyInfo';

// GET — 학원 정보 전체 조회 (설정 화면용)
export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const auth = await requireStaff(supabase);
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    const { data, error } = await supabase
      .from('academy_info')
      .select('*')
      .eq('academy_id', auth.academyId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ ok: true, items: data ?? [] });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}

// POST — 항목 추가
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const auth = await requireStaff(supabase);
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    const body = (await request.json()) as {
      category?: AcademyInfoCategory;
      title?: string;
      content?: string;
      sort_order?: number;
    };

    const title = body.title?.trim();
    const content = body.content?.trim();
    const category = body.category;

    if (!title || !content || !category) {
      return NextResponse.json(
        { ok: false, error: 'category, title, content가 필요합니다.' },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('academy_info')
      .insert({
        academy_id: auth.academyId,
        category,
        title,
        content,
        sort_order: body.sort_order ?? 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ ok: true, item: data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}

// PATCH — 항목 수정 또는 is_active 토글
export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const auth = await requireStaff(supabase);
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    const body = (await request.json()) as {
      id?: string;
      title?: string;
      content?: string;
      is_active?: boolean;
      sort_order?: number;
    };

    if (!body.id) {
      return NextResponse.json({ ok: false, error: 'id가 필요합니다.' }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.title !== undefined) updates.title = body.title.trim();
    if (body.content !== undefined) updates.content = body.content.trim();
    if (body.is_active !== undefined) updates.is_active = body.is_active;
    if (body.sort_order !== undefined) updates.sort_order = body.sort_order;

    const { data, error } = await supabase
      .from('academy_info')
      .update(updates)
      .eq('id', body.id)
      .eq('academy_id', auth.academyId) // 다른 학원 항목 수정 방지
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ ok: true, item: data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}

// DELETE — 항목 삭제
export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const auth = await requireStaff(supabase);
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ ok: false, error: 'id가 필요합니다.' }, { status: 400 });
    }

    const { error } = await supabase
      .from('academy_info')
      .delete()
      .eq('id', id)
      .eq('academy_id', auth.academyId);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
