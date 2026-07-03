import Link from 'next/link';
import {
  BRAND_NAME,
  COMPANY_DOMAIN,
  COMPANY_LEGAL_NAME,
  CONTACT_EMAIL,
  SITE_URL,
} from '@/lib/brand';
import { MARKETING_ROUTES } from '@/lib/marketing/siteStructure';
import { PageHeroMinimal } from '@/components/marketing/ui/PageHero';
import { Section, SectionInner } from '@/components/marketing/ui/Section';
import { CTASection } from '@/components/marketing/ui/CTASection';
import { FadeIn } from '@/components/marketing/motion/FadeIn';
import { mkt } from '@/lib/marketing/ui';

const VALUES = [
  {
    title: '기록이 흩어지지 않게',
    desc: '수업·출결·숙제·성적·상담이 한 학생 타임라인으로 이어지도록 설계합니다.',
  },
  {
    title: 'AI는 보조, 원장이 주인공',
    desc: 'AI는 브리핑·초안·신호 탐지를 돕고, 상담과 재등록 판단은 학원에 남깁니다.',
  },
  {
    title: '학부모 신뢰를 지키는 소통',
    desc: '같은 맥락의 리포트·포털·채팅으로 학부모와의 대화가 끊기지 않게 합니다.',
  },
] as const;

export function AboutPageContent() {
  return (
    <>
      <PageHeroMinimal
        eyebrow="About"
        title="학원 운영의 다음 단계, AI 상담 인프라"
        description={`${BRAND_NAME}는 행정 ERP를 더 쌓기 위해 시작하지 않았습니다. 학생 기록이 상담 준비가 되고, 재등록까지 이어지는 Workflow를 만듭니다.`}
      />

      <Section>
        <SectionInner narrow>
          <FadeIn className={mkt.prose}>
            <h2>우리가 하는 일</h2>
            <p>
              {COMPANY_LEGAL_NAME}는 <strong className="text-zinc-900">{BRAND_NAME}</strong>(
              <a href={SITE_URL} className="text-sky-700 hover:underline">
                {COMPANY_DOMAIN}
              </a>
              )를 통해 학원·학원강사·학부모가 같은 데이터 위에서 소통할 수 있는 클라우드 서비스를
              제공합니다.
            </p>
            <p>
              원장과 강사는 이미 매일 수업·시험·숙제·상담 데이터를 만듭니다. 문제는 그 기록이 상담
              직전에 다시 흩어져 모인다는 것, 위험 신호가 늦게 보인다는 것, 재등록 판단이 상담과
              분리된다는 것입니다. {BRAND_NAME}는 이 간극을 Workflow와 AI로 메웁니다.
            </p>

            <h2>우리가 만들지 않는 것</h2>
            <p>
              {BRAND_NAME}는 <strong className="text-zinc-900">만능 학원 ERP가 아닙니다</strong>.
              급여·회계 전체를 대체하거나, 모든 행정을 한 화면에 우겨 넣는 것이 목표가 아닙니다.
              우리는 <strong className="text-zinc-900">상담·재등록·학부모 소통</strong>에 집중합니다.
            </p>

            <h2>핵심 가치</h2>
            <ul>
              {VALUES.map((v) => (
                <li key={v.title}>
                  <strong>{v.title}</strong> — {v.desc}
                </li>
              ))}
            </ul>

            <h2>회사 정보</h2>
            <div className="not-prose overflow-hidden rounded-xl border border-slate-200 text-sm">
              <table className="w-full">
                <tbody className="divide-y divide-slate-100">
                  {[
                    ['상호', COMPANY_LEGAL_NAME],
                    ['서비스명', BRAND_NAME],
                    ['공식 웹사이트', COMPANY_DOMAIN],
                    ['문의 메일', CONTACT_EMAIL],
                    ['주요 서비스', '학원 운영 SaaS · AI 상담 · 학부모 포털'],
                  ].map(([label, value]) => (
                    <tr key={label} className="bg-white">
                      <th className="w-36 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-700">
                        {label}
                      </th>
                      <td className="px-4 py-3 text-slate-600">
                        {label === '문의 메일' ? (
                          <a href={`mailto:${CONTACT_EMAIL}`} className="text-sky-700 hover:underline">
                            {value}
                          </a>
                        ) : label === '공식 웹사이트' ? (
                          <a href={SITE_URL} className="text-sky-700 hover:underline">
                            {value}
                          </a>
                        ) : (
                          value
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-sm text-slate-500">
              도입·파일럿·제휴 문의는{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-sky-700 hover:underline">
                {CONTACT_EMAIL}
              </a>
              또는{' '}
              <Link href={MARKETING_ROUTES.contact} className="text-sky-700 hover:underline">
                도입 문의 페이지
              </Link>
              를 이용해 주세요.
            </p>
          </FadeIn>
        </SectionInner>
      </Section>

      <CTASection
        title="EduFlow와 함께할 학원을 찾습니다"
        primary={{ href: MARKETING_ROUTES.contact, label: '도입 문의', variant: 'accent' }}
        secondary={{ href: MARKETING_ROUTES.product, label: '기능 보기' }}
        variant="light"
      />
    </>
  );
}
