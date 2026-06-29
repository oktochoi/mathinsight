'use client';

import { useState } from 'react';
import type { ParentMessage, Student } from '@/types/database';

export function ParentMessagesPanel({
  messages,
  child,
  onSend,
}: {
  messages: ParentMessage[];
  child: Student;
  onSend: (input: { subject: string; body: string }) => Promise<{ error: string | null }>;
}) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    setError('');
    const result = await onSend({ subject, body });
    setSending(false);
    if (result.error) setError(result.error);
    else {
      setSubject('');
      setBody('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="parent-card-soft p-4 space-y-2">
        <p className="text-xs font-semibold text-stone-500">새 문의 ({child.name})</p>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="제목"
          className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="문의 내용을 적어 주세요"
          rows={3}
          className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={sending}
          className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50"
        >
          문의 보내기
        </button>
      </div>
      {messages.length > 0 && (
        <ul className="space-y-2">
          {messages.slice(0, 5).map((m) => (
            <li key={m.id} className="parent-card-soft p-3 text-sm">
              <p className="font-semibold text-stone-900">{m.subject}</p>
              <p className="text-stone-600 mt-1 text-xs line-clamp-2">{m.body}</p>
              {m.staff_reply && (
                <p className="mt-2 text-indigo-800 bg-indigo-50 rounded-lg p-2 text-xs leading-relaxed">
                  <span className="font-semibold">학원 답변: </span>
                  {m.staff_reply}
                </p>
              )}
              <p className="text-[10px] text-stone-400 mt-1">
                {m.status === 'answered' ? '답변 완료' : '답변 대기'}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
