import Link from 'next/link';
import { MARKETING_ROUTES } from '@/lib/marketing/siteStructure';
import { CTASection } from '@/components/marketing/ui/CTASection';
import { Reveal, RevealItem } from '@/components/marketing/motion/Reveal';
import { FadeIn } from '@/components/marketing/motion/FadeIn';
import { ScreenshotPlaceholder } from '@/components/marketing/ui/ScreenshotPlaceholder';
import { VideoPlaceholder } from '@/components/marketing/ui/VideoPlaceholder';
import { Section, SectionInner } from '@/components/marketing/ui/Section';
import { SectionHeader } from '@/components/marketing/ui/SectionHeader';
import { cn } from '@/lib/cn';
import { mkt } from '@/lib/marketing/ui';

const PROBLEMS = [
  {
    icon: 'ri-time-line',
    color: 'bg-rose-50 text-rose-600',
    title: '상담 준비에 30분이 걸립니다',
    desc: '출결·숙제·성적·메모가 여러 곳에 흩어져 있어 상담마다 자료를 다시 모읍니다.',
  },
  {
    icon: 'ri-alert-line',
    color: 'bg-amber-50 text-amber-600',
    title: '관리 필요 학생을 놓칩니다',
    desc: '점수 하락·숙제 미제출이 기록돼 있어도 위험 신호를 한눈에 보기가 어렵습니다.',
  },
  {
    icon: 'ri-user-unfollow-line',
    color: 'bg-sky-50 text-sky-600',
    title: '재등록 타이밍을 놓칩니다',
    desc: '상담 기록과 재등록 판단이 연결되지 않아 이탈 전에 대화하기 어렵습니다.',
  },
];

const WORKFLOW = [
  { step: '01', label: '수업 기록', desc: '출결·숙제·성적을 1분 안에' },
  { step: '02', label: 'AI 브리핑', desc: '상담 전 30초 학생 요약' },
  { step: '03', label: '상담 관리', desc: '맥락 유지된 상담 기록' },
  { step: '04', label: '학부모 리포트', desc: '앱으로 즉시 전달' },
  { step: '05', label: '재등록 추적', desc: '위험 학생 큐로 관리' },
];

const FEATURES = [
  {
    icon: 'ri-book-open-line',
    label: 'Today Workspace',
    desc: '오늘 수업 출결·숙제·점수를 한 화면에서',
    color: 'bg-sky-500',
  },
  {
    icon: 'ri-user-heart-line',
    label: 'Student CRM',
    desc: '학생 타임라인 · AI 상담 브리핑',
    color: 'bg-violet-500',
  },
  {
    icon: 'ri-parent-line',
    label: '학부모 포털',
    desc: '리포트·채팅·AI 24시간 응답',
    color: 'bg-emerald-500',
  },
  {
    icon: 'ri-bar-chart-grouped-line',
    label: '재등록 관리',
    desc: '위험도·상담·전환을 한 Workflow로',
    color: 'bg-orange-500',
  },
];

