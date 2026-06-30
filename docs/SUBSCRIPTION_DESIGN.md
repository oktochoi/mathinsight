# EduFlow 구독 결제 시스템 설계도

> 작성일: 2026-07-01  
> 목표: 실연동 없이 전체 구독 흐름 검증 (Mock 우선)  
> 실연동 교체 시 Provider 파일만 바꾸면 됨

---

## 전체 흐름

```
회원가입 (owner)
    │
    ▼
학원 생성 (StepOwnerAcademy)
    │
    ├─ academy 생성
    └─ academy_subscriptions 생성 (status: trialing, 3일)
            │
            ▼
    [Subscription Guard 체크]
    trialing + 만료 전 → 대시보드 접근 허용
            │
            ▼ (3일 후)
    trial_ends_at 초과 → /subscribe 강제 이동
            │
    ┌───────┴────────┐
    │  플랜 선택 UI   │
    │  Mock 결제 버튼 │
    └───────┬────────┘
            │ 클릭
            ▼
    status = active
    current_period_end = now + 30일
            │
            ▼
    대시보드 접근 재개
```

---

## 1. DB 스키마

### 마이그레이션: `supabase/migrations/052_subscriptions.sql`

```sql
-- 구독 플랜 정의
create type subscription_status as enum (
  'trialing',   -- 무료 체험 중
  'active',     -- 결제 완료, 서비스 이용 중
  'past_due',   -- 결제 실패 (유예 기간)
  'expired',    -- 체험 만료 또는 갱신 실패
  'canceled'    -- 직접 해지
);

create type subscription_plan as enum (
  'free',      -- 무료 (학생 10명)
  'starter',   -- 39,000원 / 학생 50명
  'growth',    -- 79,000원 / 학생 150명
  'pro'        -- 149,000원 / 무제한
);

create table academy_subscriptions (
  id                    uuid primary key default gen_random_uuid(),
  academy_id            uuid references academies(id) on delete cascade not null unique,
  status                subscription_status not null default 'trialing',
  plan                  subscription_plan not null default 'starter',

  -- 무료 체험
  trial_started_at      timestamptz,
  trial_ends_at         timestamptz,

  -- 현재 결제 주기
  current_period_start  timestamptz,
  current_period_end    timestamptz,

  -- 결제 공급자 (mock | toss | portone)
  payment_provider      text not null default 'mock',
  -- 실연동 시 외부 구독 ID 저장
  external_subscription_id text,

  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- 결제 이력 (Mock도 기록)
create table subscription_payments (
  id              uuid primary key default gen_random_uuid(),
  academy_id      uuid references academies(id) on delete cascade not null,
  subscription_id uuid references academy_subscriptions(id),
  plan            subscription_plan not null,
  amount_krw      integer not null,           -- 원화 금액
  status          text not null,              -- success | failed | refunded
  provider        text not null default 'mock',
  external_payment_id text,                   -- Toss paymentKey 등
  paid_at         timestamptz default now(),
  created_at      timestamptz default now()
);

-- RLS
alter table academy_subscriptions enable row level security;
alter table subscription_payments enable row level security;

-- 원장·원무만 읽기 가능
create policy "academy_sub_read" on academy_subscriptions
  for select using (
    academy_id in (
      select academy_id from users where id = auth.uid()
    )
  );

-- 서비스 역할(서버)만 쓰기 (클라이언트 직접 수정 금지)
create policy "academy_sub_service_write" on academy_subscriptions
  for all using (auth.role() = 'service_role');

create policy "payment_read" on subscription_payments
  for select using (
    academy_id in (
      select academy_id from users where id = auth.uid()
    )
  );
```

---

## 2. 파일 구조

