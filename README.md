# MathInsight

학원 수업·학생 관리와 학부모/학생 포털을 위한 Next.js + Supabase 앱입니다.

## Vercel 배포 시 환경 변수

Project → Settings → Environment Variables:

| 이름 | 설명 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 또는 `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable key |

없으면 로그인·DB가 동작하지 않습니다.

## 빠른 시작

```bash
npm install
npm run dev
```

브라우저: [http://localhost:3000](http://localhost:3000)

## 문서

| 문서 | 내용 |
|------|------|
| **[USAGE_GUIDE.md](./USAGE_GUIDE.md)** | **사이트 사용법** — 원장/학부모/학생 예시 시나리오 |
| [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) | Supabase SQL 마이그레이션·오류 해결 |

## 사용 흐름 (요약)

1. **원장** `/signup` → 학원 이름 입력 → 로그인 → **Students**에서 반·학생 등록 → **Lesson Logs**에 수업 입력  
2. **학부모·학생** 각각 `/signup`으로 가입  
3. **원장**이 학생 **수정**에서 가입 **이메일** 저장 → 목록에 `부모 ✓` `학생 ✓` 확인  
4. **학부모** `/parent`, **학생** `/student`에서 조회  

자세한 예시(이름·이메일 샘플 포함)는 [USAGE_GUIDE.md](./USAGE_GUIDE.md)를 참고하세요.
