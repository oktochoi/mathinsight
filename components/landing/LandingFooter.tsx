import Link from 'next/link';
import { BRAND_NAME, BRAND_TAGLINE_SHORT } from '@/lib/brand';

const FOOTER_LINKS = {
  product: [
    { href: '#features', label: '기능' },
    { href: '#flow', label: '흐름' },
    { href: '#scene', label: '화면 예시' },
  ],
  account: [
    { href: '/auth', label: '로그인' },
    { href: '/signup', label: '회원가입' },
  ],
  portal: [
    { href: '/parent', label: '학부모 포털' },
    { href: '/student', label: '학생 포털' },
  ],
};

export function LandingFooter() {
  return (
    <footer className="relative mt-4 border-t border-indigo-100/50 bg-white/50 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 py-12 sm:py-14 pb-24 md:pb-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="soft-nav-mark" aria-hidden>
                <i className="ri-flow-chart text-lg" />
              </span>
              <span className="text-base font-bold text-indigo-950">{BRAND_NAME}</span>
            </div>
            <p className="mt-3 text-sm soft-body max-w-xs leading-relaxed">
              {BRAND_TAGLINE_SHORT}. 학부모는 24시간 포털 AI로 자녀 학습을 문의할 수 있습니다.
            </p>
          </div>

          <div>
            <p className="soft-label text-[10px] mb-3">소개</p>
            <ul className="space-y-2">
              {FOOTER_LINKS.product.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-sm text-slate-600 hover:text-indigo-600 transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="soft-label text-[10px] mb-3">시작하기</p>
            <ul className="space-y-2">
              {FOOTER_LINKS.account.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-slate-600 hover:text-indigo-600 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="soft-label text-[10px] mb-3">포털</p>
            <ul className="space-y-2">
              {FOOTER_LINKS.portal.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-slate-600 hover:text-indigo-600 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-indigo-100/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-500/90">
          <span>© {new Date().getFullYear()} {BRAND_NAME}</span>
          <span>학생 흐름 기반 교육 AI 워크플로우</span>
        </div>
      </div>
    </footer>
  );
}