```
lib/
├── sms/
│   ├── types.ts              ← SmsProvider 인터페이스
│   ├── mockProvider.ts       ← Mock (123456 고정)
│   ├── solapiProvider.ts     ← 실연동용 (나중에 채움)
│   └── index.ts              ← 환경변수로 Provider 선택
│
├── subscription/
│   ├── types.ts              ← SubscriptionStatus, Plan 타입
│   ├── guard.ts              ← 접근 허용 여부 판단 로직
│   ├── trialService.ts       ← 체험 생성/만료 처리
│   └── index.ts              ← export 모음
│
├── payment/
│   ├── types.ts              ← PaymentProvider 인터페이스
│   ├── mockProvider.ts       ← Mock 결제 (즉시 active)
│   ├── tossProvider.ts       ← 실연동용 (나중에 채움)
│   └── index.ts              ← 환경변수로 Provider 선택

app/
├── (app)/
│   ├── subscribe/
│   │   └── page.tsx          ← 결제 잠금 + 플랜 선택 + Mock 결제
│   └── layout.tsx            ← Subscription Guard (서버 컴포넌트)
│
└── api/
    ├── subscription/
    │   ├── status/route.ts   ← 현재 구독 상태 조회
    │   ├── activate/route.ts ← Mock 결제 완료 처리
    │   └── expire/route.ts   ← 개발용 만료 강제 처리
    └── sms/
        ├── send/route.ts     ← 인증번호 발송 (Mock or Solapi)
        └── verify/route.ts   ← 인증번호 확인

components/
└── subscription/
    ├── SubscriptionBanner.tsx  ← 체험 D-N 표시 배너
    ├── PlanSelector.tsx        ← 플랜 선택 카드 UI
    ├── MockPayButton.tsx       ← Mock 결제 버튼
    └── DevTools.tsx            ← 개발용 테스트 버튼 (production 숨김)

hooks/
└── useSubscription.ts          ← 구독 상태 클라이언트 훅
```

---

## 3. SMS Provider 인터페이스

### `lib/sms/types.ts`
```ts
export interface SmsProvider {
  /** 인증번호 발송. 성공 시 ok: true */
  send(phone: string): Promise<{ ok: boolean; error?: string }>;
  /** 인증번호 검증. 성공 시 ok: true, phone 반환 */
  verify(phone: string, code: string): Promise<{ ok: boolean; error?: string }>;
}
```

### `lib/sms/mockProvider.ts`
```ts
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { SmsProvider } from './types';

const MOCK_CODE = '123456';
const TTL_MINUTES = 5;

export class MockSmsProvider implements SmsProvider {
  async send(phone: string) {
    // 실제 SMS 발송 없음. DB에 코드 저장
    const expiresAt = new Date(Date.now() + TTL_MINUTES * 60 * 1000);
    await supabaseAdmin.from('phone_verifications').upsert({
      phone,
      code: MOCK_CODE,
      expires_at: expiresAt.toISOString(),
      verified: false,
    }, { onConflict: 'phone' });

    console.log(`[SMS Mock] ${phone} → 인증번호: ${MOCK_CODE}`);
    return { ok: true };
  }

  async verify(phone: string, code: string) {
    const { data } = await supabaseAdmin
      .from('phone_verifications')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();

    if (!data) return { ok: false, error: '인증 요청이 없습니다.' };
    if (new Date(data.expires_at) < new Date()) return { ok: false, error: '인증번호가 만료됐습니다.' };
    if (data.code !== code) return { ok: false, error: '인증번호가 올바르지 않습니다.' };

    await supabaseAdmin
      .from('phone_verifications')
      .update({ verified: true })
      .eq('phone', phone);

    return { ok: true };
  }
}
```

### `lib/sms/solapiProvider.ts`
```ts
import type { SmsProvider } from './types';

// 나중에 채움 — 인터페이스만 구현
export class SolapiProvider implements SmsProvider {
  async send(_phone: string) {
    throw new Error('Solapi 미연동 — SMS_PROVIDER=solapi 설정 후 구현 필요');
  }
  async verify(_phone: string, _code: string) {
    throw new Error('Solapi 미연동');
  }
}
```

