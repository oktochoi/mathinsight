'use client';

import { useEffect } from 'react';
import { BRAND_NAME, CONTACT_EMAIL } from '@/lib/brand';
import { SITE_THEME_COLOR } from '@/lib/marketing/siteAssets';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ko">
      <head>
        <title>일시적인 오류 | {BRAND_NAME}</title>
        <meta
          name="description"
          content={`${BRAND_NAME} 서비스 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.`}
        />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="theme-color" content={SITE_THEME_COLOR} />
      </head>
      <body
        style={{
          margin: 0,
          fontFamily: 'system-ui, sans-serif',
          background: '#f8fafc',
          color: '#0f172a',
        }}
      >
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem 1rem',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: '32rem' }}>
            <p style={{ fontSize: '4.5rem', fontWeight: 800, color: '#0284c7', margin: 0 }}>500</p>
            <h1 style={{ fontSize: '1.5rem', marginTop: '1rem', marginBottom: '0.75rem' }}>
              일시적인 오류가 발생했습니다
            </h1>
            <p style={{ color: '#475569', lineHeight: 1.6 }}>
              서비스 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.
            </p>
            <div
              style={{
                marginTop: '2rem',
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={reset}
                style={{
                  border: 'none',
                  borderRadius: '0.75rem',
                  background: '#0284c7',
                  color: '#fff',
                  padding: '0.75rem 1.25rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                다시 시도
              </button>
              <a
                href="/"
                style={{
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                  color: '#334155',
                  padding: '0.75rem 1.25rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                홈으로
              </a>
            </div>
            <p style={{ marginTop: '2.5rem', fontSize: '0.875rem', color: '#64748b' }}>
              문의:{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#0369a1' }}>
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>
        </main>
      </body>
    </html>
  );
}
