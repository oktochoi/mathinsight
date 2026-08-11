import Link from 'next/link';
import {
  DEMO_TOUR_SECTIONS,
  MARKETING_ROUTES,
  PRODUCT_AI_CAPABILITIES,
  PRODUCT_IMPACT_METRICS,
  PRODUCT_PROBLEMS,
  PRODUCT_WORKFLOW_STEPS,
} from '@/lib/marketing/siteStructure';
import { Section } from '@/components/marketing/ui/Section';
import { CTASection } from '@/components/marketing/ui/CTASection';
import { ScreenTour } from '@/components/marketing/ui/ScreenTour';
import { ProductStudentPlane } from '@/components/marketing/product/ProductStudentPlane';
import { ProductWorkflowRail } from '@/components/marketing/product/ProductWorkflowRail';
import { Reveal, RevealItem } from '@/components/marketing/motion/Reveal';
import { FadeIn } from '@/components/marketing/motion/FadeIn';
import { cn } from '@/lib/cn';
import { mkt } from '@/lib/marketing/ui';
import { PROMO_ALL_FREE } from '@/lib/marketing/promoPricing';

const WIDE = 'mx-auto w-full max-w-[1400px] px-6 md:px-12 lg:px-16';

/** 제품 구성 비율 — AI가 화면을 지배하지 않는다는 것을 설명이 아니라 면적으로 보여준다 */
const COMPOSITION = [
  {
    label: '운영',
    weight: 60,
    bar: 'bg-slate-800',
    tone: 'text-slate-900',
    desc: '시간표 · 출결 · 숙제 · 성적 · 수납. 매일 여는 화면은 여전히 운영입니다.',
  },
  {
    label: 'AI',
    weight: 25,
    bar: 'bg-violet-400',
    tone: 'text-violet-700',
    desc: '상담 브리핑 · 위험 신호 감지. 기록에서 확인된 사실만 짧게 정리합니다.',
  },
  {
    label: '상담',
    weight: 15,
    bar: 'bg-emerald-600',
    tone: 'text-emerald-700',
    desc: '상담 기록 · 학부모 전달 · 재등록 판단. 결론은 사람이 하는 대화가 냅니다.',
  },
] as const;

/** PRODUCT_PROBLEMS와 같은 순서 — 문제 옆에 제품이 어떻게 처리하는지를 붙여 대조한다 */
const PROBLEM_ANSWERS = [
  '학생 상세를 열면 지난 상담 이후 무엇이 달라졌는지 이미 정리되어 있습니다.',
  '수업 · 상담 · 학부모 소통이 같은 학생 아래 하나의 타임라인으로 남습니다.',
  '상담 결과가 그대로 학부모용 리포트 초안이 되어, 다시 옮겨 적지 않습니다.',
] as const;

const SURFACE_INDEX = [
  {
    href: MARKETING_ROUTES.academyManagement,
    area: '학원 관리',
    covers: '출결 · 숙제 · 성적 · 시간표 · 수업 마감',
  },
  {
    href: MARKETING_ROUTES.academyConsulting,
    area: '상담 관리',
    covers: '상담 준비 · 상담 기록 · 학부모 전달 · 후속 과제',
  },
  {
    href: MARKETING_ROUTES.studentManagement,
    area: '학생 관리',
    covers: '학생별 기록 · 변화 추적 · 리포트 · 포털 전달',
  },
  {
    href: MARKETING_ROUTES.retention,
    area: '재등록 관리',
    covers: '재등록 파이프라인 · 수납 현황 · 이탈 위험 목록',
  },
] as const;

