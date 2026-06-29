import type { ReactNode } from 'react';

function ScreenFrame({
  label,
  title,
  children,
  reverse,
}: {
  label: string;
  title: string;
  children: ReactNode;
  reverse?: boolean;
}) {
  return (
    <div className={`ef-screen-row ${reverse ? 'ef-screen-reverse' : ''}`}>
      <div className="ef-screen-copy">
        <p className="ef-eyebrow">{label}</p>
        <h3 className="ef-screen-title">{title}</h3>
      </div>
      <div className="ef-screen-frame">{children}</div>
    </div>
  );
}

function DashboardMock() {
  return (
    <div className="ef-ui">
      <div className="ef-ui-bar">
        <span className="ef-ui-bar-title">오늘의 상담 · 원장 보드</span>
      </div>
      <div className="ef-ui-body ef-ui-cols">
        <div className="ef-ui-panel">
          <p className="ef-ui-label">오늘 상담 3건</p>
          <div className="ef-ui-row"><span>김민준</span><span className="ef-tag">14:00</span></div>
          <div className="ef-ui-row"><span>박서연</span><span className="ef-tag ef-tag-warn">준비 필요</span></div>
          <div className="ef-ui-row"><span>이도윤</span><span className="ef-tag">16:30</span></div>
        </div>
        <div className="ef-ui-panel">
          <p className="ef-ui-label">위험 학생</p>
          <div className="ef-ui-row"><span>최하늘</span><span className="ef-tag ef-tag-danger">82</span></div>
          <div className="ef-ui-row"><span>박서연</span><span className="ef-tag ef-tag-warn">72</span></div>
        </div>
        <div className="ef-ui-panel ef-ui-span">
          <p className="ef-ui-label">미마감 수업</p>
          <div className="ef-ui-row"><span>중2 A반 · 3/22</span><span className="ef-tag">마감</span></div>
        </div>
      </div>
    </div>
  );
}

function StudentHubMock() {
  return (
    <div className="ef-ui">
      <div className="ef-ui-bar">
        <div className="ef-ui-student">
          <span className="ef-ui-avatar">박</span>
          <div><strong>박서연</strong><br /><span className="ef-ui-muted">고1 · 중2 A반</span></div>
        </div>
      </div>
      <div className="ef-ui-body">
        <div className="ef-ui-tabs">
          <span className="ef-ui-tab active">타임라인</span>
          <span className="ef-ui-tab">부모</span>
          <span className="ef-ui-tab">재등록</span>
        </div>
        <div className="ef-ui-timeline-item">
          <span className="ef-ui-dot" /> 3/22 시험 68점 · 일차방정식
        </div>
        <div className="ef-ui-timeline-item">
          <span className="ef-ui-dot ef-dot-warn" /> 3/25 숙제 미제출
        </div>
        <div className="ef-ui-timeline-item">
          <span className="ef-ui-dot ef-dot-ai" /> AI: 상담 시 루틴·오답노트 권장
        </div>
      </div>
    </div>
  );
}

function ConsultCardMock() {
  return (
    <div className="ef-ui">
      <div className="ef-ui-bar">
        <span className="ef-ui-bar-title">AI 상담 카드 · 박서연</span>
        <span className="ef-tag ef-tag-ai">AI 초안</span>
      </div>
      <div className="ef-ui-body">
        <div className="ef-ui-block">
          <p className="ef-ui-label">학부모 전달 포인트</p>
          <p>숙제 루틴·집중 시간대 공유. 성적 하락은 단원 전환 구간 영향.</p>
        </div>
        <div className="ef-ui-block">
          <p className="ef-ui-label">학생 대화 포인트</p>
          <p>오답노트 1주 챌린지, 다음 시험 목표 75점.</p>
        </div>
        <div className="ef-ui-block ef-ui-block-muted">
          <p className="ef-ui-label">근거 기록</p>
          <p className="ef-ui-muted">시험 80→68 · 숙제 미제출 2회 · 3/10 상담 메모</p>
        </div>
      </div>
    </div>
  );
}

function ParentReportMock() {
  return (
    <div className="ef-ui">
      <div className="ef-ui-bar">
        <span className="ef-ui-bar-title">주간 학부모 리포트</span>
      </div>
      <div className="ef-ui-body">
        <p className="ef-ui-report-head">박서연 · 3월 4주차</p>
        <div className="ef-ui-report-section">
          <strong>이번 주 변화</strong>
          <p>일차방정식 단원에서 점수 변동. 숙제 1회 미제출.</p>
        </div>
        <div className="ef-ui-report-section">
          <strong>다음 주 포커스</strong>
          <p>오답 정리 루틴 · 3/28 재평가</p>
        </div>
        <div className="ef-ui-report-footer">
          <span className="ef-tag ef-tag-ai">포털 AI 문의 가능</span>
        </div>
      </div>
    </div>
  );
}

export function LandingScreens() {
  return (
    <section id="screens" className="ef-section scroll-mt-20">
      <div className="ef-container">
        <div className="ef-section-head ef-section-head-center">
          <p className="ef-eyebrow">Product Preview</p>
          <h2 className="ef-section-title">실제 화면처럼, 상담 운영의 전 과정</h2>
        </div>

        <div className="ef-screens-stack">
          <ScreenFrame label="Dashboard" title="오늘 상담·위험 학생·미마감 수업을 한눈에">
            <DashboardMock />
          </ScreenFrame>
          <ScreenFrame label="Student Hub" title="학생별 기록·AI 분석·재등록 맥락" reverse>
            <StudentHubMock />
          </ScreenFrame>
          <ScreenFrame label="AI 상담 카드" title="상담 전 talking points와 근거 기록">
            <ConsultCardMock />
          </ScreenFrame>
          <ScreenFrame label="Parent Report" title="상담 결과를 학부모 리포트로 전달" reverse>
            <ParentReportMock />
          </ScreenFrame>
        </div>
      </div>
    </section>
  );
}
