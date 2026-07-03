'use client';

import { useState } from 'react';

const FAQS = [
  {
    q: 'EduFlow는 학원 ERP와 무엇이 다른가요?',
    a: 'ERP는 행정·정산 중심입니다. EduFlow는 수업 기록이 AI 상담 준비로 이어지는 Counseling Operating System입니다. 상담 카드, 위험 감지, 학부모 리포트, 재등록 관리에 최적화되어 있습니다.',
  },
  {
    q: 'AI가 상담 내용을 대신 하나요?',
    a: '아닙니다. AI는 기록을 분석해 상담 전 요약·talking points·카드 초안을 준비합니다. 최종 상담과 전달은 원장·강사가 합니다.',
  },
  {
    q: '기존 엑셀·ClassUp 데이터를 옮길 수 있나요?',
    a: '학생·수업 기록은 단계적 이전을 지원합니다. 도입 상담 시 현재 운영 방식에 맞는 온보딩 플랜을 안내드립니다.',
  },
  {
    q: '학부모 포털 AI는 어떻게 동작하나요?',
    a: '학원이 승인한 학습·상담 맥락만 기반으로 24시간 질의응답이 가능합니다. 민감 정보는 학원 정책에 따라 제어됩니다.',
  },
  {
    q: '무료 체험 기간과 요금은?',
    a: '현재 행사 기간으로 Starter·Pro·Enterprise 등 모든 플랜을 무료로 이용하실 수 있습니다. 카드 등록 없이 가입 후 바로 시작하세요.',
  },
];

export function LandingFAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="ef-section scroll-mt-20">
      <div className="ef-container ef-faq-wrap">
        <div className="ef-section-head">
          <p className="ef-eyebrow">FAQ</p>
          <h2 className="ef-section-title">자주 묻는 질문</h2>
        </div>

        <div className="ef-faq-list">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className={`ef-faq-item ${isOpen ? 'ef-faq-open' : ''}`}>
                <button
                  type="button"
                  className="ef-faq-q"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <span>{item.q}</span>
                  <i className={isOpen ? 'ri-subtract-line' : 'ri-add-line'} aria-hidden />
                </button>
                {isOpen && <p className="ef-faq-a">{item.a}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