export function HomePageContent() {
  return (
    <>
      {/* ── HERO ─────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-slate-100 bg-white py-16 md:py-24">
        {/* Gradient orbs */}
        <div className="pointer-events-none absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-sky-100/60 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-green-100/40 blur-3xl" />

        <div className={cn(mkt.container, 'relative')}>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left copy */}
            <FadeIn>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3.5 py-1.5 text-xs font-semibold text-sky-700 mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                AI Native 학원 운영 SaaS
              </div>
              <h1 className="text-4xl font-extrabold leading-[1.15] tracking-tight text-slate-900 md:text-[3rem]">
                학생 기록이
                <br />
                <span className="bg-gradient-to-r from-sky-600 to-blue-700 bg-clip-text text-transparent">
                  상담 준비
                </span>
                가 됩니다
              </h1>
              <p className={cn(mkt.lead, 'mt-5 max-w-md')}>
                수업 입력 → AI 브리핑 → 상담 → 학부모 리포트 → 재등록까지,
                EduFlow는 기록이 운영으로 이어지는 흐름을 만듭니다.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href={MARKETING_ROUTES.signup}
                  className={cn(mkt.btnGreen, 'px-6 py-3 text-[15px]')}
                >
                  3일 무료 체험 →
                </Link>
                <Link
                  href={`${MARKETING_ROUTES.product}#tour`}
                  className={cn(mkt.btnOutline, 'px-6 py-3 text-[15px]')}
                >
                  <i className="ri-play-circle-line mr-1.5" />
                  Demo 먼저 보기
                </Link>
              </div>

              {/* Trust badges */}
              <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <i className="ri-check-line text-green-500" /> 카드 등록 없음
                </span>
                <span className="h-4 w-px bg-slate-200" />
                <span className="flex items-center gap-1.5">
                  <i className="ri-check-line text-green-500" /> 3일 무료 체험
                </span>
                <span className="h-4 w-px bg-slate-200" />
                <span className="flex items-center gap-1.5">
                  <i className="ri-check-line text-green-500" /> 즉시 시작
                </span>
              </div>
            </FadeIn>

            {/* Right — app mockup */}
            <FadeIn delay={0.1}>
              <ScreenshotPlaceholder
                screenshotKey="dashboard"
                priority
                className="shadow-2xl shadow-sky-900/10"
              />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── PROBLEM ──────────────────────────────────── */}
      <Section>
        <SectionInner>
          <SectionHeader
            eyebrow="Problem"
            title="이런 어려움이 있으신가요?"
            align="center"
          />
          <Reveal className="mt-8 grid gap-4 md:grid-cols-3">
            {PROBLEMS.map((p) => (
              <RevealItem key={p.title}>
                <div className={cn(mkt.card, mkt.cardHover, 'p-6')}>
                  <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl text-lg mb-4', p.color)}>
                    <i className={p.icon} />
                  </span>
                  <h3 className={mkt.h3}>{p.title}</h3>
                  <p className={cn(mkt.body, 'mt-2')}>{p.desc}</p>
                </div>
              </RevealItem>
            ))}
          </Reveal>
        </SectionInner>
      </Section>

      {/* ── SOLUTION / VIDEO ─────────────────────────── */}
      <Section muted>
        <SectionInner>
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <FadeIn>
              <p className={cn(mkt.eyebrow, 'mb-3')}>Solution</p>
              <h2 className={mkt.h2}>
                기록이 곧<br />
                <span className="text-sky-700">상담 준비</span>입니다
              </h2>
              <p className={cn(mkt.lead, 'mt-4')}>
                EduFlow는 수업 입력만으로 AI 브리핑·학부모 전달·재등록 판단의 기반을 만듭니다.
                ERP처럼 화면을 나누지 않고, 학생 중심의 하나의 흐름으로 설계했습니다.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  '수업·출결·숙제·성적이 학생 타임라인에 연결됩니다',
                  'AI 브리핑으로 상담 준비 시간을 5분으로 줄입니다',
                  '학부모 리포트와 재등록이 같은 맥락을 유지합니다',
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-sky-100 text-sky-700 text-xs">
                      <i className="ri-check-line" />
                    </span>
                    {line}
                  </li>
                ))}
              </ul>
              <div className="mt-7 flex gap-3">
                <Link href={MARKETING_ROUTES.product} className={mkt.btnOutline}>
                  Product 보기
                </Link>
                <Link href={MARKETING_ROUTES.workflow} className={cn(mkt.link, 'flex items-center py-3')}>
                  Workflow 전체 →
                </Link>
              </div>
            </FadeIn>
            <FadeIn delay={0.08}>
              <VideoPlaceholder
                title="EduFlow 2분 소개"
                subtitle="수업 → 상담 → 재등록 흐름 확인"
                duration="2:15"
                accent="sky"
              />
            </FadeIn>
          </div>
        </SectionInner>
      </Section>

      {/* ── WORKFLOW ─────────────────────────────────── */}
      <Section>
        <SectionInner>
          <SectionHeader
            eyebrow="Workflow"
            title="기록 → 상담 → 재등록, 하나의 흐름"
            align="center"
          />
          <div className="relative mt-10">
            {/* Connecting line */}
            <div className="absolute top-7 left-0 right-0 hidden h-px bg-gradient-to-r from-transparent via-sky-200 to-transparent md:block" />
            <div className="grid gap-6 md:grid-cols-5">
              {WORKFLOW.map((w, i) => (
                <FadeIn key={w.step} delay={i * 0.06}>
                  <div className="flex flex-col items-center text-center">
                    <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/30 mb-3">
                      <span className="text-xs font-bold opacity-60 absolute top-1 right-1.5">{w.step}</span>
                      <i className={['ri-book-open-line','ri-robot-line','ri-chat-smile-3-line','ri-parent-line','ri-loop-right-line'][i] + ' text-xl'} />
                    </div>
                    <p className="text-sm font-bold text-slate-800">{w.label}</p>
                    <p className="mt-1 text-[13px] text-slate-500">{w.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </SectionInner>
      </Section>

      {/* ── FEATURES + SCREENSHOT ────────────────────── */}
      <Section muted>
        <SectionInner>
          <SectionHeader
            eyebrow="Features"
            title="핵심 기능 한눈에"
            description="Workflow를 지원하는 기능들을 직접 확인해 보세요."
            align="center"
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <FadeIn key={f.label}>
                <div className={cn(mkt.card, mkt.cardHover, 'p-5 h-full')}>
                  <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl text-white text-base mb-3', f.color)}>
                    <i className={f.icon} />
                  </span>
                  <p className="text-sm font-bold text-slate-800">{f.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          <div className="mt-8">
            <ScreenshotPlaceholder
              screenshotKey="student-hub"
              className="shadow-xl shadow-slate-900/8"
            />
          </div>
        </SectionInner>
      </Section>

      {/* ── PRICING TEASER ───────────────────────────── */}
      <Section>
        <SectionInner narrow>
          <div className={cn(mkt.card, 'overflow-hidden')}>
            <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
              {[
                { plan: '스타터', price: '39,000', students: '50명', color: 'text-slate-700' },
                { plan: '성장', price: '79,000', students: '150명', color: 'text-sky-700', badge: '추천' },
                { plan: '프로', price: '149,000', students: '무제한', color: 'text-violet-700' },
              ].map((p) => (
                <div key={p.plan} className="relative p-6 text-center">
                  {p.badge && (
                    <span className="absolute top-4 right-4 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      {p.badge}
                    </span>
                  )}
                  <p className={cn('text-sm font-bold', p.color)}>{p.plan}</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-900">
                    ₩{p.price}
                    <span className="text-sm font-normal text-slate-400">/월</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-400">학생 {p.students}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 text-center">
              <p className="text-sm text-slate-500">
                3일 무료 체험 · 카드 등록 없음 ·{' '}
                <Link href={MARKETING_ROUTES.pricing} className={mkt.link}>
                  자세한 플랜 비교 →
                </Link>
              </p>
            </div>
          </div>
        </SectionInner>
      </Section>

      {/* ── CTA ──────────────────────────────────────── */}
      <CTASection
        variant="green"
        title="3일 무료 체험 — 카드 등록 없이 시작"
        description="Demo Academy로 먼저 둘러보거나, 바로 우리 학원 데이터로 시작할 수 있습니다."
        primary={{ href: MARKETING_ROUTES.signup, label: '무료 체험 시작', variant: 'accent' }}
        secondary={{ href: MARKETING_ROUTES.demo, label: '화면 투어 보기' }}
      />
    </>
  );
}
