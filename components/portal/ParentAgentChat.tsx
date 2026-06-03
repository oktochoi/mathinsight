'use client';

import { useEffect, useRef, useState } from 'react';
import { getSuggestedParentQuestions, type ParentAgentChatMessage } from '@/lib/parentAgent';
import { cn } from '@/lib/cn';

export function ParentAgentChat({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}) {
  const [messages, setMessages] = useState<ParentAgentChatMessage[]>([]);
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
    const userMsg: ParentAgentChatMessage = { role: 'user', content: q };
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
        source?: string;
        fallbackReason?: string;
      };

      if (!data.ok || !data.answer) {
        setError(data.error ?? '답변을 받지 못했습니다.');
        setMessages((prev) => prev.slice(0, -1));
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            data.answer +
            (data.fallbackReason ? `\n\n(${data.fallbackReason})` : ''),
        },
      ]);
    } catch {
      setError('네트워크 오류가 발생했습니다.');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="learning-agent"
      className="rounded-3xl border-2 border-violet-200 bg-white shadow-lg shadow-violet-100/60 overflow-hidden scroll-mt-6"
    >
      <div
        className="px-5 sm:px-7 py-5 sm:py-6 text-white"
        style={{ background: 'linear-gradient(135deg, #5b21b6 0%, #4f46e5 50%, #4338ca 100%)' }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <i className="ri-robot-2-line text-2xl" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-200">
                EduFlow 학습 Agent
              </p>
              <h2 className="text-lg sm:text-xl font-bold mt-0.5">궁금한 점을 물어보세요</h2>
              <p className="text-sm text-violet-100/95 mt-1 leading-relaxed max-w-xl">
                <strong className="text-white">{studentName}</strong> 학생의 기록만 조회합니다.
                다른 학생 정보는 사용하지 않습니다.
              </p>
            </div>
          </div>
          <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-white/15 border border-white/20 shrink-0">
            기록 기반
          </span>
        </div>
      </div>

      <div className="px-5 sm:px-7 py-4 sm:py-5 bg-violet-50/50 border-b border-violet-100">
        <p className="text-xs font-semibold text-violet-900 mb-2.5">자주 묻는 질문</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {getSuggestedParentQuestions().map((q) => (
            <button
              key={q}
              type="button"
              disabled={loading}
              onClick={() => void send(q)}
              className="text-left text-sm px-4 py-3 rounded-xl border border-violet-200/80 bg-white text-violet-950 hover:border-violet-400 hover:bg-violet-50 disabled:opacity-50 cursor-pointer transition-colors shadow-sm"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 sm:px-7 py-4 sm:py-5">
        <div
          ref={scrollRef}
          className="rounded-2xl border border-slate-200 bg-slate-50/80 min-h-[min(52vh,440px)] max-h-[min(72vh,640px)] overflow-y-auto p-4 sm:p-5 space-y-4"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center py-12 sm:py-16 px-4">
              <div className="w-14 h-14 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center mb-4">
                <i className="ri-chat-smile-3-line text-2xl" aria-hidden />
              </div>
              <p className="text-base font-medium text-slate-700">
                위 질문을 누르거나 아래에 직접 입력해 보세요
              </p>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed max-w-md">
                답변은 여러 문단으로 자세히 안내됩니다. 스크롤하여 전체 내용을 확인할 수 있습니다.
              </p>
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                'flex',
                m.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[92%] sm:max-w-[85%] rounded-2xl px-4 py-3.5 leading-relaxed whitespace-pre-wrap break-words',
                  m.role === 'user'
                    ? 'text-[15px] text-white bg-violet-600 rounded-br-md shadow-sm'
                    : 'text-[15px] text-slate-800 bg-white border border-slate-200 rounded-bl-md shadow-sm'
                )}
              >
                {m.role === 'assistant' && (
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-600 mb-2">
                    학습 Agent
                  </p>
                )}
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-2xl px-4 py-3 animate-pulse">
                기록을 확인하고 답변을 작성하고 있습니다…
              </p>
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 mt-3 px-1" role="alert">
            {error}
          </p>
        )}

        <form
          className="flex flex-col sm:flex-row gap-2 mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="예: 최근 숙제는 잘 하고 있나요?"
            className="flex-1 px-4 py-3.5 rounded-xl border-2 border-violet-100 focus:border-violet-400 focus:outline-none text-base bg-white"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-base font-semibold disabled:opacity-50 cursor-pointer shrink-0 shadow-md shadow-violet-200"
          >
            {loading ? '답변 중…' : '질문하기'}
          </button>
        </form>

        <p className="text-xs text-slate-500 mt-4 leading-relaxed">
          답변은 학원에 기록된 데이터를 참고한 안내이며, 최종 확인은 담임 선생님·학원 상담을 통해
          해 주세요.
        </p>
      </div>
    </section>
  );
}
