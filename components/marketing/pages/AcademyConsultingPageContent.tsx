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
    title: '상담 준비 브리핑',
    desc: '학생의 최근 수업 기록, 성적 변화, 이전 상담 합의 사항을 자동으로 정리합니다.',
  },
  {
    title: '상담 기록·상담일지',
    desc: '상담 내용, 합의 사항, 후속 과제를 기록하고 타임라인으로 관리합니다.',
  },
  {
    title: '학부모 상담 결과 전달',
    desc: '상담 결과를 학부모가 읽기 쉬운 리포트로 정리해 전달합니다.',
  },
  {
    title: '상담 이력 타임라인',
    desc: '학생별 상담 이력을 시간 순서로 확인하고, 지난 합의 사항을 빠르게 파악합니다.',
  },
];

const RELATED = [
  { href: MARKETING_ROUTES.studentManagement, label: '학생 관리 프로그램', desc: '학생별 통합 프로필과 위험 신호' },
  { href: MARKETING_ROUTES.retention, label: '재등록 관리', desc: '상담과 재등록을 연결하는 흐름' },
  { href: MARKETING_ROUTES.academyManagement, label: '학원 관리 프로그램', desc: '수업·출결·기록을 하나로' },
];

export function AcademyConsultingPageContent() {
  return (
    <>
      <PageHero
        eyebrow="Academy Consulting"
        title="학원 상담, 기록 없이 감으로 하고 계신가요"
        description="상담 전 학생 자료를 여러 곳에서 다시 모으고, 상담 후 기록을 따로 정리하고, 학부모에게 전달하는 과정이 매번 반복됩니다."
        primary={{ href: MARKETING_ROUTES.contact, label: '도입 문의하기' }}
        secondary={{ href: MARKETING_ROUTES.product, label: '기능 보기' }}
        tone="sky"
      />

      <Section>
        <SectionInner>
          <FadeIn>
            <p className={mkt.eyebrow}>Problem</p>
            <h2 className={cn(mkt.h2, 'mt-2')}>상담 준비와 기록, 전달이 모두 반복 업무</h2>
            <p className={cn(mkt.lead, 'mt-4 max-w-2xl')}>
              상담 전에 학생의 출결, 성적, 숙제, 이전 상담 내용을 여러 곳에서 찾아 모읍니다.
              상담 후에는 내용을 정리하고, 학부모에게 다시 전달합니다. 학생이 늘어날수록
              이 반복이 부담이 됩니다.
            </p>
          </FadeIn>
        </SectionInner>
      </Section>

      <Section muted>
        <SectionInner>
          <FadeIn>
            <p className={mkt.eyebrow}>Solution</p>
            <h2 className={cn(mkt.h2, 'mt-2')}>
              수업 기록이 상담 준비가 되고, 상담 결과가 학부모에게 전달됩니다
            </h2>
            <p className={cn(mkt.lead, 'mt-4 max-w-2xl')}>
              EduFlow에서 수업 기록이 쌓이면 상담 전 준비 요약이 자동으로 만들어집니다.
              상담 결과는 학부모 리포트로 전달되어 소통의 연속성이 유지됩니다.
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
            <h2 className={mkt.h2}>상담 전·중·후 흐름</h2>
          </FadeIn>
          <Reveal className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { phase: '상담 전', desc: '학생의 최근 기록, 성적 변화, 이전 합의 사항을 브리핑으로 확인합니다.' },
              { phase: '상담 중', desc: '논의 내용과 합의 사항을 기록합니다. 수업 기록이 근거로 함께 보입니다.' },
              { phase: '상담 후', desc: '상담 결과를 정리하고 학부모 리포트로 전달합니다.' },
            ].map((s) => (
              <RevealItem key={s.phase}>
                <div className={cn(mkt.card, 'p-6')}>
                  <p className="text-sm font-bold text-teal-700">{s.phase}</p>
                  <p className={cn(mkt.body, 'mt-2')}>{s.desc}</p>
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
        title="상담 준비부터 학부모 전달까지 연결해 보세요"
        description="수업 기록이 상담 브리핑이 되고, 상담 결과가 학부모에게 전달됩니다."
        primary={{ href: MARKETING_ROUTES.contact, label: '도입 문의하기', variant: 'accent' }}
        secondary={{ href: MARKETING_ROUTES.pricing, label: '요금 보기' }}
      />
    </>
  );
}
