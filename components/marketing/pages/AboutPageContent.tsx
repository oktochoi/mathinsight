import { MARKETING_ROUTES } from '@/lib/marketing/siteStructure';
import { PageHeroMinimal } from '@/components/marketing/ui/PageHero';
import { Section, SectionInner } from '@/components/marketing/ui/Section';
import { CTASection } from '@/components/marketing/ui/CTASection';
import { FadeIn } from '@/components/marketing/motion/FadeIn';
import { mkt } from '@/lib/marketing/ui';

export function AboutPageContent() {
  return (
    <>
      <PageHeroMinimal
        eyebrow="About"
        title="ERP를 더 만들기 위해 시작하지 않았습니다"
        description="학생 기록이 흩어지고, 상담 준비가 반복되고, 재등록 위험을 놓치는 문제 — EduFlow는 여기서 출발합니다."
      />

      <Section>
        <SectionInner narrow>
          <FadeIn className={mkt.prose}>
            <p>
              EduFlow는 <strong className="text-zinc-900">학원 ERP가 아닙니다</strong>. 행정·정산·스케줄
              관리를 대체하려는 서비스가 아니라,{' '}
              <strong className="text-zinc-900">학생 기록이 상담 준비가 되는 AI 상담 운영 시스템</strong>
              입니다.
            </p>
            <p>
              원장과 강사는 이미 수업·시험·숙제·상담 데이터를 쌓고 있습니다. 문제는 그 기록이 상담 직전에
              다시 흩어져 모인다는 것, 위험 신호가 늦게 보인다는 것, 재등록 판단이 상담과 disconnected 되어
              있다는 것입니다.
            </p>
            <p>
              우리의 목표는 기능을 더 많이 만드는 것이 아니라,{' '}
              <strong className="text-zinc-900">원장이 학생을 더 잘 이해하고 더 좋은 상담을 할 수 있도록</strong>{' '}
              돕는 것입니다. 기록 → AI 분석 → 상담 준비 → 학부모 전달 → 재등록 — 이 Workflow가 자연스럽게
              이어지게 만드는 것이 EduFlow의 일입니다.
            </p>
          </FadeIn>
        </SectionInner>
      </Section>

      <CTASection
        title="EduFlow 철학이 맞는 학원과 함께합니다"
        primary={{ href: MARKETING_ROUTES.contact, label: '도입 문의', variant: 'accent' }}
        secondary={{ href: MARKETING_ROUTES.workflow, label: 'Workflow' }}
        variant="light"
      />
    </>
  );
}
