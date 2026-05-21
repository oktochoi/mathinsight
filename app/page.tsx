'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleMouse = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouse, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouse);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden selection:bg-blue-500/20">
      {/* Navigation */}
      <nav 
        className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 lg:px-12 transition-all duration-500"
        style={{ 
          background: scrollY > 50 ? 'rgba(255,255,255,0.85)' : 'transparent', 
          backdropFilter: scrollY > 50 ? 'blur(20px) saturate(1.5)' : 'none', 
          borderBottom: scrollY > 50 ? '1px solid rgba(226,232,240,0.5)' : '1px solid transparent'
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
            <i className="ri-bar-chart-box-fill text-white text-sm"></i>
          </div>
          <span className="text-[#0f172a] font-bold text-lg tracking-tight">MathInsight</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#story" className="text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors hidden md:block">Why</a>
          <a href="#features" className="text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors hidden md:block">Features</a>
          <a href="#trust" className="text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors hidden md:block">Trust</a>
          <Link href="/login">
            <button className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-xl hover:shadow-blue-900/20 cursor-pointer" style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
              로그인
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-32 lg:pt-40 lg:pb-48 px-6 lg:px-12 overflow-hidden" style={{ background: 'linear-gradient(180deg, #020617 0%, #0f172a 30%, #1e293b 70%, #f8fafc 100%)' }}>
        {/* Animated gradient orbs following mouse */}
        <div 
          className="absolute w-[800px] h-[800px] rounded-full opacity-20 blur-3xl pointer-events-none transition-transform duration-700 ease-out"
          style={{ 
            background: 'radial-gradient(circle, #3b82f6, transparent 70%)',
            left: mousePos.x - 400,
            top: mousePos.y - 400,
          }}
        ></div>
        <div className="absolute top-[20%] left-[10%] w-[600px] h-[600px] rounded-full opacity-[0.07] blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #60a5fa, transparent 70%)' }}></div>
        <div className="absolute bottom-[10%] right-[5%] w-[500px] h-[500px] rounded-full opacity-[0.05] blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #93c5fd, transparent 70%)' }}></div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center relative z-10">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 border border-blue-500/20" style={{ background: 'rgba(59,130,246,0.1)' }}>
              <i className="ri-sparkling-2-line text-blue-400 text-sm"></i>
              <span className="text-blue-300 text-xs font-semibold tracking-wider uppercase">Academy Intelligence Platform</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-7 tracking-tight">
              학생 기록을,<br />
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #60a5fa, #93c5fd, #dbeafe)' }}>학부모가 신뢰하는<br />상담 데이터로.</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-lg">
              수학학원 원장님의 야근을 줄여드립니다. <br />
              5초의 수업 기록 입력이 자동으로 구조화되어,<br />
              데이터 기반의 프리미엄 학부모 상담을 완성합니다.
            </p>
            <div className="flex items-center gap-4 mb-12">
              <Link href="/login">
                <button className="px-8 py-4 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-2xl hover:shadow-blue-600/20 cursor-pointer flex items-center gap-2 group" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
                  <span>14일 무료 시작</span>
                  <i className="ri-arrow-right-line transition-transform group-hover:translate-x-1"></i>
                </button>
              </Link>
              <a href="#story" className="px-8 py-4 rounded-xl text-sm font-semibold text-slate-300 border border-slate-700 transition-all hover:border-slate-500 hover:text-white cursor-pointer" style={{ background: 'rgba(255,255,255,0.05)' }}>
                자세히 알아보기
              </a>
            </div>

            <div className="flex items-center gap-8">
              <div>
                <div className="text-3xl font-bold text-white tracking-tight">2,400+</div>
                <div className="text-xs text-slate-500 mt-1 font-medium">관리 중인 학생</div>
              </div>
              <div className="w-px h-10 bg-slate-700/50"></div>
              <div>
                <div className="text-3xl font-bold text-white tracking-tight">340+</div>
                <div className="text-xs text-slate-500 mt-1 font-medium">연동 학원</div>
              </div>
              <div className="w-px h-10 bg-slate-700/50"></div>
              <div>
                <div className="text-3xl font-bold text-white tracking-tight">98.2%</div>
                <div className="text-xs text-slate-500 mt-1 font-medium">학부모 만족도</div>
              </div>
            </div>
          </div>

          {/* Dashboard Mockup */}
          <div className="relative hidden lg:block h-[540px]">
            {/* Main card */}
            <div 
              className="absolute top-0 left-4 w-[420px] rounded-2xl p-6 shadow-2xl border border-white/10 backdrop-blur-xl"
              style={{ background: 'rgba(15, 23, 42, 0.85)' }}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">주간 성적 추이</p>
                  <p className="text-sm font-bold text-slate-100 mt-1">중3A 반 평균</p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <i className="ri-arrow-up-line text-green-400 text-xs"></i>
                  <span className="text-xs font-bold text-green-400">+4.2</span>
                </div>
              </div>
              <div className="flex items-end gap-[6px] h-28 px-1">
                {[65, 72, 68, 78, 82, 80, 88].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t-sm relative group">
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 px-1.5 py-0.5 rounded">{h}</div>
                    <div className="w-full rounded-t-sm transition-all duration-500" style={{ height: `${h}%`, background: i === 6 ? 'linear-gradient(180deg, #3b82f6, #1d4ed8)' : 'rgba(148, 163, 184, 0.2)' }}></div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-3 px-1">
                {['1주','2주','3주','4주','5주','6주','7주'].map((w) => (
                  <span key={w} className="text-[11px] text-slate-500 font-medium">{w}</span>
                ))}
              </div>
            </div>

            {/* Alert Card */}
            <div 
              className="absolute top-[260px] right-0 w-[280px] rounded-xl p-5 shadow-2xl border border-white/10 backdrop-blur-xl"
              style={{ background: 'rgba(15, 23, 42, 0.9)' }}
            >
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)' }}>
                  <i className="ri-error-warning-line text-red-400 text-xs"></i>
                </div>
                <span className="text-xs font-bold text-slate-200">상담 권장 알림</span>
                <span className="text-[10px] text-slate-500 ml-auto">2건</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.12)' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg, #1e3a5f, #0f172a)' }}>김</div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">김민준 학생</p>
                    <p className="text-[11px] text-red-400">성적 하락 · 2회 연속 미제출</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.12)' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg, #1e3a5f, #0f172a)' }}>박</div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">박서연 학생</p>
                    <p className="text-[11px] text-amber-400">숙제 제출률 40% 하락</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Report Card */}
            <div 
              className="absolute bottom-0 left-20 w-[320px] rounded-xl p-5 shadow-2xl border border-white/10 backdrop-blur-xl"
              style={{ background: 'rgba(15, 23, 42, 0.88)' }}
            >
              <div className="flex items-center gap-2.5 mb-4">
                <i className="ri-file-chart-line text-blue-400 text-sm"></i>
                <span className="text-xs font-bold text-slate-200">AI 상담 리포트</span>
                <span className="text-[10px] text-slate-500 ml-auto">방금 생성됨</span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-2 rounded-full w-full" style={{ background: 'rgba(148,163,184,0.15)' }}>
                  <div className="h-full rounded-full w-[85%]" style={{ background: 'linear-gradient(90deg, #3b82f6, #60a5fa)' }}></div>
                </div>
                <div className="h-2 rounded-full w-full" style={{ background: 'rgba(148,163,184,0.15)' }}>
                  <div className="h-full rounded-full w-[60%]" style={{ background: 'linear-gradient(90deg, #3b82f6, #60a5fa)' }}></div>
                </div>
                <div className="h-2 rounded-full w-full" style={{ background: 'rgba(148,163,184,0.15)' }}>
                  <div className="h-full rounded-full w-[75%]" style={{ background: 'linear-gradient(90deg, #3b82f6, #60a5fa)' }}></div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] px-2.5 py-1 rounded-md font-medium text-blue-300 border border-blue-500/20" style={{ background: 'rgba(59,130,246,0.1)' }}>학부모 친화적</span>
                <span className="text-[11px] px-2.5 py-1 rounded-md font-medium text-emerald-300 border border-emerald-500/20" style={{ background: 'rgba(34,197,94,0.1)' }}>客観적 분석</span>
              </div>
            </div>

            {/* Floating badge */}
            <div 
              className="absolute top-[180px] right-[60px] px-3 py-2 rounded-lg shadow-lg border border-white/10 backdrop-blur-md"
              style={{ background: 'rgba(15, 23, 42, 0.9)' }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-[11px] text-slate-300 font-medium">실시간 동기화 중</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section - Why academy operators struggle */}
      <section id="story" className="py-32 px-6 lg:px-12 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border border-blue-500/10" style={{ background: 'rgba(59,130,246,0.04)' }}>
              <i className="ri-heart-pulse-line text-blue-500 text-sm"></i>
              <span className="text-blue-600 text-xs font-semibold tracking-wider uppercase">Why MathInsight</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-5 tracking-tight">
              원장님은 매일 상담 준비하느라<br />
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #1e3a5f, #3b82f6)' }}>늦은 밤을 보내고 계십니다.</span>
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">
              학생들의 학습 기록은 쌓이지만, 상담 때마다 기억을 더듬고 있습니다. <br />
              학부모는 전문적인 관리를 기대하는데, 정작 데이터는 흩어져 있습니다.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: 'ri-stack-line',
                title: '흩어진 기록',
                desc: '숙제 점수, 테스트 결과, 출결 기록이 각기 다른 수첩과 메모장에. 상담 직전에 이걸 다 모으는 건 매번 전쟁입니다.',
                color: '#ef4444',
                bg: 'rgba(239,68,68,0.04)',
                border: 'rgba(239,68,68,0.08)'
              },
              {
                icon: 'ri-chat-1-line',
                title: '감에 의존하는 상담',
                desc: '"요즘 좀 안 좋은 것 같아요" — 구체적 근거 없는 상담은 학부모의 신뢰를 약화시킵니다. 데이터가 말해야 합니다.',
                color: '#f59e0b',
                bg: 'rgba(245,158,11,0.04)',
                border: 'rgba(245,158,11,0.08)'
              },
              {
                icon: 'ri-time-line',
                title: '반복되는 야근',
                desc: '주 5회 수업, 60명의 학생 기록을 하나하나 정리하며 리포트를 만드는 시간. 원장님의 시간은 더 가치 있는 곳에 쓰여야 합니다.',
                color: '#7c3aed',
                bg: 'rgba(124,58,237,0.04)',
                border: 'rgba(124,58,237,0.08)'
              },
            ].map((item, i) => (
              <div 
                key={i} 
                className="group rounded-2xl p-8 transition-all duration-500 hover:shadow-xl hover:-translate-y-1 border"
                style={{ 
                  background: 'linear-gradient(135deg, #ffffff, #f8fafc)', 
                  borderColor: 'rgba(226,232,240,0.8)' 
                }}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-300" style={{ background: item.bg, border: `1px solid ${item.border}` }}>
                  <i className={item.icon} style={{ color: item.color, fontSize: '1.5rem' }}></i>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Flow Section - How it works */}
      <section className="py-32 px-6 lg:px-12 relative" style={{ background: 'linear-gradient(180deg, #f8fafc, #ffffff)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border border-emerald-500/10" style={{ background: 'rgba(34,197,94,0.04)' }}>
              <i className="ri-route-line text-emerald-500 text-sm"></i>
              <span className="text-emerald-600 text-xs font-semibold tracking-wider uppercase">How It Works</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-5 tracking-tight">
              5초의 기록이,<br />
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #1e3a5f, #3b82f6)' }}>프리미엄 상담으로 변합니다.</span>
            </h2>
          </div>

          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-16 left-[12%] right-[12%] h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #3b82f6, #60a5fa, #93c5fd, #3b82f6, transparent)' }}></div>

            <div className="grid md:grid-cols-5 gap-8">
              {[
                { step: '01', icon: 'ri-edit-line', title: '수업 기록', desc: '출결 · 숙제 · 테스트 5초 입력' },
                { step: '02', icon: 'ri-database-2-line', title: '자동 구조화', desc: 'AI가 패턴 분석 및 추이 계산' },
                { step: '03', icon: 'ri-alert-line', title: '이상 징후 감지', desc: '성적 하락·미제출 자동 알림' },
                { step: '04', icon: 'ri-file-chart-line', title: '상담 카드 생성', desc: '근거 기반 상담 문서 자동 작성' },
                { step: '05', icon: 'ri-parent-line', title: '학부모 전달', desc: '신뢰 형성 및 재등록 유도' },
              ].map((item, i) => (
                <div key={i} className="relative text-center group">
                  <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center relative z-10 shadow-lg transition-transform duration-300 group-hover:scale-110 border border-white/20" style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', boxShadow: '0 8px 32px rgba(15,23,42,0.3)' }}>
                    <i className={`${item.icon} text-white text-2xl`}></i>
                  </div>
                  <div className="text-xs font-bold text-blue-600 mb-3 tracking-wider">{item.step}</div>
                  <h4 className="text-base font-bold text-slate-800 mb-2">{item.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border border-blue-500/10" style={{ background: 'rgba(59,130,246,0.04)' }}>
                <i className="ri-function-line text-blue-500 text-sm"></i>
                <span className="text-blue-600 text-xs font-semibold tracking-wider uppercase">Core Features</span>
              </div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6 tracking-tight">
                원장님이 정말 필요로 하는<br />
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #1e3a5f, #3b82f6)' }}>네 가지 기능</span>
              </h2>
              <p className="text-slate-500 text-base leading-relaxed mb-10">
                결제·출결 관리는 이미 잘 하고 계십니다. MathInsight가 집중하는 것은
                학생의 학습 흐름을 시각화하고, 상담의 질을 높이는 것입니다.
              </p>

              <div className="space-y-6">
                {[
                  { icon: 'ri-user-search-line', title: '학생 학습 기록 구조화', desc: '모든 수업 기록이 자동으로 학생별 프로필에 축적됩니다.' },
                  { icon: 'ri-chat-check-line', title: '상담 준비 자동화', desc: '학습 추이, 취약 개념, 숙제 패턴이 한 페이지에 정리됩니다.' },
                  { icon: 'ri-line-chart-line', title: '학생 흐름 시각화', desc: '성적, 숙제, 참여도를 시간축으로 확인합니다.' },
                  { icon: 'ri-file-paper-2-line', title: '학부모 리포트 생성', desc: 'AI가 학부모 친화적인 언어로 리포트를 자동 작성합니다.' },
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-5 group">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:shadow-lg border border-white/20" style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
                      <i className={`${f.icon} text-white text-lg`}></i>
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-800 mb-1.5">{f.title}</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div 
                className="rounded-2xl p-8 shadow-2xl border"
                style={{ 
                  background: 'linear-gradient(145deg, #ffffff, #f8fafc)', 
                  borderColor: 'rgba(226,232,240,0.8)',
                  boxShadow: '0 25px 100px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.5)' 
                }}
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>박</div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">박서연 학생</p>
                      <p className="text-[11px] text-slate-400 font-medium">고1 · 미분법 단원</p>
                    </div>
                  </div>
                  <span className="text-[11px] px-3 py-1.5 rounded-full font-semibold text-amber-700 border" style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.15)' }}>주의 필요</span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: '최근 점수', value: '68', change: '-12', color: 'red', bg: 'rgba(239,68,68,0.06)' },
                    { label: '숙제 제출률', value: '57%', change: '-23%', color: 'red', bg: 'rgba(239,68,68,0.06)' },
                    { label: '수업 참여도', value: '82', change: '+5', color: 'green', bg: 'rgba(34,197,94,0.06)' },
                  ].map((stat, i) => (
                    <div key={i} className="rounded-xl p-4 text-center border" style={{ background: '#f8fafc', borderColor: 'rgba(226,232,240,0.6)' }}>
                      <p className="text-[11px] text-slate-400 mb-1 font-medium">{stat.label}</p>
                      <p className="text-2xl font-bold text-slate-800 tracking-tight">{stat.value}</p>
                      <p className={`text-[11px] font-semibold mt-1 ${stat.color === 'red' ? 'text-red-500' : 'text-emerald-600'}`}>{stat.change}</p>
                    </div>
                  ))}
                </div>

                <div 
                  className="rounded-xl p-5 mb-5 border"
                  style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.03), rgba(29,78,216,0.03))', borderColor: 'rgba(59,130,246,0.1)' }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <i className="ri-sparkling-2-line text-blue-500 text-sm"></i>
                    <span className="text-xs font-bold text-blue-700">AI 학습 요약</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    미분법 단원에서 개념 이해는 양호하나, 계산 실수가 반복되고 있습니다.
                    숙제 제출률 하락과 함께 볼 때, 자기주도 학습 습관 점검이 필요합니다.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2.5 rounded-full" style={{ background: '#f1f5f9' }}>
                    <div className="h-full rounded-full" style={{ width: '65%', background: 'linear-gradient(90deg, #3b82f6, #60a5fa)' }}></div>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium shrink-0">개념 이해도 65%</span>
                </div>
              </div>

              {/* Floating mini card */}
              <div 
                className="absolute -bottom-8 -left-8 w-56 rounded-xl p-4 shadow-xl border"
                style={{ background: 'white', borderColor: 'rgba(226,232,240,0.6)' }}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <i className="ri-error-warning-line text-amber-500 text-sm"></i>
                  <span className="text-xs font-bold text-slate-700">상담 권장</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">박서연 학부모님께 상담 일정을 잡아보세요.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section id="trust" className="py-32 px-6 lg:px-12 relative" style={{ background: 'linear-gradient(180deg, #ffffff, #f8fafc)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border border-amber-500/10" style={{ background: 'rgba(245,158,11,0.04)' }}>
              <i className="ri-shield-star-line text-amber-500 text-sm"></i>
              <span className="text-amber-600 text-xs font-semibold tracking-wider uppercase">Trust & Results</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-5 tracking-tight">
              데이터가 증명하는,<br />
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #1e3a5f, #3b82f6)' }}>학원 운영의 변화</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {[
              { value: '73%', title: '상담 준비 시간 단축', desc: '수기 기록 정리에서 AI 자동 생성으로. 원장님의 시간이 학생에게 돌아갑니다.' },
              { value: '2.4x', title: '학부모 만족도 상승', desc: '데이터 기반 상담의 신뢰도가 재등록률로 직결됩니다.' },
              { value: '89%', title: '조기 이탈 감지율', desc: '성적 하락 징후를 놓치지 않고 선제적 대응이 가능합니다.' },
            ].map((item, i) => (
              <div 
                key={i} 
                className="rounded-2xl p-10 text-center transition-all duration-500 hover:shadow-xl hover:-translate-y-1 border"
                style={{ background: 'linear-gradient(135deg, #ffffff, #f8fafc)', borderColor: 'rgba(226,232,240,0.8)' }}
              >
                <div className="text-6xl font-bold text-transparent bg-clip-text mb-4 tracking-tight" style={{ backgroundImage: 'linear-gradient(135deg, #0f172a, #3b82f6)' }}>{item.value}</div>
                <h3 className="text-base font-bold text-slate-800 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA Card */}
          <div 
            className="rounded-3xl p-12 lg:p-16 relative overflow-hidden border"
            style={{ background: 'linear-gradient(135deg, #020617, #0f172a)', borderColor: 'rgba(59,130,246,0.15)' }}
          >
            <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-10 blur-3xl" style={{ background: 'radial-gradient(circle, #3b82f6, transparent)', transform: 'translate(30%, -40%)' }}></div>
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full opacity-5 blur-3xl" style={{ background: 'radial-gradient(circle, #60a5fa, transparent)', transform: 'translate(-20%, 30%)' }}></div>
            
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
              <div className="max-w-xl">
                <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4 tracking-tight">
                  오늘부터,<br />
                  <span className="text-blue-300">프리미엄 상담을 시작하세요.</span>
                </h3>
                <p className="text-slate-400 text-base leading-relaxed">
                  MathInsight는 이미 340여 개 학원에서 매일 사용되고 있습니다.<br />
                  14일 무료 체험으로 직접 확인해보세요.
                </p>
              </div>
              <Link href="/login">
                <button className="px-10 py-4 rounded-xl text-sm font-semibold transition-all hover:shadow-2xl hover:shadow-blue-600/20 cursor-pointer flex items-center gap-2 group shrink-0" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white' }}>
                  <span>무료로 시작하기</span>
                  <i className="ri-arrow-right-line transition-transform group-hover:translate-x-1"></i>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 lg:px-12 border-t" style={{ borderColor: 'rgba(226,232,240,0.6)' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
              <i className="ri-bar-chart-box-fill text-white text-xs"></i>
            </div>
            <span className="text-slate-700 font-bold text-sm">MathInsight</span>
            <span className="text-slate-400 text-xs">Academy Intelligence</span>
          </div>
          <div className="flex items-center gap-8">
            <a href="#" className="text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium">Privacy</a>
            <a href="#" className="text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium">Terms</a>
            <a href="#" className="text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium">Support</a>
          </div>
          <p className="text-xs text-slate-400"> 2026 MathInsight. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}