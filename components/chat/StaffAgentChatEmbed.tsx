'use client';

import { useEffect, useRef, useState } from 'react';
import { getSuggestedStaffQuestions, type StaffAgentChatMessage } from '@/lib/staffAgent';
import { CONTACT_EMAIL } from '@/lib/brand';
import { cn } from '@/lib/cn';

export function StaffAgentChatEmbed() {
  const [messages, setMessages] = useState<StaffAgentChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    setError(null);
    setLoading(true);
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setInput('');

    try {
      const res = await fetch('/api/staff-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, history: messages }),
      });
      const data = (await res.json()) as { ok: boolean; answer?: string; error?: string };

      if (!data.ok || !data.answer) {
        setError(data.error ?? '답변을 받지 못했습니다.');
        setMessages((prev) => prev.slice(0, -1));
        return;
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer! }]);
    } catch {
      setError('인터넷 연결을 확인한 뒤 다시 시도해 주세요.');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const suggestions = getSuggestedStaffQuestions();

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 px-1 pb-2 border-b" style={{ borderColor: 'var(--app-border)' }}>
        <p className="text-[10px] font-semibold mb-1.5" style={{ color: 'var(--app-ink-3)' }}>
          자주 묻는 질문
        </p>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {suggestions.map((q) => (
            <button
              key={q}
              type="button"
              disabled={loading}
              onClick={() => void send(q)}
              className="shrink-0 text-left text-[11px] px-2.5 py-1.5 rounded-lg disabled:opacity-50"
              style={{ background: 'var(--app-surface-2)', color: 'var(--app-ink-2)' }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto py-3 px-1 space-y-3">
        {messages.length === 0 ? (
          <p className="text-xs text-center py-6 leading-relaxed" style={{ color: 'var(--app-ink-3)' }}>
            EduFlow 사용법·학원 운영·성장 전략을 물어보세요.
          </p>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[90%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap break-words',
                  m.role === 'user' ? 'rounded-br-md' : 'rounded-bl-md'
                )}
                style={
                  m.role === 'user'
                    ? { background: '#2563eb', color: '#fff' }
                    : { background: 'var(--app-surface-2)', color: 'var(--app-ink)' }
                }
              >
                {m.content}
              </div>
            </div>
          ))
        )}
        {loading && (
          <p className="text-xs px-2" style={{ color: 'var(--app-ink-3)' }}>
            답변 준비 중…
          </p>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 px-1 shrink-0" role="alert">
          {error}
        </p>
      )}

      <form
        className="shrink-0 flex gap-2 pt-2 border-t"
        style={{ borderColor: 'var(--app-border)' }}
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="프로그램·운영 관련 질문"
          className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          style={{ borderColor: 'var(--app-border)', background: 'var(--app-surface)' }}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-3 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-40 shrink-0"
        >
          전송
        </button>
      </form>

      <a
        href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('EduFlow 고객센터 문의')}`}
        className="shrink-0 mt-2 text-center text-[11px] font-medium py-1.5 rounded-lg"
        style={{ color: 'var(--app-accent)', background: 'var(--app-surface-2)' }}
      >
        EduFlow 고객센터에 문의
      </a>
    </div>
  );
}
