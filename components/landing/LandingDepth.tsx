/** 랜딩 배경 depth 레이어 */
export function LandingHeroDepth() {
  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none landing-paper-texture"
        aria-hidden
      />
      <div
        className="absolute top-[8%] left-[55%] w-[min(520px,50vw)] h-[380px] rounded-full blur-[80px] opacity-50 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.14) 0%, transparent 68%)' }}
        aria-hidden
      />
      <div
        className="absolute top-[35%] right-[5%] w-64 h-64 rounded-full blur-[60px] opacity-40 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(254,243,199,0.45) 0%, transparent 70%)' }}
        aria-hidden
      />
      <div
        className="absolute bottom-[10%] left-[8%] w-72 h-72 rounded-full blur-[70px] opacity-35 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(30,58,95,0.1) 0%, transparent 72%)' }}
        aria-hidden
      />
      <div
        className="absolute top-[20%] right-[25%] w-40 h-40 rounded-full blur-3xl opacity-30 pointer-events-none bg-white/40"
        aria-hidden
      />
    </>
  );
}

export function LandingQuote({
  children,
  sub,
  className = '',
}: {
  children: React.ReactNode;
  sub?: string;
  className?: string;
}) {
  return (
    <div className={`landing-quote-block relative ${className}`}>
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-full bg-[#1e3a5f]/20" aria-hidden />
      <blockquote className="pl-6 sm:pl-8 text-[1.65rem] sm:text-[2.25rem] lg:text-[2.5rem] font-semibold text-[#1e3a5f] leading-[1.2] tracking-[-0.03em]">
        {children}
      </blockquote>
      {sub && (
        <p className="pl-6 sm:pl-8 mt-5 text-sm text-stone-400 font-light leading-relaxed max-w-md">
          {sub}
        </p>
      )}
    </div>
  );
}

export function LandingFlowSpine() {
  return (
    <div
      className="hidden xl:block fixed left-[max(1rem,calc(50%-36rem))] top-[420px] bottom-32 w-px z-0 pointer-events-none"
      aria-hidden
    >
      <div
        className="absolute inset-0 w-px"
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, rgba(30,58,95,0.15) 8%, rgba(59,130,246,0.35) 35%, rgba(30,58,95,0.25) 65%, rgba(217,119,6,0.2) 88%, transparent 100%)',
        }}
      />
    </div>
  );
}
