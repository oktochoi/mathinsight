import Link from 'next/link';
import { MARKETING_ROUTES } from '@/lib/marketing/siteStructure';
import { cn } from '@/lib/cn';
import { PageHeroMinimal } from '@/components/marketing/ui/PageHero';
import { Section, SectionInner } from '@/components/marketing/ui/Section';
import { Button } from '@/components/marketing/ui/Button';
import { mkt } from '@/lib/marketing/ui';

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={cn('flex flex-col gap-1.5', full && mkt.fieldFull)}>
      <span className={mkt.fieldLabel}>{label}</span>
      {children}
    </label>
  );
}

export function ContactPageContent() {
  return (
    <>
      <PageHeroMinimal
        eyebrow="Contact"
        title="도입·데모·Enterprise 문의"
        description="영업일 기준 1–2일 내 회신을 목표로 합니다."
      />

      <Section>
        <SectionInner>
          <div className={mkt.contactGrid}>
            <div>
              <h2 className={mkt.sectionTitle}>연락처</h2>
              <a href="mailto:hello@eduflow.app" className={mkt.contactEmail}>
                hello@eduflow.app
              </a>
              <p className={mkt.contactMeta}>평일 09:00 – 18:00 (KST)</p>
              <hr className={mkt.contactDivider} />
              <p className={mkt.contactMeta}>
                <strong className="text-zinc-900">(주)에듀플로우</strong>
                <br />
                서울 · 파일럿 운영 중
              </p>
              <Link href={MARKETING_ROUTES.demo} className={cn(mkt.link, 'mt-4 inline-block')}>
                Demo 먼저 보기 →
              </Link>
            </div>

            <form className={mkt.contactForm} action="mailto:hello@eduflow.app" encType="text/plain">
              <Field label="이름">
                <input type="text" name="name" required placeholder="홍길동" className={mkt.fieldInput} />
              </Field>
              <Field label="이메일">
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="you@academy.kr"
                  className={mkt.fieldInput}
                />
              </Field>
              <Field label="학원명">
                <input type="text" name="academy" placeholder="OO수학학원" className={mkt.fieldInput} />
              </Field>
              <Field label="문의 유형">
                <select name="type" defaultValue="trial" className={mkt.fieldInput}>
                  <option value="trial">무료 체험 / 데모</option>
                  <option value="enterprise">Enterprise</option>
                  <option value="pilot">파일럿 참여</option>
                  <option value="other">기타</option>
                </select>
              </Field>
              <Field label="문의 내용" full>
                <textarea
                  name="body"
                  rows={5}
                  required
                  placeholder="학생 수, 현재 사용 도구, 상담 운영 방식"
                  className={mkt.fieldInput}
                />
              </Field>
              <Button type="submit" variant="primary" className={cn(mkt.fieldFull, 'w-full cursor-pointer')}>
                문의하기
              </Button>
            </form>
          </div>
        </SectionInner>
      </Section>
    </>
  );
}
