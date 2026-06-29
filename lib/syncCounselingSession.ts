import { supabase } from '@/lib/supabase';
import type { CounselingSession } from '@/types/database';

/** 상담 완료·후속 필요 시 카드·후속조치 DB 동기화 */
export async function syncCounselingSessionArtifacts(
  session: CounselingSession,
  academyId: string,
  opts: {
    summary?: string;
    parentMessage?: string;
    checklist?: CounselingSession['followup_checklist'];
    markCardComplete?: boolean;
  }
) {
  const summary = opts.summary?.trim() ?? session.summary?.trim() ?? '';
  const parentMessage = opts.parentMessage?.trim() ?? session.parent_message_draft?.trim() ?? '';
  const checklist = opts.checklist ?? session.followup_checklist ?? [];

  let cardId = session.consultation_card_id ?? null;

  if (!cardId) {
    const { data: pending } = await supabase
      .from('consultation_cards')
      .select('id')
      .eq('student_id', session.student_id)
      .eq('consultation_status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    cardId = (pending as { id?: string } | null)?.id ?? null;
  }

  if (cardId) {
    const cardPatch: Record<string, unknown> = {};
    if (summary) cardPatch.consultation_note = summary;
    if (parentMessage) cardPatch.parent_message = parentMessage;
    if (opts.markCardComplete !== false) {
      cardPatch.consultation_status = 'completed';
      cardPatch.consulted_at = new Date().toISOString();
    }
    if (Object.keys(cardPatch).length > 0) {
      await supabase.from('consultation_cards').update(cardPatch).eq('id', cardId);
    }
    if (!session.consultation_card_id) {
      await supabase
        .from('counseling_sessions')
        .update({ consultation_card_id: cardId })
        .eq('id', session.id);
    }
  }

  const undone = checklist.filter((c) => !c.done && c.label.trim());
  if (undone.length === 0) return;

  const { data: existing } = await supabase
    .from('consultation_followups')
    .select('title')
    .eq('student_id', session.student_id)
    .eq('status', 'pending')
    .limit(50);

  const existingTitles = new Set(
    ((existing ?? []) as { title: string }[]).map((r) => r.title.trim())
  );

  for (const item of undone) {
    const title = item.label.trim();
    if (existingTitles.has(title)) continue;
    await supabase.from('consultation_followups').insert({
      academy_id: academyId,
      student_id: session.student_id,
      consultation_card_id: cardId,
      title,
      memo: summary ? `상담 요약: ${summary.slice(0, 300)}` : '',
      status: 'pending',
    });
    existingTitles.add(title);
  }
}
