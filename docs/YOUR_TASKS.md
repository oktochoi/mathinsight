# EduFlow — 당신이 해야 할 일

개발 환경·배포·외부 연동은 **원장/운영자**가 직접 설정해야 합니다. 아래를 순서대로 진행해 주세요.

## 1. Supabase (필수)

1. [Supabase](https://supabase.com) 프로젝트 생성
2. SQL Editor에서 `supabase/migrations/001` ~ `008` 순서대로 실행
3. 발표/데모용: Auth에 3계정 가입 후 `supabase/seed-demo.sql` 실행  
   → [SUPABASE_SETUP.md](../SUPABASE_SETUP.md), [README.md](../README.md) 참고

## 2. 환경 변수 `.env.local` (필수)

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # 또는 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

# AI 생성 (상담 카드·학부모 리포트) — 없으면 규칙 기반 폴백
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash   # 선택
```

## 3. 로컬 실행 확인

```bash
npm install
npm run dev
```

- 원장: `okto0914@gmail.com` (시드 사용 시)
- 학부모/학생: 시드 문서의 계정
- 대시보드 **오늘 해야 할 일**, 학생 **자동 위험 등급**, **30초 상담 브리핑** 확인

## 4. 배포 (Vercel 등)

- 위 환경 변수를 호스팅에 동일하게 등록
- Supabase Auth → Site URL / Redirect URLs에 배포 도메인 추가

## 5. Phase 2 확인 (방금 추가됨)

- **학부모** `okto0915` 로그인 → 「학습 상담 Agent」에서 예시 질문 테스트
- **원장** 학생 상세 → **Student Digital Twin** 패널 확인
- `GEMINI_API_KEY` 없으면 Agent도 **기록 기반 규칙 답변**으로 동작

## 6. Google 로그인 (대시보드 설정만)

앱에 Google 버튼·콜백 라우트가 있습니다. **Client Secret은 Supabase에만** 등록하세요.

1. [docs/GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) 순서대로 진행
2. Supabase: Site URL `http://localhost:3000`, Redirect `http://localhost:3000/auth/callback`
3. Google Cloud: redirect URI = `https://<project>.supabase.co/auth/v1/callback`

## 7. 아직 코드에 없음 — 준비만

| 항목 | 당신이 할 일 |
|------|----------------|
| ~~Google 로그인~~ | 위 6번 완료 후 `/login`에서 테스트 |
| **Gmail 발송** | Resend / SendGrid / Gmail API 중 선택, 발신 도메인·템플릿 승인 |
| **학부모 AI Agent** | Gemini API 키·비용 한도, 학부모 포털 문구 검수 |
| **도메인·브랜드** | `eduflow` 도메인, 로고 파일 제공 시 UI 반영 가능 |

## 8. 운영·검수

- AI 문구는 **기록 보조**입니다. 상담·리포트 발송 전 원장이 한 번 검토하는 흐름을 유지해 주세요.
- 학생 `status`는 수업 기록 저장 시 **자동 갱신**됩니다. 수동 변경과 다를 수 있습니다.

---

문의·우선순위 변경은 [EDUFLOW.md](./EDUFLOW.md) 로드맵을 기준으로 협의하면 됩니다.
