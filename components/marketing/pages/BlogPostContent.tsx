'use client';

import Link from 'next/link';
import { Section, SectionInner } from '@/components/marketing/ui/Section';
import { FadeIn } from '@/components/marketing/motion/FadeIn';
import { cn } from '@/lib/cn';
import { mkt } from '@/lib/marketing/ui';
import { MARKETING_ROUTES } from '@/lib/marketing/siteStructure';
import type { BlogPost } from '@/lib/marketing/blogPosts';

export function BlogPostContent({ post }: { post: BlogPost }) {
  const paragraphs = post.content.split('\n\n').filter(Boolean);

  return (
    <>
      <section className="border-b border-slate-200 bg-gradient-to-br from-emerald-50 to-teal-100 py-12 md:py-16">
        <div className={mkt.container}>
          <FadeIn>
            <Link
              href={MARKETING_ROUTES.blog}
              className="text-sm font-semibold text-teal-700 hover:underline"
            >
              &larr; 블로그 목록
            </Link>
            <p className={cn(mkt.muted, 'mt-4')}>{post.date}</p>
            <h1 className={cn(mkt.h1, 'mt-2')}>{post.title}</h1>
            <p className={cn(mkt.lead, 'mt-4 max-w-2xl')}>{post.excerpt}</p>
          </FadeIn>
        </div>
      </section>

      <Section>
        <SectionInner narrow>
          <FadeIn>
            <div className={mkt.prose}>
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}

              {post.relatedPages.length > 0 && (
                <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-6">
                  <p className="font-bold text-slate-900">관련 페이지</p>
                  <ul className="mt-3 space-y-2">
                    {post.relatedPages.map((rp) => (
                      <li key={rp.href}>
                        <Link href={rp.href} className={mkt.link}>
                          {rp.label} &rarr;
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </FadeIn>
        </SectionInner>
      </Section>
    </>
  );
}
