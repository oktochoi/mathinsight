'use client';

import Link from 'next/link';
import { PageHero } from '@/components/marketing/ui/PageHero';
import { Section, SectionInner } from '@/components/marketing/ui/Section';
import { CTASection } from '@/components/marketing/ui/CTASection';
import { FadeIn } from '@/components/marketing/motion/FadeIn';
import { Reveal, RevealItem } from '@/components/marketing/motion/Reveal';
import { cn } from '@/lib/cn';
import { mkt } from '@/lib/marketing/ui';
import { MARKETING_ROUTES } from '@/lib/marketing/siteStructure';

const FLOW = [
  { label: '수업 기록', desc: '매일 출결·숙제·성적을 기록합니다' },
  { label: '학생 변화 축적', desc: '타임라인에 학습 변화가 쌓입니다' },
  { label: '상담 기록', desc: '상담 내용과 합의 사항을 저장합니다' },
  { label: '위험 신호 확인', desc: '이탈 패턴을 자동으로 감지합니다' },
  { label: '상담 대상 선정', desc: '우선 상담이 필요한 학생을 확인합니다' },
  { label: '학부모 상담', desc: '근거 기반의 상담을 진행합니다' },
  { label: '재등록 관리', desc: '상담 결과와 재등록을 연결합니다' },
];

const FEATURES = [
  {
    title: '위험 학생 감지',
    desc: '출결 변화, 성적 하락, 숙제 미제출 패턴에서 이탈 위험 신호를 자동 감지합니다.',
  },
  {
    title: '재등록 상담 큐',
    desc: '관리가 필요한 학생을 우선순위로 정렬하여 상담 대상을 선정합니다.',
  },
  {
    title: '상담 → 재등록 연결',
    desc: '상담 기록과 재등록 상태를 연결하여 한 흐름에서 추적합니다.',
  },
  {
    title: '학부모 소통',
    desc: '상담 결과 리포트와 포털을 통해 학부모와 같은 맥락을 유지합니다.',
  },
];

const RELATED = [
  { href: MARKETING_ROUTES.academyConsulting, label: '학원 상담 프로그램', desc: '상담 준비·기록·결과 전달' },
  { href: MARKETING_ROUTES.studentManagement, label: '학생 관리 프로그램', desc: '학생별 통합 기록과 분석' },
  { href: MARKETING_ROUTES.academyManagement, label: '학원 관리 프로그램', desc: '수업·출결·기록을 하나로' },
];

