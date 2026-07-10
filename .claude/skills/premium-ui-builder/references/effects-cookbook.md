# Effects Cookbook — 커서 · 메뉴 · 캐러셀 · 마이크로 인터랙션 · 타이포그래피 · Shape Blur

원본 자료(10K Website Elements)의 코드를 이 프로젝트 스택(Next.js App Router, Framer Motion, Tailwind)에 맞게 재작성한 패턴 모음.

## 목차
1. [커서 이펙트](#커서-이펙트)
2. [메뉴 이펙트](#메뉴-이펙트)
3. [무한 캐러셀](#무한-캐러셀)
4. [마이크로 인터랙션](#마이크로-인터랙션)
5. [타이포그래피 시스템](#타이포그래피-시스템)
6. [Shape Blur](#shape-blur)

---

## 커서 이펙트

`app/(marketing)/layout.tsx` 하위에서만 마운트되는 클라이언트 컴포넌트로 구현한다 (Staff/포털 셸에는 마운트하지 않는다).

```tsx
// components/marketing/CustomCursor.tsx
'use client';
import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export function CustomCursor() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { damping: 25, stiffness: 300 });
  const springY = useSpring(y, { damping: 25, stiffness: 300 });
  const scale = useMotionValue(1);

  useEffect(() => {
    const move = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY); };
    const onEnter = () => scale.set(2);
    const onLeave = () => scale.set(1);
    document.addEventListener('mousemove', move);
    document.querySelectorAll('a, button').forEach((el) => {
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
    });
    return () => document.removeEventListener('mousemove', move);
  }, [x, y, scale]);

  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-[9999] h-6 w-6 rounded-full bg-primary/60"
      style={{ x: springX, y: springY, scale, translateX: '-50%', translateY: '-50%' }}
    />
  );
}
```
`body { cursor: none }`은 `(marketing)` 레이아웃 스코프의 CSS 모듈/클래스로만 적용 — 다른 셸에 영향 주지 않도록 전역 globals.css에 직접 넣지 않는다.

## 메뉴 이펙트

풀스크린 오버레이 메뉴 — `AnimatePresence` + stagger:

```tsx
'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

const links = [{ href: '/', label: '홈' }, { href: '/product', label: '제품' }, { href: '/contact', label: '문의' }];

export function FullscreenMenu() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>메뉴</button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.ul
              initial="hidden" animate="show"
              variants={{ show: { transition: { staggerChildren: 0.08 } } }}
            >
              {links.map((l) => (
                <motion.li key={l.href}
                  variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                >
                  <a href={l.href} onClick={() => setOpen(false)}>{l.label}</a>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

Sticky + hide-on-scroll 헤더는 Framer Motion `useScroll`으로 스크롤 방향을 감지해 `y` 값을 토글한다 (구현 시 `scroll-storytelling.md`의 `useScroll` 패턴 참조).

## 무한 캐러셀

순수 CSS만으로 충분하다 — 별도 라이브러리 불필요:

```css
.marquee { overflow: hidden; white-space: nowrap; }
.marquee-track { display: inline-flex; gap: 48px; animation: marquee-scroll 20s linear infinite; }
.marquee:hover .marquee-track { animation-play-state: paused; }
@keyframes marquee-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
```
```tsx
export function LogoMarquee({ items }: { items: string[] }) {
  return (
    <div className="marquee">
      <div className="marquee-track">
        {[...items, ...items].map((label, i) => <span key={i}>{label}</span>)}
      </div>
    </div>
  );
}
```
카드형(썸네일 포함) 캐러셀이 필요하면 이미 설치된 `embla-carousel-react`를 우선 사용한다 — `autoScroll` 플러그인으로 자동 스크롤 + hover pause를 구현할 수 있어 새 의존성이 필요 없다.

## 마이크로 인터랙션

스크롤 리빌은 Framer Motion `whileInView`로 IntersectionObserver 없이 구현된다:

```tsx
<motion.div
  initial={{ opacity: 0, y: 28 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.15 }}
  transition={{ duration: 0.6, ease: 'easeOut' }}
>
  {children}
</motion.div>
```

버튼 hover/focus는 Tailwind만으로 충분: `transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary`.

로딩 스켈레톤은 Tailwind `animate-pulse` + 회색 블록. 토스트는 이미 설치된 `sonner`의 `toast()`를 그대로 사용 — 별도 구현 불필요.

## 타이포그래피 시스템

`app/globals.css`의 `:root`에 fluid type scale 추가 (기존 Tailwind 설정과 충돌하지 않도록 CSS 변수로 관리):

```css
:root {
  --text-sm: clamp(0.8rem, 1.5vw, 0.9rem);
  --text-base: clamp(1rem, 2vw, 1.1rem);
  --text-lg: clamp(1.2rem, 2.5vw, 1.4rem);
  --text-xl: clamp(1.5rem, 3vw, 2rem);
  --text-2xl: clamp(2rem, 5vw, 3.5rem);
  --text-3xl: clamp(2.5rem, 7vw, 5rem);
}
```
`tailwind.config.js`의 `extend.fontSize`에 이 변수들을 등록하면 `text-fluid-3xl` 같은 유틸리티로 사용 가능. 폰트 페어링은 이미 프로젝트에 적용된 폰트가 있으면 그것을 우선 확장하고, 새 폰트 도입은 브랜드 가이드 확인 후 진행한다(임의로 Clash Display 등 원본 예시 폰트를 강제 적용하지 않는다).

## Shape Blur

```tsx
'use client';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect } from 'react';

export function CursorBlur() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { damping: 30, stiffness: 60 }); // 낮은 stiffness = 더 긴 lag
  const springY = useSpring(y, { damping: 30, stiffness: 60 });

  useEffect(() => {
    const move = (e: MouseEvent) => { x.set(e.clientX - 210); y.set(e.clientY - 210); };
    document.addEventListener('mousemove', move);
    return () => document.removeEventListener('mousemove', move);
  }, [x, y]);

  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-0 h-[420px] w-[420px] rounded-full blur-[60px]"
      style={{ x: springX, y: springY, background: 'radial-gradient(circle, rgba(123,94,167,0.55), transparent 70%)' }}
    />
  );
}
```
모바일(마우스 없음)에서는 `useEffect` 내 `matchMedia('(pointer: fine)')`로 감지해 정적 버전(고정 위치 blob)으로 폴백한다.