### `lib/sms/index.ts`
```ts
import { MockSmsProvider } from './mockProvider';
import { SolapiProvider } from './solapiProvider';
import type { SmsProvider } from './types';

// SMS_PROVIDER=solapi 환경변수 설정 시 실연동으로 교체
export const smsProvider: SmsProvider =
  process.env.SMS_PROVIDER === 'solapi'
    ? new SolapiProvider()
    : new MockSmsProvider();
```

---

## 4. Payment Provider 인터페이스

### `lib/payment/types.ts`
```ts
export type PlanId = 'starter' | 'growth' | 'pro';

export const PLAN_PRICE_KRW: Record<PlanId, number> = {
  starter: 39000,
  growth:  79000,
  pro:    149000,
};

export const PLAN_LABEL: Record<PlanId, string> = {
  starter: '스타터',
  growth:  '성장',
  pro:     '프로',
};

export interface PaymentProvider {
  /**
   * 구독 결제 처리
   * Mock: 즉시 active 처리
   * Toss: 결제창 URL 반환 후 웹훅으로 confirm
   */
  subscribe(params: {
    academyId: string;
    plan: PlanId;
  }): Promise<{ ok: boolean; error?: string; redirectUrl?: string }>;

  cancel(academyId: string): Promise<{ ok: boolean; error?: string }>;
}
```

### `lib/payment/mockProvider.ts`
```ts
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { PaymentProvider, PlanId, PLAN_PRICE_KRW } from './types';
import { PLAN_PRICE_KRW as PRICES } from './types';

export class MockPaymentProvider implements PaymentProvider {
  async subscribe({ academyId, plan }: { academyId: string; plan: PlanId }) {
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // 구독 상태 active로 변경
    await supabaseAdmin.from('academy_subscriptions').update({
      status: 'active',
      plan,
      payment_provider: 'mock',
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      updated_at: now.toISOString(),
    }).eq('academy_id', academyId);

    // 결제 이력 기록
    await supabaseAdmin.from('subscription_payments').insert({
      academy_id: academyId,
      plan,
      amount_krw: PRICES[plan],
      status: 'success',
      provider: 'mock',
      external_payment_id: `mock_${Date.now()}`,
    });

    console.log(`[Payment Mock] ${academyId} → ${plan} 구독 활성화`);
    return { ok: true };
  }

  async cancel(academyId: string) {
    await supabaseAdmin.from('academy_subscriptions').update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    }).eq('academy_id', academyId);
    return { ok: true };
  }
}
```

### `lib/payment/tossProvider.ts`
```ts
import type { PaymentProvider, PlanId } from './types';

// 나중에 채움
export class TossProvider implements PaymentProvider {
  async subscribe(_params: { academyId: string; plan: PlanId }) {
    throw new Error('Toss 미연동 — PAYMENT_PROVIDER=toss 설정 후 구현 필요');
  }
  async cancel(_academyId: string) {
    throw new Error('Toss 미연동');
  }
}
```

### `lib/payment/index.ts`
```ts
import { MockPaymentProvider } from './mockProvider';
import { TossProvider } from './tossProvider';
import type { PaymentProvider } from './types';

export const paymentProvider: PaymentProvider =
  process.env.PAYMENT_PROVIDER === 'toss'
    ? new TossProvider()
    : new MockPaymentProvider();

export * from './types';
```

---

## 5. Subscription Guard

### `lib/subscription/guard.ts`
```ts
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export type GuardResult =
  | { allowed: true; status: 'trialing' | 'active'; daysLeft?: number }
  | { allowed: false; reason: 'trial_expired' | 'expired' | 'past_due' | 'canceled' | 'no_subscription' };

export async function checkAcademySubscription(academyId: string): Promise<GuardResult> {
  const { data } = await supabaseAdmin
    .from('academy_subscriptions')
    .select('status, trial_ends_at, current_period_end')
    .eq('academy_id', academyId)
    .maybeSingle();

  if (!data) return { allowed: false, reason: 'no_subscription' };

  if (data.status === 'active') {
    return { allowed: true, status: 'active' };
  }

  if (data.status === 'trialing') {
    const trialEnd = new Date(data.trial_ends_at);
    const now = new Date();
    if (trialEnd > now) {
      const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { allowed: true, status: 'trialing', daysLeft };
    }
    return { allowed: false, reason: 'trial_expired' };
  }

  return { allowed: false, reason: data.status as 'expired' | 'past_due' | 'canceled' };
}
```

