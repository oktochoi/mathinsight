'use client';

import Link from 'next/link';
import { useState } from 'react';
import { COMPANY_DOMAIN, COMPANY_LEGAL_NAME, CONTACT_EMAIL } from '@/lib/brand';
import { MARKETING_ROUTES } from '@/lib/marketing/siteStructure';
import { cn } from '@/lib/cn';
import { PageHeroMinimal } from '@/components/marketing/ui/PageHero';
import { Section, SectionInner } from '@/components/marketing/ui/Section';
import { Button } from '@/components/marketing/ui/Button';
import { mkt } from '@/lib/marketing/ui';

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={cn('flex flex-col gap-1.5', full && mkt.fieldFull)}>
      <span className={mkt.fieldLabel}>{label}</span>
      {children}
    </label>
  );
}

export function ContactPageContent() {
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setToast(null);

    const form = e.currentTarget;
    const fd = new FormData(form);

    try {
      const res = await fetch('/api/marketing/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fd.get('name'),
          email: fd.get('email'),
          academy: fd.get('academy'),
          type: fd.get('type'),
          body: fd.get('body'),
          website: fd.get('website'),
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string };
      if (!res.ok || !data.ok) {
        setToast({ type: 'err', text: data.error ?? '문의 접수에 실패했습니다.' });
        return;
      }
      setToast({ type: 'ok', text: data.message ?? '문의가 접수되었습니다.' });
      form.reset();
    } catch {
      setToast({ type: 'err', text: '네트워크 오류가 발생했습니다.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeroMinimal
        eyebrow="Contact"
        title="도입·데모·Enterprise 문의"
        description="영업일 기준 1–2일 내 회신을 목표로 합니다."
      />

      <Section>
        <SectionInner>
          <div className={mkt.contactGrid}>
            <div>
              <h2 className={mkt.sectionTitle}>연락처</h2>
              <p className="text-sm text-slate-500">문의 메일</p>
              <a href={`mailto:${CONTACT_EMAIL}`} className={mkt.contactEmail}>
                {CONTACT_EMAIL}
              </a>
              <p className={mkt.contactMeta}>평일 09:00 – 18:00 (KST)</p>
              <hr className={mkt.contactDivider} />
              <p className={mkt.contactMeta}>
                <strong className="text-zinc-900">{COMPANY_LEGAL_NAME}</strong>
                <br />
                {COMPANY_DOMAIN} · 파일럿 운영 중
              </p>
              <Link href={MARKETING_ROUTES.demo} className={cn(mkt.link, 'mt-4 inline-block')}>
                Demo 먼저 보기 →
              </Link>
            </div>

            <form className={mkt.contactForm} onSubmit={(e) => void handleSubmit(e)}>
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden
              />
              <Field label="이름">
                <input type="text" name="name" required placeholder="홍길동" className={mkt.fieldInput} />
              </Field>
              <Field label="이메일">
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="you@academy.kr"
                  className={mkt.fieldInput}
                />
              </Field>
              <Field label="학원명">
                <input type="text" name="academy" placeholder="OO수학학원" className={mkt.fieldInput} />
              </Field>
              <Field label="문의 유형">
                <select name="type" defaultValue="trial" className={mkt.fieldInput}>
                  <option value="trial">무료 체험 / 데모</option>
                  <option value="enterprise">Enterprise</option>
                  <option value="pilot">파일럿 참여</option>
                  <option value="other">기타</option>
                </select>
              </Field>
              <Field label="문의 내용" full>
                <textarea
                  name="body"
                  rows={5}
                  required
                  placeholder="학생 수, 현재 사용 도구, 상담 운영 방식"
                  className={mkt.fieldInput}
                />
              </Field>
              {toast && (
                <p
                  className={cn(
                    mkt.fieldFull,
                    'text-sm rounded-lg px-3 py-2',
                    toast.type === 'ok' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'
                  )}
                >
                  {toast.text}
                </p>
              )}
              <Button
                type="submit"
                variant="primary"
                disabled={busy}
                className={cn(mkt.fieldFull, 'w-full cursor-pointer')}
              >
                {busy ? '전송 중…' : '문의하기'}
              </Button>
            </form>
          </div>
        </SectionInner>
      </Section>
    </>
  );
}
