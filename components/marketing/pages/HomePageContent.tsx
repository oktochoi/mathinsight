import Link from 'next/link';
import { MARKETING_ROUTES } from '@/lib/marketing/siteStructure';
import { CTASection } from '@/components/marketing/ui/CTASection';
import { Reveal, RevealItem } from '@/components/marketing/motion/Reveal';
import { FadeIn } from '@/components/marketing/motion/FadeIn';
import { RecordJourney } from '@/components/marketing/home/RecordJourney';
import { MarketingScreenMockup } from '@/components/marketing/ui/MarketingScreenMockup';
import { ScreenshotPlaceholder } from '@/components/marketing/ui/ScreenshotPlaceholder';
import { Section, SectionInner } from '@/components/marketing/ui/Section';
import { cn } from '@/lib/cn';
import { mkt } from '@/lib/marketing/ui';
import { PROMO_ALL_FREE } from '@/lib/marketing/promoPricing';

const WIDE = 'mx-auto w-full max-w-[1400px] px-6 md:px-12 lg:px-16';

/** Hero 우측 목업 주위에 흩어진 신호 조각 — RecordJourney 1막(수렴)의 예고. 장식용, 스크린리더 노출 안 함 */
const HERO_FRAGMENTS = [
  { icon: 'ri-chat-3-line', text: '숙제 못 냈어요', pos: '-left-6 -top-10 md:-left-16', rotate: '-rotate-6', float: 'animate-float' },
  { icon: 'ri-sticky-note-line', text: '또 틀림', pos: '-right-4 -top-14 md:-right-14', rotate: 'rotate-3', float: 'animate-float-slow' },
  { icon: 'ri-table-line', text: '점수 92점', pos: '-left-10 -bottom-8 md:-left-20', rotate: 'rotate-2', float: 'animate-float-slow' },
  { icon: 'ri-question-line', text: '뭐였더라···', pos: '-right-6 -bottom-12 md:-right-16', rotate: '-rotate-3', float: 'animate-float' },
] as const;