export function RetentionPageContent() {
  return (
    <>
      <PageHero
        eyebrow="Retention Management"
        title="재등록 상담, 퇴원 직전에 시작하면 늦습니다"
        description="재등록 시즌이 되면 그때서야 누가 남고 떠날지 파악하느라 바쁩니다. 이미 떠나기로 마음 먹은 학부모는 돌리기 어렵습니다."
        primary={{ href: MARKETING_ROUTES.contact, label: '도입 문의하기' }}
        secondary={{ href: MARKETING_ROUTES.product, label: '기능 보기' }}
        tone="peach"
      />

      <Section>
        <SectionInner>
          <FadeIn>
            <p className={mkt.eyebrow}>Flow</p>
            <h2 className={cn(mkt.h2, 'mt-2')}>기록에서 재등록까지 이어지는 흐름</h2>
            <p className={cn(mkt.lead, 'mt-4 max-w-2xl')}>
              수업 기록이 쌓이면 위험 신호가 보이고, 상담 대상이 정해지고, 상담이 재등록으로 이어집니다.
              재등록 시즌 전에 이 흐름이 만들어져 있어야 합니다.
            </p>
          </FadeIn>
          <div className="mt-10 flex flex-wrap items-center gap-2">
            {FLOW.map((s, i) => (
              <div key={s.label} className="flex items-center gap-2">
                <div className={cn(mkt.card, 'px-4 py-3 text-center')}>
                  <p className="text-sm font-bold text-slate-900">{s.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{s.desc}</p>
                </div>
                {i < FLOW.length - 1 && (
                  <span className="text-slate-300">&rarr;</span>
                )}
              </div>
            ))}
          </div>
        </SectionInner>
      </Section>

      <Section muted>
        <SectionInner>
          <FadeIn>
            <p className={mkt.eyebrow}>Problem</p>
            <h2 className={cn(mkt.h2, 'mt-2')}>재등록 시즌에 급하게 대응하고 계신가요</h2>
            <p className={cn(mkt.lead, 'mt-4 max-w-2xl')}>
              재등록 시즌이 되면 전체 학생 목록을 보며 누가 위험한지 기억에 의존합니다.
              학부모에게 연락할 때 근거가 부족하고, 상담 준비에 다시 시간을 씁니다.
              이미 떠나기로 결정한 학부모는 마지막 상담에서 마음이 바뀌지 않습니다.
            </p>
          </FadeIn>
        </SectionInner>
      </Section>

      <Section>
        <SectionInner>
          <FadeIn>
            <p className={mkt.eyebrow}>Solution</p>
            <h2 className={cn(mkt.h2, 'mt-2')}>
              평소 기록이 재등록 시즌의 대응력을 결정합니다
            </h2>
            <p className={cn(mkt.lead, 'mt-4 max-w-2xl')}>
              수업 기록에서 위험 신호를 평소에 연결해두면, 재등록 시즌 전에 상담 대상이 보입니다.
              EduFlow는 단순 출결·수납 ERP가 아니라, 학생의 흐름을 보고 상담과 재등록을 연결합니다.
            </p>
          </FadeIn>
        </SectionInner>
      </Section>

      <Section muted>
        <SectionInner>
          <FadeIn>
            <h2 className={mkt.h2}>핵심 기능</h2>
          </FadeIn>
          <Reveal className="mt-8 grid gap-6 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <RevealItem key={f.title}>
                <div className={cn(mkt.card, 'p-6')}>
                  <h3 className={mkt.h3}>{f.title}</h3>
                  <p className={cn(mkt.body, 'mt-2')}>{f.desc}</p>
                </div>
              </RevealItem>
            ))}
          </Reveal>
        </SectionInner>
      </Section>

      <Section>
        <SectionInner>
          <FadeIn>
            <div className={cn(mkt.card, 'border-emerald-200 bg-emerald-50 p-8')}>
              <p className={mkt.eyebrow}>EduFlow의 차별점</p>
              <h3 className={cn(mkt.h3, 'mt-2 text-xl')}>
                출결·수납 ERP가 아닌, 상담과 재등록을 연결하는 프로그램
              </h3>
              <p className={cn(mkt.body, 'mt-3 max-w-2xl')}>
                기존 학원 관리 프로그램은 출결과 수납 행정에 집중합니다.
                EduFlow는 수업 기록이 학생 분석으로, 분석이 상담으로, 상담이 재등록 관리로 이어지는
                흐름을 만듭니다. 재등록률은 재등록 시즌이 아니라, 평소의 기록과 상담에서 결정됩니다.
              </p>
            </div>
          </FadeIn>
        </SectionInner>
      </Section>

      <Section muted>
        <SectionInner>
          <FadeIn>
            <h2 className={mkt.h2}>관련 페이지</h2>
          </FadeIn>
          <Reveal className="mt-6 grid gap-4 sm:grid-cols-3">
            {RELATED.map((r) => (
              <RevealItem key={r.href}>
                <Link href={r.href} className={cn(mkt.card, mkt.cardHover, 'block p-6')}>
                  <p className="font-bold text-slate-800">{r.label}</p>
                  <p className={cn(mkt.body, 'mt-1')}>{r.desc}</p>
                  <span className="mt-3 inline-block text-sm font-semibold text-teal-700">
                    자세히 &rarr;
                  </span>
                </Link>
              </RevealItem>
            ))}
          </Reveal>
        </SectionInner>
      </Section>

      <CTASection
        title="재등록, 시즌 전에 준비하세요"
        description="수업 기록에서 위험 신호를 감지하고, 상담으로 연결하는 흐름을 만들어 보세요."
        primary={{ href: MARKETING_ROUTES.contact, label: '도입 문의하기', variant: 'accent' }}
        secondary={{ href: MARKETING_ROUTES.pricing, label: '요금 보기' }}
      />
    </>
  );
}
