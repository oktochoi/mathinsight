import { MARKETING_ROUTES, WORKFLOW_STEPS } from '@/lib/marketing/siteStructure';
import { PageHeroMinimal } from '@/components/marketing/ui/PageHero';
import { Section, SectionInner } from '@/components/marketing/ui/Section';
import { SectionHeader } from '@/components/marketing/ui/SectionHeader';
import { ScreenshotPlaceholder } from '@/components/marketing/ui/ScreenshotPlaceholder';
import {
  WorkflowTimeline,
  WorkflowStoryBlock,
  WorkflowStoryLine,
} from '@/components/marketing/ui/WorkflowTimeline';
import { CTASection } from '@/components/marketing/ui/CTASection';
import { FadeIn } from '@/components/marketing/motion/FadeIn';

export function WorkflowPageContent() {
  return (
    <>
      <PageHeroMinimal
        eyebrow="Workflow"
        title={
          <>
            기록이 상담으로,
            <br />
            상담이 <span className="text-emerald-700">재등록</span>으로
          </>
        }
        description="ERP 기능 소개가 아닙니다. 한 학원의 하루가 상담·재등록으로 이어지는 스토리입니다."
        primary={{ href: MARKETING_ROUTES.demo, label: '흐름 체험하기' }}
        secondary={{ href: MARKETING_ROUTES.ai, label: 'AI 역할 보기' }}
      />

      <Section>
        <SectionInner>
          <div className="grid gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
            <FadeIn>
              <SectionHeader
                eyebrow="Process"
                title="9단계 상담 운영 흐름"
                description="수업 기록부터 재등록 관리까지, 끊기지 않는 하나의 Workflow."
              />
              <WorkflowTimeline steps={WORKFLOW_STEPS} />
            </FadeIn>
            <FadeIn delay={0.1}>
              <ScreenshotPlaceholder screenshotKey="counseling" />
            </FadeIn>
          </div>
        </SectionInner>
      </Section>

      <Section muted>
        <SectionInner narrow>
          <SectionHeader eyebrow="Story" title="박서연 학생의 한 주" align="center" />
          <WorkflowStoryBlock>
            <WorkflowStoryLine>
              <strong className="text-zinc-900">월요일</strong> — 중2 A반 수업에서 출결·숙제·시험 점수를 1분
              만에 기록하고 Lesson을 마감합니다.
            </WorkflowStoryLine>
            <WorkflowStoryLine>
              <strong className="text-zinc-900">수요일</strong> — AI가 80→68 점수 하락과 숙제 미제출을 연결해
              Risk Snapshot을 갱신합니다.
            </WorkflowStoryLine>
            <WorkflowStoryLine>
              <strong className="text-zinc-900">목요일</strong> — 원장은 오늘 상담 큐에서 박서연을 보고, AI
              상담 카드 초안을 검토합니다.
            </WorkflowStoryLine>
            <WorkflowStoryLine>
              <strong className="text-zinc-900">금요일</strong> — 학부모 상담 후 Parent Report를 보내고,
              재등록 위험도를 업데이트합니다.
            </WorkflowStoryLine>
          </WorkflowStoryBlock>
          <p className="mt-8 text-center text-sm font-medium text-emerald-800">
            이 흐름이 반복될수록, 상담 준비 시간은 줄고 재등록 판단은 근거를 갖게 됩니다.
          </p>
        </SectionInner>
      </Section>

      <CTASection
        title="Workflow를 Demo에서 직접 확인하세요"
        primary={{ href: MARKETING_ROUTES.demo, label: 'Demo 시작', variant: 'accent' }}
        secondary={{ href: MARKETING_ROUTES.contact, label: '도입 문의' }}
        variant="light"
      />
    </>
  );
}