### `lib/subscription/trialService.ts`
```ts
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const TRIAL_DAYS = 3;

/** 학원 생성 시 호출 — 3일 체험 구독 생성 */
export async function createTrialSubscription(academyId: string) {
  const now = new Date();
  const trialEnd = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  const { error } = await supabaseAdmin.from('academy_subscriptions').insert({
    academy_id: academyId,
    status: 'trialing',
    plan: 'starter',
    trial_started_at: now.toISOString(),
    trial_ends_at: trialEnd.toISOString(),
    payment_provider: 'mock',
  });

  if (error) console.error('[Trial] 생성 실패:', error);
  return { trialEnd };
}

/** 개발 환경 전용 — 체험 즉시 만료 */
export async function expireTrialNow(academyId: string) {
  if (process.env.NODE_ENV === 'production') throw new Error('production에서 사용 불가');
  const past = new Date(Date.now() - 1000).toISOString();
  await supabaseAdmin.from('academy_subscriptions').update({
    trial_ends_at: past,
    updated_at: new Date().toISOString(),
  }).eq('academy_id', academyId);
}
```

---

## 6. Subscription Guard — Next.js 레이어

### `app/(app)/layout.tsx` 서버 컴포넌트 체크
```tsx
// 서버에서 구독 상태 확인 후 리다이렉트
import { checkAcademySubscription } from '@/lib/subscription/guard';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabaseServer';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('role, academy_id')
    .eq('id', user.id)
    .maybeSingle();

  // 학부모·학생 포털은 구독 체크 없음
  if (!profile?.academy_id || profile.role === 'parent' || profile.role === 'student') {
    return <>{children}</>;
  }

  const result = await checkAcademySubscription(profile.academy_id);
  if (!result.allowed) {
    redirect(`/subscribe?reason=${result.reason}`);
  }

  return <>{children}</>;
}
```

---

## 7. API Routes

### `app/api/sms/send/route.ts`
```ts
import { smsProvider } from '@/lib/sms';
import { isValidPhoneKr, normalizePhoneKr } from '@/lib/phone';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { phone } = await req.json() as { phone: string };
  const normalized = normalizePhoneKr(phone);
  if (!isValidPhoneKr(normalized)) {
    return NextResponse.json({ error: '올바른 번호를 입력해 주세요.' }, { status: 400 });
  }
  const result = await smsProvider.send(normalized);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
```

### `app/api/sms/verify/route.ts`
```ts
import { smsProvider } from '@/lib/sms';
import { normalizePhoneKr } from '@/lib/phone';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { phone, code } = await req.json() as { phone: string; code: string };
  const result = await smsProvider.verify(normalizePhoneKr(phone), code);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
```

### `app/api/subscription/activate/route.ts`
```ts
import { paymentProvider } from '@/lib/payment';
import { createServerClient } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';
import type { PlanId } from '@/lib/payment/types';

export async function POST(req: Request) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인 필요' }, { status: 401 });

  const { plan } = await req.json() as { plan: PlanId };
  const { data: profile } = await supabase
    .from('users')
    .select('academy_id, role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.academy_id || profile.role !== 'owner') {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 });
  }

  const result = await paymentProvider.subscribe({ academyId: profile.academy_id, plan });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
```

### `app/api/subscription/dev-expire/route.ts` (개발 전용)
```ts
import { expireTrialNow } from '@/lib/subscription/trialService';
import { createServerClient } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'dev only' }, { status: 403 });
  }
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('users').select('academy_id').eq('id', user!.id).maybeSingle();

  await expireTrialNow(profile!.academy_id);
  return NextResponse.json({ ok: true });
}
```

---

## 8. UI 컴포넌트

