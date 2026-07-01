'use client';

import { useEffect, useRef, useState } from 'react';
import {
  getSuggestedParentQuestions,
  getSuggestedStudentQuestions,
  type ParentAgentChatMessage,
} from '@/lib/parentAgent';
import type { RagCitation } from '@/lib/vectorRag/types';
import { RagCitations } from '@/components/portal/RagCitations';
import { cn } from '@/lib/cn';

type ChatMessage = ParentAgentChatMessage & {
  citations?: RagCitation[];
  ragMode?: 'vector' | 'keyword';
};

type Props = {
  studentId: string;
  studentName: string;
  academyName?: string;
  audience?: 'parent' | 'student';
};

export function PortalAgentChatEmbed({
  studentId,
  studentName,
  academyName = '학원',
  audience = 'parent',
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([]);
    setError(null);
    setInput('');
  }, [studentId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  const suggestions =
    audience === 'student' ? getSuggestedStudentQuestions() : getSuggestedParentQuestions();

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || loading || !studentId || studentId === 'pending') return;
    setError(null);
    setLoading(true);
    const userMsg: ChatMessage = { role: 'user', content: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    try {
      const res = await fetch('/api/parent-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          question: q,
          history: messages,
        }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        answer?: string;
        error?: string;
        citations?: RagCitation[];
        ragMode?: 'vector' | 'keyword';
      };

      if (!data.ok || !data.answer) {
        setError(data.error ?? '답변을 받지 못했습니다. 잠시 후 다시 시도해 주세요.');
        setMessages((prev) => prev.slice(0, -1));
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant' as const,
          content: data.answer as string,
          citations: data.citations,
          ragMode: data.ragMode,
        },
      ]);
    } catch {
      setError('인터넷 연결을 확인한 뒤 다시 시도해 주세요.');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const blocked = !studentId || studentId === 'pending';

  return (
    <div className="flex flex-col h-full min-h-0">
      {!blocked && (
        <div className="shrink-0 px-1 pb-2 border-b border-stone-100">
          <p className="text-[10px] font-semibold text-stone-500 mb-1.5">자주 묻는 질문</p>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {suggestions.map((q) => (
              <button
                key={q}
                type="button"
                disabled={loading}
                onClick={() => void send(q)}
                className="shrink-0 text-left text-[11px] px-2.5 py-1.5 rounded-lg bg-stone-100 text-stone-800 hover:bg-stone-200 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto py-3 px-1 space-y-3"
      >
        {blocked ? (
          <p className="text-sm text-center text-stone-500 py-8">
            AI 도우미를 이용하려면 먼저 {audience === 'student' ? '학원' : '자녀'} 연결이 필요합니다.
          </p>
        ) : messages.length === 0 ? (
          <p className="text-xs text-center text-stone-500 py-6 leading-relaxed">
            {studentName} · {academyName} 기록을 바탕으로 답변합니다.
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
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-md'
                    : 'bg-stone-100 text-stone-800 rounded-bl-md'
                )}
              >
                {m.content}
                {m.role === 'assistant' && m.citations && m.citations.length > 0 && (
                  <RagCitations citations={m.citations} />
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <p className="text-xs text-stone-500 px-2">기록을 확인하는 중…</p>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 px-1 shrink-0" role="alert">
          {error}
        </p>
      )}

      <form
        className="shrink-0 flex gap-2 pt-2 border-t border-stone-100"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="궁금한 점을 적어 주세요"
          className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          disabled={loading || blocked}
        />
        <button
          type="submit"
          disabled={loading || blocked || !input.trim()}
          className="px-3 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-40 shrink-0"
        >
          전송
        </button>
      </form>
    </div>
  );
}
