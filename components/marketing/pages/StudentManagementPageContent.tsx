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

const FEATURES = [
  {
    title: '학생 프로필·타임라인',
    desc: '한 학생의 수업, 출결, 숙제, 성적, 상담 이력을 시간순으로 확인합니다.',
  },
  {
    title: '성적 변화 추이',
    desc: '시험·과목별 점수 변화를 시각적으로 파악합니다.',
  },
  {
    title: '상담 이력',
    desc: '학생별 상담 기록과 합의 사항을 타임라인에서 바로 확인합니다.',
  },
  {
    title: '위험 학생 알림',
    desc: '출결 변화, 성적 하락, 숙제 미제출 패턴이 감지되면 관리 대상으로 표시합니다.',
  },
];

const RELATED = [
  { href: MARKETING_ROUTES.academyConsulting, label: '학원 상담 프로그램', desc: '상담 준비·기록·학부모 전달' },
  { href: MARKETING_ROUTES.retention, label: '재등록 관리', desc: '위험 신호에서 상담·재등록 연결' },
  { href: MARKETING_ROUTES.academyManagement, label: '학원 관리 프로그램', desc: '수업·출결·시간표·대시보드' },
];

export function StudentManagementPageContent() {
  return (
    <>
      <PageHero
        eyebrow="Student Management"
        title="학생 한 명을 이해하는 데 몇 분이 걸리시나요"
        description="학생 정보가 흩어져 있으면 상담 전 파악에 시간이 걸리고, 관리가 필요한 학생을 놓치게 됩니다."
        primary={{ href: MARKETING_ROUTES.contact, label: '도입 문의하기' }}
        secondary={{ href: MARKETING_ROUTES.product, label: '기능 보기' }}
        tone="mint"
      />

      <Section>
        <SectionInner>
          <FadeIn>
            <p className={mkt.eyebrow}>Problem</p>
            <h2 className={cn(mkt.h2, 'mt-2')}>학생 정보를 모으는 데 시간이 걸립니다</h2>
            <p className={cn(mkt.lead, 'mt-4 max-w-2xl')}>
              출결은 출석부에, 성적은 별도 파일에, 상담 기록은 메모에 있습니다.
              학생 한 명의 전체 그림을 보려면 여러 곳을 뒤져야 합니다.
              학생이 많아질수록 관리가 필요한 학생을 놓칠 위험이 커집니다.
            </p>
          </FadeIn>
        </SectionInner>
      </Section>

      <Section muted>
        <SectionInner>
          <FadeIn>
            <p className={mkt.eyebrow}>Solution</p>
            <h2 className={cn(mkt.h2, 'mt-2')}>
              한 화면에서 학생을 이해하고, 위험 신호를 자동으로 확인합니다
            </h2>
            <p className={cn(mkt.lead, 'mt-4 max-w-2xl')}>
              학생별 출결·성적·숙제·상담 이력을 한 화면에서 확인합니다.
              성적 하락, 출결 변화 같은 위험 신호는 자동으로 표시되어 놓치지 않습니다.
            </p>
          </FadeIn>
        </SectionInner>
      </Section>

      <Section>
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

      <Section muted>
        <SectionInner>
          <FadeIn>
            <h2 className={mkt.h2}>학생 기록이 쌓일수록</h2>
          </FadeIn>
          <Reveal className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              { title: '상담이 정확해집니다', desc: '기록에 근거한 상담으로 학부모 신뢰를 높입니다.' },
              { title: '위험을 먼저 감지합니다', desc: '패턴 변화를 자동으로 파악해 관리 타이밍을 놓치지 않습니다.' },
              { title: '재등록 판단이 명확해집니다', desc: '학생의 학습 흐름과 상담 이력이 재등록 판단의 근거가 됩니다.' },
            ].map((v) => (
              <RevealItem key={v.title}>
                <div>
                  <h3 className={mkt.h3}>{v.title}</h3>
                  <p className={cn(mkt.body, 'mt-2')}>{v.desc}</p>
                </div>
              </RevealItem>
            ))}
          </Reveal>
        </SectionInner>
      </Section>

      <Section>
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
        title="학생 한 명을 한눈에 이해해 보세요"
        description="흩어진 기록을 모으고, 위험 신호까지 자동으로 파악합니다."
        primary={{ href: MARKETING_ROUTES.contact, label: '도입 문의하기', variant: 'accent' }}
        secondary={{ href: MARKETING_ROUTES.pricing, label: '요금 보기' }}
      />
    </>
  );
}
