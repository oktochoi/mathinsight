# ADR-008: 설정 기능 분산 IA

- **Status:** Accepted
- **Context:** 반·시간표·연결코드·연결요청이 `/settings`에 몰려 ERP처럼 보임.
- **Decision:** 반→`students?tab=classes`, 일정→`schedule?tab=manage`, 연결→`students?tab=parents`, 알림→`/notifications`. `/settings`는 학원명·계정·연동만.
- **Consequences:** 새 「설정성」 기능은 해당 도메인 메뉴에 배치 후 `staffNavigation.ts` 등록.
- **Alternatives:** 설정 허브 유지 — 발견성·운영 IA 저하.
