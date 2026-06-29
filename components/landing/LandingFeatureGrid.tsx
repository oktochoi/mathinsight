const FEATURES = [
  {
    icon: 'ri-brain-line',
    title: 'AI 학생 분석',
    desc: '수업·숙제·시험 기록을 읽고 상담 전 학생 요약과 talking points를 생성합니다.',
  },
  {
    icon: 'ri-calendar-todo-line',
    title: '오늘 상담',
    desc: '오늘 예정된 상담 큐와 준비 상태를 한 화면에서 확인합니다.',
  },
  {
    icon: 'ri-chat-heart-line',
    title: 'AI 상담 카드',
    desc: '학부모·학생별 상담 초안, 메모, 후속 과제를 카드 형태로 관리합니다.',
  },
  {
    icon: 'ri-alarm-warning-line',
    title: '위험 학생 감지',
    desc: '성적·출결·숙제 패턴에서 이탈 신호를 자동 감지하고 우선순위를 부여합니다.',
  },
  {
    icon: 'ri-file-text-line',
    title: '학부모 리포트',
    desc: '상담 결과와 학습 변화를 학부모가 이해하기 쉬운 리포트로 전달합니다.',
  },
  {
    icon: 'ri-loop-left-line',
    title: '재등록 관리',
    desc: '재등록 위험도·상담 이력·전환 기록을 연결해 이탈을 사전에 방어합니다.',
  },
];

export function LandingFeatureGrid() {
  return (
    <section id="features" className="ef-section scroll-mt-20">
      <div className="ef-container">
        <div className="ef-section-head">
          <p className="ef-eyebrow">Core Capabilities</p>
          <h2 className="ef-section-title">상담 준비를 자동화하는 6가지 기능</h2>
          <p className="ef-section-desc">
            기록 수집부터 학부모 전달까지, 상담사가 매번 처음부터 정리하지 않아도 됩니다.
          </p>
        </div>

        <div className="ef-feature-grid">
          {FEATURES.map((f) => (
            <article key={f.title} className="ef-card ef-feature-card">
              <span className="ef-feature-icon" aria-hidden>
                <i className={f.icon} />
              </span>
              <h3 className="ef-feature-title">{f.title}</h3>
              <p className="ef-feature-desc">{f.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
