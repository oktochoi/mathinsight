'use client';

import { useEffect, useRef, useState } from 'react';
import { getSuggestedParentQuestions, type ParentAgentChatMessage } from '@/lib/parentAgent';
import type { RagCitation } from '@/lib/vectorRag/types';
import { RagCitations } from '@/components/portal/RagCitations';
import { cn } from '@/lib/cn';

type ChatMessage = ParentAgentChatMessage & {
  citations?: RagCitation[];
  ragMode?: 'vector' | 'keyword';
};

export function ParentAgentChat({
  studentId,
  studentName,
  academyName = '학원',
  desktopSticky,
}: {
  studentId: string;
  studentName: string;
  academyName?: string;
  /** PC: 사이드 열 높이에 맞춘 채팅 영역 */
  desktopSticky?: boolean;
}) {
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

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
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

      const answer = data.answer;
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant' as const,
          content: answer,
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

  const suggestions = getSuggestedParentQuestions();

  return (
    <section
      className={cn(
        'parent-card overflow-hidden flex flex-col',
        desktopSticky && 'lg:min-h-[calc(100vh-7rem)] lg:max-h-[calc(100vh-5rem)]'
      )}
    >
      <div className="px-5 sm:px-6 py-5 border-b border-stone-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200/50">
            <i className="ri-chat-smile-2-line text-xl" aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-stone-900">학습 상담 도우미</h2>
            <p className="text-sm text-stone-500 mt-0.5">
              {studentName} · {academyName} 기록만 사용
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-5 py-4 bg-stone-50/80 border-b border-stone-100 shrink-0">
        <p className="text-xs font-semibold text-stone-500 mb-2.5">자주 묻는 질문</p>
        <div className="flex flex-wrap gap-2 lg:grid lg:grid-cols-2 lg:gap-2">
          {suggestions.map((q) => (
            <button
              key={q}
              type="button"
              disabled={loading}
              onClick={() => void send(q)}
              className="text-left text-sm px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-800 hover:border-indigo-300 hover:shadow-sm disabled:opacity-50 cursor-pointer transition-all max-w-full"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className={cn('px-4 sm:px-5 py-4 flex flex-col flex-1 min-h-0', desktopSticky && 'lg:flex-1')}>
        <div
          ref={scrollRef}
          className={cn(
            'rounded-2xl bg-stone-100/70 overflow-y-auto p-4 space-y-4 flex-1 min-h-[280px]',
            desktopSticky
              ? 'lg:min-h-0 lg:max-h-none lg:flex-1'
              : 'max-h-[min(55vh,520px)]'
          )}
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center py-14 px-3">
              <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 flex items-center justify-center text-indigo-500 mb-3">
                <i className="ri-message-3-line text-2xl" aria-hidden />
              </div>
              <p className="text-sm font-medium text-stone-700">질문을 선택하거나 직접 입력하세요</p>
              <p className="text-xs text-stone-500 mt-2 max-w-xs leading-relaxed">
                답변은 학원 수업·숙제 기록을 바탕으로 작성됩니다.
              </p>
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[88%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap break-words shadow-sm',
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-md'
                    : 'bg-white text-stone-800 border border-stone-200/80 rounded-bl-md'
                )}
              >
                {m.role === 'assistant' && (
                  <p className="text-[11px] font-semibold text-indigo-600 mb-2">답변</p>
                )}
                {m.content}
                {m.role === 'assistant' && m.citations && m.citations.length > 0 && (
                  <RagCitations citations={m.citations} />
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2 items-center text-sm text-stone-500 bg-white rounded-2xl px-4 py-3 border border-stone-200 w-fit">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.3s]" />
              </span>
              기록을 확인하는 중…
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 mt-3 px-1" role="alert">
            {error}
          </p>
        )}

        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="궁금한 점을 적어 주세요"
            className="flex-1 min-w-0 px-4 py-3.5 rounded-xl border border-stone-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-5 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-40 cursor-pointer shrink-0 transition-colors"
          >
            전송
          </button>
        </form>

        <p className="text-[11px] text-stone-400 mt-3 text-center leading-relaxed">
          AI 답변은 참고용입니다. 확실한 안내는 {academyName}에 문의해 주세요.
        </p>
      </div>
    </section>
  );
}
