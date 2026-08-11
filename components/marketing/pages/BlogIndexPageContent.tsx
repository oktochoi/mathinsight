'use client';

import Link from 'next/link';
import { PageHeroMinimal } from '@/components/marketing/ui/PageHero';
import { Section, SectionInner } from '@/components/marketing/ui/Section';
import { Reveal, RevealItem } from '@/components/marketing/motion/Reveal';
import { cn } from '@/lib/cn';
import { mkt } from '@/lib/marketing/ui';
import { MARKETING_ROUTES } from '@/lib/marketing/siteStructure';
import { getAllBlogPosts } from '@/lib/marketing/blogPosts';

export function BlogIndexPageContent() {
  const posts = getAllBlogPosts();

  return (
    <>
      <PageHeroMinimal
        eyebrow="Blog"
        title="학원 운영 블로그"
        description="상담, 학생 관리, 재등록 등 학원 운영에 필요한 실전 가이드를 제공합니다."
      />

      <Section>
        <SectionInner>
          <Reveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <RevealItem key={post.slug}>
                <Link
                  href={`${MARKETING_ROUTES.blog}/${post.slug}`}
                  className={cn(mkt.card, mkt.cardHover, 'flex flex-col p-6')}
                >
                  <p className={mkt.muted}>{post.date}</p>
                  <h2 className={cn(mkt.h3, 'mt-2')}>{post.title}</h2>
                  <p className={cn(mkt.body, 'mt-2 flex-1')}>{post.excerpt}</p>
                  <span className="mt-4 text-sm font-semibold text-teal-700">
                    읽기 &rarr;
                  </span>
                </Link>
              </RevealItem>
            ))}
          </Reveal>
        </SectionInner>
      </Section>
    </>
  );
}
