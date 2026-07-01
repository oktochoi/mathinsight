'use client';

import { useEffect, useState } from 'react';
import { ACADEMY_INFO_CATEGORIES, type AcademyInfoCategory, type AcademyInfoItem } from '@/lib/academyInfo';
import { cn } from '@/lib/cn';

type DraftItem = {
  category: AcademyInfoCategory;
  title: string;
  content: string;
};

const EMPTY_DRAFT: DraftItem = { category: 'intro', title: '', content: '' };

export function AcademyInfoSection() {
  const [items, setItems] = useState<AcademyInfoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<DraftItem>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ title: string; content: string }>({ title: '', content: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/settings/academy-info');
    const data = (await res.json()) as { ok: boolean; items?: AcademyInfoItem[] };
    if (data.ok) setItems(data.items ?? []);
    setLoading(false);
  };

  const add = async () => {
    if (!draft.title.trim() || !draft.content.trim()) return;
    setSaving(true);
    const res = await fetch('/api/settings/academy-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    const data = (await res.json()) as { ok: boolean; item?: AcademyInfoItem };
    if (data.ok && data.item) {
      setItems((prev) => [...prev, data.item!]);
      setDraft(EMPTY_DRAFT);
      showToast('추가됐어요');
    }
    setSaving(false);
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    const res = await fetch('/api/settings/academy-info', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, title: editDraft.title, content: editDraft.content }),
    });
    const data = (await res.json()) as { ok: boolean; item?: AcademyInfoItem };
    if (data.ok && data.item) {
      setItems((prev) => prev.map((it) => (it.id === id ? data.item! : it)));
      setEditingId(null);
      showToast('수정됐어요');
    }
    setSaving(false);
  };

  const toggleActive = async (item: AcademyInfoItem) => {
    const res = await fetch('/api/settings/academy-info', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, is_active: !item.is_active }),
    });
    const data = (await res.json()) as { ok: boolean; item?: AcademyInfoItem };
    if (data.ok && data.item) {
      setItems((prev) => prev.map((it) => (it.id === item.id ? data.item! : it)));
    }
  };

  const remove = async (id: string) => {
    if (!confirm('삭제할까요?')) return;
    const res = await fetch(`/api/settings/academy-info?id=${id}`, { method: 'DELETE' });
    const data = (await res.json()) as { ok: boolean };
    if (data.ok) {
      setItems((prev) => prev.filter((it) => it.id !== id));
      showToast('삭제됐어요');
    }
  };

  const categoryLabel = Object.fromEntries(
    ACADEMY_INFO_CATEGORIES.map((c) => [c.id, c.label]),
  );

  // 카테고리별로 그룹화해서 보여줌
  const grouped = ACADEMY_INFO_CATEGORIES.map((cat) => ({
    ...cat,
    items: items.filter((it) => it.category === cat.id),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-8">
      {/* 안내 */}
      <div className="rounded-xl p-4 text-sm leading-relaxed"
           style={{ background: 'var(--app-accent-bg)', border: '1px solid var(--app-accent-border)',
                    color: 'var(--app-accent-ink)' }}>
        <p className="font-semibold mb-1">📌 학부모 챗봇에 표시되는 학원 정보</p>
        <p>아래에 입력한 내용이 학부모가 챗봇에서 <strong>"수강료가 얼마인가요?"</strong> 같은 질문을 했을 때 답변 근거로 사용돼요.</p>
      </div>

      {/* 기존 항목 목록 */}
      {loading ? (
        <p className="text-sm" style={{ color: 'var(--app-ink-3)' }}>불러오는 중…</p>
      ) : grouped.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed py-10 text-center"
             style={{ borderColor: 'var(--app-border)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--app-ink-3)' }}>
            아직 등록된 정보가 없어요
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--app-ink-4)' }}>
            아래 양식으로 첫 번째 항목을 추가해보세요
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.id}>
              <p className="text-xs font-bold uppercase tracking-wider mb-3"
                 style={{ color: 'var(--app-ink-4)' }}>
                {group.label}
              </p>
              <ul className="space-y-2">
                {group.items.map((item) => (
                  <li key={item.id}
                      className={cn(
                        'rounded-xl border px-4 py-3 transition-opacity',
                        !item.is_active && 'opacity-50',
                      )}
                      style={{ background: 'var(--app-surface)', borderColor: 'var(--app-border)' }}>
                    {editingId === item.id ? (
                      /* 인라인 편집 */
                      <div className="space-y-2">
                        <input
                          value={editDraft.title}
                          onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))}
                          className="w-full text-sm px-3 py-2 rounded-lg border"
                          style={{ borderColor: 'var(--app-border)', background: 'var(--app-surface-2)' }}
                          placeholder="제목"
                        />
                        <textarea
                          value={editDraft.content}
                          onChange={(e) => setEditDraft((d) => ({ ...d, content: e.target.value }))}
                          rows={3}
                          className="w-full text-sm px-3 py-2 rounded-lg border resize-none"
                          style={{ borderColor: 'var(--app-border)', background: 'var(--app-surface-2)' }}
                          placeholder="내용"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => void saveEdit(item.id)}
                            disabled={saving}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white disabled:opacity-50"
                            style={{ background: 'var(--app-accent)' }}>
                            저장
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-xs px-3 py-1.5 rounded-lg"
                            style={{ background: 'var(--app-surface-2)', color: 'var(--app-ink-3)',
                                     border: '1px solid var(--app-border)' }}>
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* 일반 보기 */
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold" style={{ color: 'var(--app-ink)' }}>
                            {item.title}
                          </p>
                          <p className="text-sm mt-0.5 whitespace-pre-wrap leading-relaxed"
                             style={{ color: 'var(--app-ink-3)' }}>
                            {item.content}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {/* 활성화 토글 */}
                          <button
                            onClick={() => void toggleActive(item)}
                            title={item.is_active ? '비활성화' : '활성화'}
                            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-slate-100">
                            <i className={cn('text-sm',
                              item.is_active ? 'ri-eye-line text-emerald-500' : 'ri-eye-off-line',
                            )}
                            style={{ color: item.is_active ? '#10b981' : 'var(--app-ink-4)' }} />
                          </button>
                          {/* 편집 */}
                          <button
                            onClick={() => {
                              setEditingId(item.id);
                              setEditDraft({ title: item.title, content: item.content });
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-slate-100">
                            <i className="ri-edit-line text-sm" style={{ color: 'var(--app-ink-3)' }} />
                          </button>
                          {/* 삭제 */}
                          <button
                            onClick={() => void remove(item.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-red-50">
                            <i className="ri-delete-bin-line text-sm text-red-400" />
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* 추가 폼 */}
      <div className="rounded-xl border p-5 space-y-4"
           style={{ background: 'var(--app-surface)', borderColor: 'var(--app-border)' }}>
        <p className="text-sm font-bold" style={{ color: 'var(--app-ink)' }}>새 항목 추가</p>

        {/* 카테고리 선택 */}
        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--app-ink-3)' }}>
            카테고리
          </label>
          <div className="flex flex-wrap gap-2">
            {ACADEMY_INFO_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setDraft((d) => ({ ...d, category: cat.id }))}
                className={cn(
                  'text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors',
                  draft.category === cat.id
                    ? 'text-white border-transparent'
                    : 'border-[var(--app-border)] bg-transparent',
                )}
                style={
                  draft.category === cat.id
                    ? { background: 'var(--app-accent)', borderColor: 'var(--app-accent)' }
                    : { color: 'var(--app-ink-3)', background: 'var(--app-surface)' }
                }>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 제목 */}
        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--app-ink-3)' }}>
            제목
          </label>
          <input
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            placeholder={`예) ${categoryLabel[draft.category]} 안내`}
            className="w-full text-sm px-3 py-2.5 rounded-lg border focus:outline-none focus:ring-2"
            style={{ borderColor: 'var(--app-border)', background: 'var(--app-surface-2)',
                     color: 'var(--app-ink)' }}
          />
        </div>

        {/* 내용 */}
        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--app-ink-3)' }}>
            내용
          </label>
          <textarea
            value={draft.content}
            onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
            rows={4}
            placeholder={getPlaceholder(draft.category)}
            className="w-full text-sm px-3 py-2.5 rounded-lg border resize-none focus:outline-none focus:ring-2"
            style={{ borderColor: 'var(--app-border)', background: 'var(--app-surface-2)',
                     color: 'var(--app-ink)' }}
          />
        </div>

        <button
          onClick={() => void add()}
          disabled={saving || !draft.title.trim() || !draft.content.trim()}
          className="text-sm font-semibold px-4 py-2.5 rounded-xl text-white disabled:opacity-40 transition-opacity hover:opacity-90"
          style={{ background: 'var(--app-accent)' }}>
          {saving ? '추가 중…' : '+ 추가하기'}
        </button>
      </div>

      {/* 토스트 */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg"
             style={{ background: 'var(--app-accent)' }}>
          {toast}
        </div>
      )}
    </div>
  );
}

function getPlaceholder(category: AcademyInfoCategory): string {
  const map: Record<AcademyInfoCategory, string> = {
    intro:      '예) 저희 학원은 2015년 설립된 수학 전문 학원으로…',
    curriculum: '예) 중학 수학: 개념 기초 → 유형 훈련 → 심화 순으로 진행합니다.',
    fees:       '예) 주 2회(월 8회) 기준 월 18만원 / 교재비 별도',
    rules:      '예) 무단 결석 시 보강은 당월 내로 조율해 드립니다.',
    teachers:   '예) 김○○ 선생님 — 수학교육과 졸업, 강의 경력 8년',
    faq:        '예) Q. 체험 수업이 가능한가요? A. 네, 첫 1회는 무료로 체험 가능합니다.',
  };
  return map[category] ?? '내용을 입력하세요';
}
