/** Hero 우측 — AI 상담 운영 대시보드 목업 */
export function LandingHeroMockup() {
  return (
    <div className="ef-mockup-root" aria-hidden>
      <div className="ef-mockup-glow" />

      <div className="ef-mockup-shell">
        <div className="ef-mockup-chrome">
          <div className="ef-mockup-dots">
            <span /><span /><span />
          </div>
          <span className="ef-mockup-title">Counseling Dashboard</span>
        </div>

        <div className="ef-mockup-body">
          <div className="ef-mockup-student">
            <div className="ef-mockup-avatar">박</div>
            <div>
              <p className="ef-mockup-name">박서연</p>
              <p className="ef-mockup-meta">고1 · 중2 A반</p>
            </div>
            <span className="ef-mockup-pill ef-pill-warn">상담 D-1</span>
          </div>

          <div className="ef-mockup-grid">
            <div className="ef-mockup-card ef-mockup-span-2">
              <div className="ef-mockup-card-head">
                <i className="ri-sparkling-2-line" />
                <span>AI Student Summary</span>
              </div>
              <p className="ef-mockup-summary">
                최근 3주 점수 <strong>80 → 68</strong> 하락. 숙제 미제출 2회. 일차방정식 오답
                패턴 반복 — 상담 시 <em>루틴·오답노트</em>부터 다루는 것을 권장합니다.
              </p>
            </div>

            <div className="ef-mockup-card">
              <div className="ef-mockup-card-head">
                <i className="ri-pulse-line" />
                <span>Risk Snapshot</span>
              </div>
              <div className="ef-risk-meter">
                <div className="ef-risk-bar" style={{ width: '72%' }} />
              </div>
              <p className="ef-mockup-meta mt-2">위험도 72 · 숙제·성적 복합</p>
            </div>

            <div className="ef-mockup-card">
              <div className="ef-mockup-card-head">
                <i className="ri-arrow-left-right-line" />
                <span>재등록 위험도</span>
              </div>
              <p className="ef-mockup-stat">중간</p>
              <p className="ef-mockup-meta">전월 대비 ↓12%</p>
            </div>

            <div className="ef-mockup-card ef-mockup-span-2">
              <div className="ef-mockup-card-head">
                <i className="ri-chat-heart-line" />
                <span>상담 카드</span>
                <span className="ef-mockup-badge">AI 초안</span>
              </div>
              <ul className="ef-mockup-list">
                <li>학부모: 숙제 루틴·집중 시간 공유</li>
                <li>학생: 오답노트 1주 챌린지 제안</li>
                <li>다음: 3/28 재평가 · 목표 75점</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="ef-mockup-float ef-float-a">
        <i className="ri-robot-2-line" />
        <span>AI 분석 완료</span>
      </div>
      <div className="ef-mockup-float ef-float-b">
        <i className="ri-calendar-check-line" />
        <span>내일 14:00 상담</span>
      </div>
    </div>
  );
}
