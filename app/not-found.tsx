'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-slate-900">
      <div className="w-20 h-20 rounded-2xl mx-auto mb-8 flex items-center justify-center bg-blue-500/10 border border-blue-500/20">
        <i className="ri-compass-discover-line text-blue-400 text-3xl"></i>
      </div>
      <h1 className="text-6xl font-bold text-white mb-4">404</h1>
      <p className="text-lg text-slate-400 mb-2">페이지를 찾을 수 없습니다</p>
      <p className="text-sm text-slate-500 mb-8">주소를 확인하거나 홈으로 이동해 주세요.</p>
      <div className="flex gap-3">
        <Link href="/">
          <button
            type="button"
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white bg-slate-700 cursor-pointer"
          >
            홈
          </button>
        </Link>
        <Link href="/login">
          <button
            type="button"
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 cursor-pointer"
          >
            로그인
          </button>
        </Link>
      </div>
    </div>
  );
}
