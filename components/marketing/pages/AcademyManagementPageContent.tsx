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
    title: '출결 관리',
    desc: '수업별 출결을 기록하고, 결석·지각 패턴을 자동으로 파악합니다.',
  },
  {
    title: '숙제·성적 기록',
    desc: '숙제 제출 여부와 시험 점수를 수업 단위로 입력합니다. 변화 추이가 자동으로 쌓입니다.',
  },
  {
    title: '시간표 관리',
    desc: '반별·강사별 시간표를 편성하고 오늘 수업을 한눈에 확인합니다.',
  },
  {
    title: '운영 대시보드',
    desc: '오늘 수업, 미마감 기록, 상담 대기 학생을 출근 후 바로 파악합니다.',
  },
  {
    title: '강사별 권한',
    desc: '원장·강사·상담 담당 역할별로 접근 범위를 설정합니다.',
  },
];

const FLOW_STEPS = [
  { step: '1', title: '수업 입력', desc: '오늘 수업에서 출결·숙제·점수·메모를 기록합니다.' },
  { step: '2', title: '기록 축적', desc: '학생별 타임라인에 수업 기록이 자동으로 쌓입니다.' },
  { step: '3', title: '상담 준비', desc: '쌓인 기록을 바탕으로 상담 전 브리핑이 만들어집니다.' },
  { step: '4', title: '학부모 전달', desc: '상담 결과를 리포트로 정리해 학부모에게 전달합니다.' },
];

const RELATED = [
  { href: MARKETING_ROUTES.academyConsulting, label: '학원 상담 프로그램', desc: '상담 기록과 학부모 상담 관리' },
  { href: MARKETING_ROUTES.studentManagement, label: '학생 관리 프로그램', desc: '학생별 기록·분석·상담 연결' },
  { href: MARKETING_ROUTES.retention, label: '재등록 관리', desc: '이탈 신호 감지와 상담 연결' },
];

export function AcademyManagementPageContent() {
  return (
    <>
      <PageHero
        eyebrow="Academy Management"
        title="학원 관리, 엑셀과 여러 도구에 흩어진 기록을 하나로"
        description="출결은 엑셀, 성적은 수기, 상담은 메모장 — 학원 운영 기록이 여러 곳에 흩어져 있으면 한 학생을 파악하는 데 시간이 걸립니다."
        primary={{ href: MARKETING_ROUTES.contact, label: '도입 문의하기' }}
        secondary={{ href: MARKETING_ROUTES.product, label: '기능 보기' }}
        tone="mint"
      />

      <Section>
        <SectionInner>
          <FadeIn>
            <p className={mkt.eyebrow}>Problem</p>
            <h2 className={cn(mkt.h2, 'mt-2')}>흩어진 기록, 반복되는 정리 작업</h2>
            <p className={cn(mkt.lead, 'mt-4 max-w-2xl')}>
              학생 한 명의 출결, 숙제, 성적, 상담 기록이 엑셀, 노트, 메신저에 나뉘어 있으면
              상담 전마다 자료를 다시 모아야 합니다. 강사가 바뀌면 인수인계도 어렵습니다.
            </p>
          </FadeIn>
        </SectionInner>
      </Section>

      <Section muted>
        <SectionInner>
          <FadeIn>
            <p className={mkt.eyebrow}>Solution</p>
            <h2 className={cn(mkt.h2, 'mt-2')}>기록이 쌓이면 상담 준비까지 이어집니다</h2>
            <p className={cn(mkt.lead, 'mt-4 max-w-2xl')}>
              EduFlow는 수업·출결·숙제·성적·상담을 하나의 프로그램에서 기록합니다.
              기록이 쌓이면 상담 준비와 학부모 전달까지 자연스럽게 이어집니다.
            </p>
          </FadeIn>
        </SectionInner>
      </Section>

      <Section>
        <SectionInner>
          <FadeIn>
            <h2 className={mkt.h2}>핵심 기능</h2>
          </FadeIn>
          <Reveal className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
            <h2 className={mkt.h2}>사용 흐름</h2>
            <p className={cn(mkt.lead, 'mt-3 max-w-2xl')}>
              매일 수업을 입력하면 기록이 쌓이고, 상담과 학부모 소통으로 이어집니다.
            </p>
          </FadeIn>
          <Reveal className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FLOW_STEPS.map((s) => (
              <RevealItem key={s.step}>
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                    {s.step}
                  </span>
                  <div>
                    <p className="font-bold text-slate-900">{s.title}</p>
                    <p className={cn(mkt.body, 'mt-1')}>{s.desc}</p>
                  </div>
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
        title="학원 관리, 하나로 연결해 보세요"
        description="흩어진 기록을 모으고, 상담 준비까지 이어지는 흐름을 만들어 보세요."
        primary={{ href: MARKETING_ROUTES.contact, label: '도입 문의하기', variant: 'accent' }}
        secondary={{ href: MARKETING_ROUTES.pricing, label: '요금 보기' }}
      />
    </>
  );
}
