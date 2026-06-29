const STEPS = [
  {
    icon: 'ri-book-open-line',
    title: '오늘 수업',
    desc: 'Lesson 단위로 출결·숙제·점수를 기록합니다.',
  },
  {
    icon: 'ri-line-chart-line',
    title: '학생 변화 기록',
    desc: '성적·습관 변화가 타임라인에 쌓입니다.',
  },
  {
    icon: 'ri-sparkling-2-line',
    title: 'AI 분석',
    desc: '패턴을 읽고 상담 포인트를 추출합니다.',
  },
  {
    icon: 'ri-clipboard-line',
    title: '상담 준비',
    desc: 'AI 상담 카드와 talking points가 준비됩니다.',
  },
  {
    icon: 'ri-parent-line',
    title: '학부모 전달',
    desc: '리포트와 포털 AI로 맥락을 공유합니다.',
  },
  {
    icon: 'ri-loop-left-line',
    title: '재등록',
    desc: '위험 신호·상담 결과로 재등록을 지킵니다.',
  },
];

export function LandingWorkflow() {
  return (
    <section id="workflow" className="ef-section ef-section-muted scroll-mt-20">
      <div className="ef-container">
        <div className="ef-section-head ef-section-head-center">
          <p className="ef-eyebrow">EduFlow Workflow</p>
          <h2 className="ef-section-title">기록에서 상담까지, 끊기지 않는 흐름</h2>
          <p className="ef-section-desc">
            수업 데이터가 쌓일수록 AI 상담 준비는 더 정확해집니다.
          </p>
        </div>

        <ol className="ef-timeline">
          {STEPS.map((step, i) => (
            <li key={step.title} className="ef-timeline-item">
              <div className="ef-timeline-node">
                <span className="ef-timeline-icon">
                  <i className={step.icon} aria-hidden />
                </span>
                {i < STEPS.length - 1 && <span className="ef-timeline-line" aria-hidden />}
              </div>
              <div className="ef-timeline-content">
                <h3 className="ef-timeline-title">{step.title}</h3>
                <p className="ef-timeline-desc">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