### `app/(app)/subscribe/page.tsx` 구조
```
/subscribe
├── 상단: 현재 상태 배너
│   ├── trial_expired → "3일 무료 체험이 종료됐습니다"
│   ├── past_due     → "결제에 문제가 생겼습니다"
│   └── canceled     → "구독이 해지됐습니다"
│
├── 중단: 플랜 선택 카드 (3개)
│   ├── 스타터 39,000원 / 50명
│   ├── 성장  79,000원 / 150명
│   └── 프로 149,000원 / 무제한
│
├── 하단: Mock 결제 버튼
│   └── "Mock 결제 완료 (테스트용)" → POST /api/subscription/activate
│
└── 개발 전용 DevTools (NODE_ENV !== 'production')
    ├── "체험 즉시 만료" → POST /api/subscription/dev-expire
    └── "구독 active 처리" → POST /api/subscription/activate?plan=starter
```

### `components/subscription/SubscriptionBanner.tsx`
```tsx
// 앱 상단에 고정 — 체험 중일 때만 표시
// "무료 체험 D-2 남았습니다 · 플랜 보기 →"
// daysLeft <= 1 이면 빨간색으로 강조
```

### `components/subscription/DevTools.tsx`
```tsx
// process.env.NODE_ENV !== 'production' 조건부 렌더링
// production 빌드에서 번들에서 완전 제거
if (process.env.NODE_ENV === 'production') return null;
```

### `hooks/useSubscription.ts`
```ts
// GET /api/subscription/status → 구독 상태 fetch
// daysLeft, status, plan 반환
// SWR 또는 useEffect로 주기적 폴링 가능
export function useSubscription() {
  // { status, plan, daysLeft, loading, error }
}
```

---

## 9. DB 보조 테이블

### `supabase/migrations/053_phone_verifications.sql`
```sql
create table phone_verifications (
  phone       text primary key,
  code        text not null,
  expires_at  timestamptz not null,
  verified    boolean not null default false,
  created_at  timestamptz default now()
);

-- 만료된 레코드 자동 삭제 (Supabase cron 또는 pg_cron)
-- delete from phone_verifications where expires_at < now();
```

---

## 10. 실연동 교체 가이드

실제 Solapi/Toss 연동 시 바꿀 파일:

| 현재 (Mock) | 교체 파일 | 환경변수 |
|-------------|-----------|----------|
| `lib/sms/mockProvider.ts` | `lib/sms/solapiProvider.ts` 구현 | `SMS_PROVIDER=solapi` |
| `lib/payment/mockProvider.ts` | `lib/payment/tossProvider.ts` 구현 | `PAYMENT_PROVIDER=toss` |
| `app/api/subscription/activate` | 토스 웹훅 방식으로 변경 | `TOSS_SECRET_KEY=...` |

**나머지 코드는 변경 없음** — Guard, UI, 훅 전부 Provider만 바라봄.

---

## 11. 환경변수

```env
# .env.local (개발)
SMS_PROVIDER=mock          # solapi로 교체 시 실연동
PAYMENT_PROVIDER=mock      # toss로 교체 시 실연동

# .env.production (나중에)
SMS_PROVIDER=solapi
SOLAPI_API_KEY=...
SOLAPI_SECRET=...
SENDER_PHONE=0212345678

PAYMENT_PROVIDER=toss
TOSS_SECRET_KEY=...
TOSS_CLIENT_KEY=...
```

---

## 12. 구현 순서

```
1. DB 마이그레이션 (052, 053)
2. lib/sms/ — types → mock → index
3. lib/payment/ — types → mock → index
4. lib/subscription/ — guard → trialService
5. API routes — sms/send, sms/verify, subscription/activate, subscription/dev-expire
6. app/(app)/layout.tsx — Guard 서버 체크
7. app/(app)/subscribe/page.tsx — 결제 잠금 UI
8. components/subscription/SubscriptionBanner.tsx — 체험 D-N 배너
9. hooks/useSubscription.ts
10. StepOwnerAcademy에서 createTrialSubscription() 호출 추가
11. PhoneSignupWizard → smsProvider 서버 API 호출로 교체
```
