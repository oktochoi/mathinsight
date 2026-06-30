'use client';

import { useState } from 'react';

export function ChatInput({
  onSend,
  disabled,
  placeholder = '메시지를 입력하세요',
}: {
  onSend: (text: string) => Promise<{ error: string | null }>;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!text.trim() || disabled) return;
    setError('');
    const result = await onSend(text);
    if (result.error) {
      setError(result.error);
      return;
    }
    setText('');
  };

  return (
    <div className="border-t pt-3" style={{ borderColor: 'var(--app-border)' }}>
      {error && (
        <p className="text-xs mb-2 app-text-danger">{error}</p>
      )}
      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void handleSubmit();
            }
          }}
          rows={2}
          disabled={disabled}
          placeholder={placeholder}
          className="flex-1 rounded-xl px-3 py-2 text-sm resize-none"
          style={{
            background: 'var(--app-surface-2)',
            border: '1px solid var(--app-border)',
            color: 'var(--app-ink)',
          }}
        />
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={disabled || !text.trim()}
          className="app-btn app-btn-primary self-end disabled:opacity-50 shrink-0"
        >
          전송
        </button>
      </div>
    </div>
  );
}
