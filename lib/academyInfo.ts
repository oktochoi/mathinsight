import type { SupabaseClient } from '@supabase/supabase-js';

export const ACADEMY_INFO_CATEGORIES = [
  { id: 'intro',      label: '학원 소개' },
  { id: 'curriculum', label: '커리큘럼' },
  { id: 'fees',       label: '수강료 안내' },
  { id: 'rules',      label: '학원 규칙' },
  { id: 'teachers',   label: '선생님 소개' },
  { id: 'faq',        label: '자주 묻는 질문' },
] as const;

export type AcademyInfoCategory = (typeof ACADEMY_INFO_CATEGORIES)[number]['id'];

export interface AcademyInfoItem {
  id: string;
  academy_id: string;
  category: AcademyInfoCategory;
  title: string;
  content: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** 학원의 활성화된 정보 항목을 카테고리 순으로 가져옴 */
export async function fetchAcademyInfo(
  supabase: SupabaseClient,
  academyId: string,
): Promise<AcademyInfoItem[]> {
  const { data } = await supabase
    .from('academy_info')
    .select('*')
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  return (data ?? []) as AcademyInfoItem[];
}

/** 학원 정보를 챗봇 컨텍스트 텍스트로 직렬화 */
export function serializeAcademyInfoForContext(items: AcademyInfoItem[]): string {
  if (items.length === 0) return '';

  const categoryLabel: Record<string, string> = Object.fromEntries(
    ACADEMY_INFO_CATEGORIES.map((c) => [c.id, c.label]),
  );

  // 카테고리별로 그룹화
  const grouped = new Map<string, AcademyInfoItem[]>();
  for (const item of items) {
    const group = grouped.get(item.category) ?? [];
    group.push(item);
    grouped.set(item.category, group);
  }

  const lines: string[] = ['[학원 안내 정보 — 원장 입력]'];
  for (const [cat, catItems] of grouped) {
    lines.push(`\n▸ ${categoryLabel[cat] ?? cat}`);
    for (const item of catItems) {
      lines.push(`${item.title}: ${item.content}`);
    }
  }

  return lines.join('\n');
}
