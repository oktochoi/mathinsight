import { PageHeroMinimal } from '@/components/marketing/ui/PageHero';
import { Section, SectionInner } from '@/components/marketing/ui/Section';
import { FadeIn } from '@/components/marketing/motion/FadeIn';
import { mkt } from '@/lib/marketing/ui';

export function LegalPageContent({ type }: { type: 'privacy' | 'terms' }) {
  const isPrivacy = type === 'privacy';
  return (
    <>
      <PageHeroMinimal
        eyebrow="Legal"
        title={isPrivacy ? '개인정보처리방침' : '이용약관'}
        description="정식 문서는 서비스 정식 출시 전 업데이트됩니다."
      />
      <Section>
        <SectionInner narrow>
          <FadeIn className={mkt.prose}>
            {isPrivacy ? (
              <>
                <p>
                  EduFlow는 학원·학생·학부모 개인정보를 학원 운영 및 상담 서비스 제공 목적으로 처리합니다.
                </p>
                <p>학원별 데이터는 분리 저장되며, AI 처리 시 해당 학원 데이터만 사용합니다.</p>
                <p>자세한 내용은 hello@eduflow.app 로 문의해 주세요.</p>
              </>
            ) : (
              <>
                <p>EduFlow 서비스 이용약관 초안입니다. 정식 약관은 출시 전 공지됩니다.</p>
                <p>무료 체험·유료 플랜·데이터 소유권 등은 도입 계약 시 안내드립니다.</p>
              </>
            )}
          </FadeIn>
        </SectionInner>
      </Section>
    </>
  );
}