export function HomePageContent() {
  return (
    <>
      {/* ── HERO — 화면 비율과 무관하게 항상 뷰포트 100%를 채운다 (헤더 높이 73px 제외) ── */}
      <section className="relative flex h-[calc(100vh-73px)] items-start border-b border-slate-100 bg-white pt-[9vh] md:pt-[11vh]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-[500px] w-[500px] animate-float-slow rounded-full bg-emerald-100/50 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-[400px] w-[400px] animate-float rounded-full bg-teal-100/40 blur-3xl" />
        </div>

        <div className={cn(WIDE, 'relative grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10')}>
          <FadeIn>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 md:mb-7">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {PROMO_ALL_FREE.active ? PROMO_ALL_FREE.badge : 'AI Native 학원 운영 SaaS'}
            </div>
            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:text-[4.5rem]">
              학생 기록이
              <br />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 bg-[length:200%_auto] bg-clip-text text-transparent animate-shimmer">
                상담 준비
              </span>
              가 됩니다
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-slate-500 md:mt-6 md:text-xl">
              수업 입력 → AI 브리핑 → 상담 → 학생·학부모 포털까지,
              EduFlow는 원장의 하루가 기록으로 이어지는 흐름을 만듭니다.
            </p>

            <div className="mt-6 flex flex-wrap gap-3 md:mt-8">
              <Link href={MARKETING_ROUTES.signup} className={cn(mkt.btnGreen, 'px-6 py-3 text-[15px]')}>
                {PROMO_ALL_FREE.active ? `${PROMO_ALL_FREE.cta} →` : '3일 무료 체험 →'}
              </Link>
              <Link
                href={`${MARKETING_ROUTES.product}#tour`}
                className={cn(mkt.btnOutline, 'px-6 py-3 text-[15px] transition-transform hover:-translate-y-0.5')}
              >
                <i className="ri-play-circle-line mr-1.5" />
                Demo 먼저 보기
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-500 md:mt-8">
              <span className="flex items-center gap-1.5">
                <i className="ri-check-line text-green-500" /> 카드 등록 없음
              </span>
              <span className="h-4 w-px bg-slate-200" />
              <span className="flex items-center gap-1.5">
                <i className="ri-check-line text-green-500" />{' '}
                {PROMO_ALL_FREE.active ? '행사 기간 전 플랜 무료' : '3일 무료 체험'}
              </span>
              <span className="h-4 w-px bg-slate-200" />
              <span className="flex items-center gap-1.5">
                <i className="ri-check-line text-green-500" /> 즉시 시작
              </span>
            </div>
          </FadeIn>

          {/* 우측 — 실제 대시보드 화면. 흩어진 신호는 이 화면 주위에서 이미 정리되고 있다 */}
          <FadeIn delay={0.1} className="relative hidden lg:block">
            <div aria-hidden className="pointer-events-none absolute inset-0">
              {HERO_FRAGMENTS.map((f) => (
                <span
                  key={f.text}
                  className={cn(
                    'absolute inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-white px-3.5 py-2 text-sm font-medium text-slate-500 shadow-md ring-1 ring-slate-200',
                    f.pos,
                    f.rotate,
                    f.float
                  )}
                >
                  <i className={f.icon} />
                  {f.text}
                </span>
              ))}
            </div>
            <MarketingScreenMockup variant="dashboard" className="relative mx-auto w-full max-w-md" />
          </FadeIn>
        </div>

        {/* 스크롤 유도 — Workflow 문구 섹션 대신, 바로 아래 기록의 하루로 이어진다는 신호만 남긴다 */}
        <div className="absolute inset-x-0 bottom-6 flex justify-center">
          <div className="flex animate-bounce flex-col items-center gap-1 text-slate-400">
            <span className="text-xs font-medium">스크롤해서 보기</span>
            <i className="ri-arrow-down-line text-xl" />
          </div>
        </div>
      </section>

      {/* ── 기록의 하루 — 흩어짐 → 수렴 → AI 브리핑 → 상담 → 리포트 → 재등록 ── */}
      <RecordJourney />

      {/* ── 실제 화면 — 방금 본 흐름이 일어나는 곳 ──────────────────── */}
      <Section muted>
        <div className={WIDE}>
          <FadeIn className="max-w-2xl">
            <p className={cn(mkt.eyebrow, 'mb-3')}>Product</p>
            <h2 className="text-3xl font-extrabold leading-[1.2] tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
              지금 보신 흐름이, 실제 이 화면에서 일어납니다
            </h2>
          </FadeIn>
          <Reveal className="mt-10 grid gap-8 lg:grid-cols-2" stagger={0.12}>
            <RevealItem>
              <div>
                <ScreenshotPlaceholder
                  screenshotKey="dashboard"
                  className="shadow-xl shadow-slate-900/8 transition-shadow duration-300 hover:shadow-slate-900/15"
                />
                <p className="mt-3 text-base font-semibold text-slate-700">오늘 해야 할 일 — Dashboard</p>
              </div>
            </RevealItem>
            <RevealItem>
              <div>
                <ScreenshotPlaceholder
                  screenshotKey="student-hub"
                  className="shadow-xl shadow-slate-900/8 transition-shadow duration-300 hover:shadow-slate-900/15"
                />
                <p className="mt-3 text-base font-semibold text-slate-700">학생 기록 → 상담 허브 — Student Hub</p>
              </div>
            </RevealItem>
          </Reveal>
        </div>
      </Section>

      {/* ── PRICING TEASER (관습적 형태 유지 — 가격 비교는 익숙함이 신뢰) ── */}
      <Section>
        <SectionInner narrow>
          <FadeIn className="mb-8 text-center">
            <p className={cn(mkt.body, 'text-slate-500')}>이 흐름을 우리 학원에도 — 지금 바로 시작할 수 있습니다.</p>
          </FadeIn>
          <div className={cn(mkt.card, 'overflow-hidden')}>
            <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
              {[
                { plan: '스타터', price: '39,000', students: '50명', color: 'text-slate-700' },
                { plan: '성장', price: '79,000', students: '150명', color: 'text-teal-700', badge: '추천', featured: true },
                { plan: '프로', price: '149,000', students: '무제한', color: 'text-slate-700' },
              ].map((p) => (
                <div
                  key={p.plan}
                  className={cn(
                    'relative p-6 text-center transition-all duration-300 hover:-translate-y-0.5',
                    p.featured && 'bg-emerald-50/40 ring-1 ring-inset ring-emerald-200'
                  )}
                >
                  {p.badge && (
                    <span className="absolute top-4 right-4 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white animate-pulse">
                      {p.badge}
                    </span>
                  )}
                  <p className={cn('text-sm font-bold', p.color)}>{p.plan}</p>
                  <p className={cn('mt-1 text-2xl font-extrabold', PROMO_ALL_FREE.active ? 'text-green-600' : 'text-slate-900')}>
                    {PROMO_ALL_FREE.active ? '무료' : `₩${p.price}`}
                    {!PROMO_ALL_FREE.active && <span className="text-sm font-normal text-slate-400">/월</span>}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">학생 {p.students}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 text-center">
              <p className="text-sm text-slate-500">
                {PROMO_ALL_FREE.active ? (
                  <>
                    <strong className="text-green-700">{PROMO_ALL_FREE.badge}</strong> · 모든 플랜 무료 ·{' '}
                  </>
                ) : (
                  <>3일 무료 체험 · 카드 등록 없음 · </>
                )}
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
        title={
          PROMO_ALL_FREE.active
            ? `${PROMO_ALL_FREE.badge} — 모든 플랜 무료`
            : '3일 무료 체험 — 카드 등록 없이 시작'
        }
        description={
          PROMO_ALL_FREE.active
            ? PROMO_ALL_FREE.subtitle
            : 'Demo Academy로 먼저 둘러보거나, 바로 우리 학원 데이터로 시작할 수 있습니다.'
        }
        primary={{
          href: MARKETING_ROUTES.signup,
          label: PROMO_ALL_FREE.active ? PROMO_ALL_FREE.cta : '무료 체험 시작',
          variant: 'accent',
        }}
        secondary={{ href: MARKETING_ROUTES.demo, label: '화면 투어 보기' }}
      />
    </>
  );
}
