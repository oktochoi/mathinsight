# ADR-001: lesson_logs + ERP 이중 데이터 구조

- **Status:** Accepted
- **Context:** v1은 `lesson_logs` 중심. 마이그레이션 023~027로 `lessons`, `attendance_records`, `student_risk_snapshots` 등 ERP 테이블 추가. 전면 전환 전 과도기.
- **Decision:** UI 쓰기는 `lesson_logs` 경로 유지. ERP는 read fallback·트리거 sync·신규 기능(마감·스냅샷)에 사용.
- **Consequences:** Agent/훅 수정 시 두 경로 인지 필수. 문서: [OPERATIONS_SYSTEMIZATION.md](../OPERATIONS_SYSTEMIZATION.md).
- **Alternatives:** 즉시 ERP-only — 리스크·범위 과대.
