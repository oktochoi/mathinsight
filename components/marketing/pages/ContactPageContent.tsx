'use client';

import Link from 'next/link';
import { useState } from 'react';
import { COMPANY_DOMAIN, COMPANY_LEGAL_NAME, CONTACT_EMAIL } from '@/lib/brand';
import { MARKETING_ROUTES } from '@/lib/marketing/siteStructure';
import { cn } from '@/lib/cn';
import { Section } from '@/components/marketing/ui/Section';
import { Button } from '@/components/marketing/ui/Button';
import { FadeIn } from '@/components/marketing/motion/FadeIn';
import { mkt } from '@/lib/marketing/ui';

/** 문의 페이지도 가격 페이지와 같은 문서 폭을 쓴다 */
const DOC = 'mx-auto w-full max-w-[1120px] px-6 md:px-12 lg:px-16';

/** 문의 후 무엇이 일어나는지 먼저 알려주는 것이 과장 카피보다 신뢰를 만든다 */
const PROCESS = [
  {
    label: '접수 확인',
    desc: '영업일 기준 1–2일 내에 담당자가 메일로 회신합니다.',
  },
  {
    label: '화면 확인',
    desc: '학원 상황에 맞는 화면을 데모 계정으로 함께 살펴봅니다.',
  },
  {
    label: '도입 검토',
    desc: '학생 수와 지금 쓰는 도구에 맞춰 기록 이전·온보딩 방식을 안내드립니다.',
  },
] as const;

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
      {/* ── HERO — 세일즈 문구 대신 회신 약속 한 줄 ── */}
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#fcfdfd_62%,#f5f9f7_100%)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(115%_80%_at_50%_0%,black,transparent_72%)]"
        />

        <div className={cn(DOC, 'relative pb-16 pt-[6vh] md:pb-20 md:pt-[8vh]')}>
          <FadeIn y={12}>
            <div className="flex flex-wrap items-center gap-3">
              <span className={mkt.eyebrow}>Contact</span>
              <span className="hidden h-4 w-px bg-slate-300 sm:block" />
              <span className="text-sm text-slate-500">도입 · 데모 · Enterprise</span>
            </div>
          </FadeIn>

          <FadeIn delay={0.06} y={14}>
            <h1 className="mt-8 max-w-[24ch] text-[clamp(2rem,4.4vw,3.25rem)] font-extrabold leading-[1.12] tracking-[-0.03em] text-slate-900 md:mt-10">
              학원 상황을 알려주시면
              <br />
              맞는 <span className="text-emerald-700">도입 방식</span>을 회신드립니다
            </h1>
          </FadeIn>

          <FadeIn delay={0.12}>
            <p className="mt-6 max-w-[46ch] text-[17px] leading-[1.75] text-slate-600">
              학생 수와 지금 쓰는 도구만 적어주셔도 충분합니다.{' '}
              <span className="whitespace-nowrap">영업일 기준 1–2일</span> 내 회신을 목표로 합니다.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── 진행 순서 · 연락처 / 문의 양식 ── */}
      <Section className="border-t border-slate-100 py-16 md:py-24">
        <div className={cn(DOC, 'grid gap-14 lg:grid-cols-[0.85fr_1fr] lg:gap-20')}>
          <FadeIn>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
              문의하면 이렇게 진행됩니다
            </p>

            <ol className="mt-6 divide-y divide-slate-100 border-y border-slate-200">
              {PROCESS.map((step, i) => (
                <li key={step.label} className="grid grid-cols-[28px_1fr] gap-4 py-5">
                  <span className="pt-0.5 text-sm font-bold tabular-nums text-emerald-700">
                    0{i + 1}
                  </span>
                  <div>
                    <p className="text-[15px] font-bold text-slate-900">{step.label}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  문의 메일
                </p>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="mt-2 inline-block text-[15px] font-bold text-teal-800 underline-offset-4 hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>
                <p className="mt-1.5 text-sm text-slate-500">평일 09:00 – 18:00 (KST)</p>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  사업자
                </p>
                <p className="mt-2 text-[15px] font-semibold text-slate-800">
                  {COMPANY_LEGAL_NAME}
                </p>
                <p className="mt-1.5 text-sm text-slate-500">{COMPANY_DOMAIN} · 파일럿 운영 중</p>
              </div>
            </div>

            <Link
              href={MARKETING_ROUTES.demo}
              className={cn(mkt.link, 'group mt-8 inline-flex items-center gap-1.5')}
            >
              화면을 먼저 보고 싶다면
              <i
                aria-hidden
                className="ri-arrow-right-line transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Link>
          </FadeIn>

          <FadeIn delay={0.1}>
            <form
              className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8"
              onSubmit={(e) => void handleSubmit(e)}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                문의 양식
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden
                />
                <Field label="이름">
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="홍길동"
                    className={mkt.fieldInput}
                  />
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
                  <input
                    type="text"
                    name="academy"
                    placeholder="OO수학학원"
                    className={mkt.fieldInput}
                  />
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

                <div aria-live="polite" className={mkt.fieldFull}>
                  {toast && (
                    <p
                      className={cn(
                        'border-l-2 pl-3 text-sm leading-relaxed',
                        toast.type === 'ok'
                          ? 'border-emerald-600 text-emerald-700'
                          : 'border-rose-500 text-rose-700'
                      )}
                    >
                      {toast.text}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={busy}
                  className={cn(
                    mkt.fieldFull,
                    'group w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-70'
                  )}
                >
                  {busy ? '전송 중…' : '도입 문의 보내기'}
                  {!busy && (
                    <i
                      aria-hidden
                      className="ri-arrow-right-line ml-1.5 transition-transform duration-200 group-hover:translate-x-0.5"
                    />
                  )}
                </Button>

                <p className={cn(mkt.fieldFull, 'text-xs leading-relaxed text-slate-500')}>
                  보내주신 내용은 도입 문의 회신 목적으로만 사용합니다.{' '}
                  <Link href={MARKETING_ROUTES.privacy} className="underline underline-offset-2">
                    개인정보처리방침
                  </Link>
                </p>
              </div>
            </form>
          </FadeIn>
        </div>
      </Section>
    </>
  );
}
