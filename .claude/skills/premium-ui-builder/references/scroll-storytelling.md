# Scroll Storytelling — 피닝 · 스크러빙 · 스태거 · 시네마틱 로더

원본 자료(Award-Winning Websites)의 GSAP ScrollTrigger + Lenis 패턴을 이 프로젝트에 이미 설치된 Framer Motion `useScroll`/`useTransform` + Lenis로 재작성한 패턴.

## 목차
1. [Lenis 스무스 스크롤 셋업](#lenis-스무스-스크롤-셋업)
2. [스크러빙 (스크롤 진행률 → 값 매핑)](#스크러빙)
3. [피닝 (섹션 고정)](#피닝)
4. [스태거 리빌](#스태거-리빌)
5. [시네마틱 인트로 로더](#시네마틱-인트로-로더)
6. [컬러 & 모션 일관성](#컬러--모션-일관성)

---

## Lenis 스무스 스크롤 셋업

`lenis`는 이미 설치되어 있다. `app/(marketing)/` 레이아웃에서만 초기화해 다른 셸(Staff ERP 등)의 스크롤 동작에 영향을 주지 않는다.

```tsx
// components/marketing/SmoothScrollProvider.tsx
'use client';
import { ReactLenis } from 'lenis/react'; // 또는 useEffect 내 new Lenis() 수동 초기화

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  return <ReactLenis root options={{ lerp: 0.1 }}>{children}</ReactLenis>;
}
```
`lenis/react`가 없는 버전이면 `useEffect`에서 `new Lenis()` + `requestAnimationFrame` 루프로 수동 초기화한다 (원본 자료의 GSAP ticker 연동은 불필요 — Framer Motion은 자체 rAF 루프를 쓰므로 Lenis의 scroll 이벤트만 페이지 스크롤에 반영하면 된다).

## 스크러빙

`useScroll`으로 특정 컨테이너의 스크롤 진행률(0~1)을 구독하고, `useTransform`으로 원하는 값에 매핑한다 — GSAP `scrub`와 동일한 개념이다.

```tsx
'use client';
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export function ScrubExample() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.6]);
  const y = useTransform(scrollYProgress, [0, 1], [0, -200]);

  return (
    <div ref={ref} style={{ height: '300vh' }}>
      <motion.h2 className="sticky top-0" style={{ scale, y }}>제목</motion.h2>
    </div>
  );
}
```

**이미지 시퀀스 스크롤줌(Apple 스타일)**: 프레임 배열을 canvas에 그리고, `scrollYProgress`를 프레임 인덱스로 매핑한다.

```tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import { useScroll, useTransform, useMotionValueEvent } from 'framer-motion';

export function ScrollyCanvas({ frameCount, framePath }: { frameCount: number; framePath: (i: number) => string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });
  const frameIndex = useTransform(scrollYProgress, [0, 1], [0, frameCount - 1]);

  useEffect(() => {
    imagesRef.current = Array.from({ length: frameCount }, (_, i) => {
      const img = new Image();
      img.src = framePath(i);
      return img;
    });
  }, [frameCount, framePath]);

  const render = (index: number) => {
    const ctx = canvasRef.current?.getContext('2d');
    const img = imagesRef.current[Math.round(index)];
    if (ctx && img?.complete) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.drawImage(img, 0, 0, ctx.canvas.width, ctx.canvas.height);
    }
  };

  useMotionValueEvent(frameIndex, 'change', (latest) => render(latest));

  return (
    <div ref={containerRef} style={{ height: '500vh' }}>
      <canvas ref={canvasRef} className="sticky top-0 h-screen w-full object-cover" width={1920} height={1080} />
    </div>
  );
}
```
`cinematic-asset-pipeline` 에이전트/스킬이 이 패턴을 실제 프레임 경로에 맞춰 구현한다. `frameCount`가 60~150 범위를 벗어나면 로딩 부담 또는 끊김을 사용자에게 알린다.

## 피닝

Framer Motion에는 GSAP `pin: true` 같은 내장 기능이 없다 — `sticky` + 부모의 `height: {N}vh`로 동일한 효과를 낸다 (위 `ScrollyCanvas` 패턴이 그 예). 섹션이 스크롤 N px 동안 고정되길 원하면 부모 높이를 `calc(100vh + Npx)`로 설정하고 내부를 `sticky top-0 h-screen`으로 감싼다.

## 스태거 리빌

```tsx
<motion.ul
  initial="hidden" whileInView="show" viewport={{ once: true }}
  variants={{ show: { transition: { staggerChildren: 0.15 } } }}
>
  {items.map((item) => (
    <motion.li key={item.id} variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}>
      {item.label}
    </motion.li>
  ))}
</motion.ul>
```

## 시네마틱 인트로 로더

```tsx
'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function IntroLoader({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min(100, Math.floor((elapsed / 2000) * 100))); // 최소 2초 유지
      if (elapsed >= 2000) { clearInterval(id); onDone(); }
    }, 80);
    return () => clearInterval(id);
  }, [onDone]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
        exit={{ y: '-100%' }} transition={{ duration: 1, ease: [0.83, 0, 0.17, 1] }}
      >
        <span>{progress}%</span>
      </motion.div>
    </AnimatePresence>
  );
}
```
로딩이 실제로 더 빨라도 최소 2~2.5초는 유지해 "성의 없어 보이는" 인상을 피한다 — 단, 로더는 반복 방문 사용자를 짜증나게 할 수 있으므로 세션당 1회(예: `sessionStorage` 플래그)만 노출하는 것을 권장한다.

## 컬러 & 모션 일관성

- 인터랙티브 요소(커서, 링크, 하이라이트)에 액센트 컬러 1개만 사용 — 두 번째 액센트 추가 금지.
- easing은 프로젝트 전역에서 하나로 통일한다:
  ```ts
  // lib/motion.ts
  export const EASE = [0.65, 0, 0.35, 1] as const; // power3.inOut 근사치
  export const DURATION = { fast: 0.3, base: 0.6, slow: 1.1 };
  ```
- 모션 속도는 요소 크기에 비례한다 — 작은 UI(버튼, 아이콘)는 200~300ms, 전체 페이지 전환은 800ms~1.2s.