export function ProductPageContent() {
  return (
    <>
      {/* ── HERO — 학생 한 명의 화면이 아래로 잘려 나가는 하나의 평면 ── */}
      <section className="relative flex flex-col overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#fcfdfd_58%,#f5f9f7_100%)] md:min-h-[calc(100dvh-72px)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(115%_75%_at_50%_0%,black,transparent_72%)]"
        />

        <div className={cn(WIDE, 'relative pb-14 pt-[7vh] md:pb-16 md:pt-[9vh]')}>
          <FadeIn y={12}>
            <div className="flex flex-wrap items-center gap-3">
              <span className={mkt.eyebrow}>Product</span>
              <span className="hidden h-4 w-px bg-slate-300 sm:block" />
              <span className="text-sm text-slate-500">학생 한 명 중심으로 설계된 학원 운영 시스템</span>
            </div>
          </FadeIn>

          <FadeIn delay={0.06} y={14}>
            <h1 className="mt-8 max-w-[22ch] text-[clamp(2.25rem,5.4vw,4.25rem)] font-extrabold leading-[1.08] tracking-[-0.03em] text-slate-900 md:mt-10">
              학생 한 명을 열면
              <br />
              <span className="text-emerald-700">상담 준비</span>가 끝나 있습니다
            </h1>
          </FadeIn>

          <FadeIn delay={0.12}>
            <p className="mt-6 max-w-[48ch] text-[17px] leading-[1.75] text-slate-600 md:text-lg">
              출결·숙제·성적·상담이 학생 아래로 모이고, 다음 상담에서 무엇을 말할지까지 정리됩니다.
              상담 전에 자료를 다시 모으는 시간이 사라집니다.
            </p>
          </FadeIn>

          <FadeIn delay={0.18}>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href={MARKETING_ROUTES.contact}
                className={cn(mkt.btnGreen, 'group px-7 py-3.5 text-[15px]')}
              >
                도입 문의하기
                <i className="ri-arrow-right-line ml-1.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link href="#tour" className={cn(mkt.btnOutline, 'px-7 py-3.5 text-[15px]')}>
                실제 화면 둘러보기
              </Link>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              {PROMO_ALL_FREE.active
                ? '카드 등록 없이 시작 · 행사 기간 중 전 기능 무료'
                : '카드 등록 없이 시작 · 3일 무료 체험'}
            </p>
          </FadeIn>
        </div>

        <FadeIn
          delay={0.24}
          y={20}
          className="relative mt-auto h-[268px] overflow-hidden sm:h-[312px] lg:h-[356px]"
        >
          <ProductStudentPlane />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-white" />
        </FadeIn>
      </section>

      {/* ── 구성 비율 — 운영 60 · AI 25 · 상담 15를 면적으로 ── */}
      <Section id="composition" className="border-t border-slate-100 py-20 md:py-28">
        <div className={WIDE}>
          <FadeIn className="max-w-2xl">
            <p className={cn(mkt.eyebrow, 'mb-4')}>Composition</p>
            <h2 className="text-3xl font-extrabold tracking-[-0.02em] text-slate-900 md:text-4xl">
              화면의 60%는 여전히 운영입니다
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-[17px]">
              AI가 학원을 대신 운영하지 않습니다. 매일 여는 화면은 출결과 수업 기록이고, AI는 상담
              직전에 필요한 만큼만 옆에서 돕습니다.
            </p>
          </FadeIn>

          <FadeIn delay={0.08} className="mt-12">
            <div className="grid grid-cols-[60fr_25fr_15fr] gap-1">
              {COMPOSITION.map((c) => (
                <span key={c.label} className={cn('h-1.5 rounded-sm', c.bar)} />
              ))}
            </div>
            <div className="mt-6 grid gap-8 md:grid-cols-[60fr_25fr_15fr] md:gap-6">
              {COMPOSITION.map((c) => (
                <div key={c.label} className="md:pr-6">
                  <p className="flex items-baseline gap-2">
                    <span className={cn('text-[15px] font-bold', c.tone)}>{c.label}</span>
                    <span className="text-sm font-bold tabular-nums text-slate-400">
                      {c.weight}
                    </span>
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{c.desc}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </Section>

      {/* ── 문제 → 제품의 처리 ── */}
      <Section id="problem" muted className="border-t border-slate-100 py-20 md:py-28">
        <div className={WIDE}>
          <FadeIn className="max-w-2xl">
            <p className={cn(mkt.eyebrow, 'mb-4')}>Problem</p>
            <h2 className="text-3xl font-extrabold tracking-[-0.02em] text-slate-900 md:text-4xl">
              기록은 쌓이는데, 상담 준비는 수동입니다
            </h2>
          </FadeIn>

          <Reveal className="mt-12 border-t border-slate-200" stagger={0.06}>
            {PRODUCT_PROBLEMS.map((problem, i) => (
              <RevealItem key={problem.title}>
                <div className="grid gap-5 border-b border-slate-200 py-7 md:grid-cols-2 md:gap-14">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                      지금
                    </p>
                    <p className="mt-2.5 text-[15px] font-bold text-slate-800">{problem.title}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{problem.desc}</p>
                  </div>
                  <div className="border-l-2 border-emerald-200 pl-5 md:pl-6">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                      EduFlow
                    </p>
                    <p className="mt-2.5 text-[15px] leading-relaxed text-slate-700">
                      {PROBLEM_ANSWERS[i]}
                    </p>
                  </div>
                </div>
              </RevealItem>
            ))}
          </Reveal>
        </div>
      </Section>

      {/* ── WORKFLOW — 6 · 1 · 2가 하나의 레일 위에 ── */}
      <Section id="workflow" className="scroll-mt-20 border-t border-slate-100 py-20 md:py-28">
        <div className={WIDE}>
          <FadeIn className="max-w-2xl">
            <p className={cn(mkt.eyebrow, 'mb-4')}>Workflow</p>
            <h2 className="text-3xl font-extrabold tracking-[-0.02em] text-slate-900 md:text-4xl">
              수업 기록 6단계, AI 1단계, 재등록 2단계
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-[17px]">
              끊긴 기능 아홉 개가 아니라 하나의 흐름입니다. 중간에 다른 도구로 옮겨 적을 일이
              없습니다.
            </p>
          </FadeIn>

          <div className="mt-12">
            <ProductWorkflowRail steps={PRODUCT_WORKFLOW_STEPS} />
          </div>
        </div>
      </Section>

      {/* ── AI — 산출물 하나와 근거, 나머지는 조용한 인덱스 ── */}
      <Section id="ai" muted className="scroll-mt-20 border-t border-slate-100 py-20 md:py-28">
        <div className={cn(WIDE, 'grid gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20')}>
          <FadeIn>
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-violet-700">
              AI Layer
            </p>
            <h2 className="text-3xl font-extrabold tracking-[-0.02em] text-slate-900 md:text-4xl">
              AI는 상담 3분 전에만 등장합니다
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-600 md:text-[17px]">
              무엇을 보고 그렇게 말했는지 근거를 함께 남기고, 판단은 원장이 합니다. 학원 데이터
              밖의 이야기는 만들어 내지 않습니다.
            </p>

            <div className="mt-9 rounded-2xl border border-slate-200 bg-white p-6 md:p-7">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-violet-700">
                <i className="ri-sparkling-2-line" /> 상담 전 30초 요약
              </p>
              <p className="mt-4 border-l-2 border-violet-300 pl-5 text-lg font-semibold leading-[1.6] text-slate-800 md:text-xl">
                민준이가 이차방정식에서 반복해서 막히고 있어요. 숙제도 두 번 밀렸습니다.
              </p>
              <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1.5 pl-5 text-sm text-slate-500">
                <span className="font-semibold text-slate-400">근거</span>
                <span className="tabular-nums">5/18 시험 88 → 76</span>
                <span className="tabular-nums">숙제 미제출 2회</span>
                <span className="tabular-nums">지난 상담 5/15</span>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.08}>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
              이 레이어가 하는 일
            </p>
            <Reveal className="mt-4 border-t border-slate-200" stagger={0.05}>
              {PRODUCT_AI_CAPABILITIES.map((f) => (
                <RevealItem key={f.id}>
                  <div className="grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 border-b border-slate-200 py-4">
                    <p className="text-[15px] font-bold text-slate-900">{f.title}</p>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {f.tag}
                    </span>
                    <p className="col-span-2 text-sm leading-relaxed text-slate-600">{f.desc}</p>
                  </div>
                </RevealItem>
              ))}
            </Reveal>
          </FadeIn>
        </div>
      </Section>

      {/* ── TOUR — 실물 화면 ── */}
      <Section id="tour" className="scroll-mt-20 border-t border-slate-100 py-20 md:py-28">
        <div className={WIDE}>
          <FadeIn className="max-w-2xl">
            <p className={cn(mkt.eyebrow, 'mb-4')}>Product Tour</p>
            <h2 className="text-3xl font-extrabold tracking-[-0.02em] text-slate-900 md:text-4xl">
              실제 화면을 그대로 보여드립니다
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-[17px]">
              화면마다 하는 일이 다릅니다. 데모 계정으로 직접 눌러 보실 수 있습니다.
            </p>
          </FadeIn>

          <div className="mx-auto mt-12 max-w-[1180px]">
            <ScreenTour
              sections={DEMO_TOUR_SECTIONS as unknown as Array<{ id: string; title: string; desc: string; cta: string }>}
              demoHref={MARKETING_ROUTES.auth}
              signupHref={MARKETING_ROUTES.signup}
            />
          </div>
        </div>
      </Section>

      {/* ── 체감하는 변화 — KPI 카드가 아니라 문장 인덱스 ── */}
      <Section id="impact" muted className="scroll-mt-20 border-t border-slate-100 py-20 md:py-28">
        <div className={WIDE}>
          <FadeIn className="max-w-2xl">
            <p className={cn(mkt.eyebrow, 'mb-4')}>Impact</p>
            <h2 className="text-3xl font-extrabold tracking-[-0.02em] text-slate-900 md:text-4xl">
              원장이 체감하는 변화
            </h2>
          </FadeIn>

          <Reveal className="mt-12 border-t border-slate-200" stagger={0.05}>
            {PRODUCT_IMPACT_METRICS.map((m) => (
              <RevealItem key={m.label}>
                <div className="grid items-baseline gap-1.5 border-b border-slate-200 py-5 md:grid-cols-[260px_120px_1fr] md:gap-6">
                  <p className="text-[15px] font-bold text-slate-900">{m.label}</p>
                  <p className="text-[15px] font-semibold text-emerald-700">{m.value}</p>
                  <p className="text-sm text-slate-500">{m.sub}</p>
                </div>
              </RevealItem>
            ))}
          </Reveal>

          <p className="mt-6 text-sm text-slate-500">
            숫자는 학원마다 다릅니다. EduFlow가 바꾸는 것은 원장이 시간을 쓰는 지점입니다.
          </p>
        </div>
      </Section>

      {/* ── 영역별 인덱스 ── */}
      <Section className="border-t border-slate-100 py-20 md:py-28">
        <div className={WIDE}>
          <FadeIn className="max-w-2xl">
            <p className={cn(mkt.eyebrow, 'mb-4')}>Coverage</p>
            <h2 className="text-3xl font-extrabold tracking-[-0.02em] text-slate-900 md:text-4xl">
              영역별로 더 자세히
            </h2>
          </FadeIn>

          <Reveal className="mt-12 border-t border-slate-200" stagger={0.06}>
            {SURFACE_INDEX.map((item) => (
              <RevealItem key={item.href}>
                <Link
                  href={item.href}
                  className="group grid items-baseline gap-2 border-b border-slate-200 px-1 py-6 transition-colors duration-200 hover:bg-slate-50 md:grid-cols-[240px_1fr_auto] md:gap-6 md:px-3"
                >
                  <span className="text-[17px] font-bold tracking-tight text-slate-900 group-hover:text-teal-800">
                    {item.area}
                  </span>
                  <span className="text-[15px] leading-relaxed text-slate-600">{item.covers}</span>
                  <i className="ri-arrow-right-line hidden text-slate-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-teal-700 md:block" />
                </Link>
              </RevealItem>
            ))}
          </Reveal>
        </div>
      </Section>

      <CTASection
        variant="green"
        title="도입 상담 후 바로 시작하세요"
        description="행사 기간 중 전 기능 무료 · 카드 등록 없음"
        primary={{ href: MARKETING_ROUTES.contact, label: '도입 문의하기', variant: 'accent' }}
        secondary={{ href: MARKETING_ROUTES.demo, label: '데모 체험' }}
      />
    </>
  );
}
