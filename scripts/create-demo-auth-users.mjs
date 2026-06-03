/**
 * EduFlow 공모전 데모 Auth 계정 생성
 *
 * 사용법:
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/create-demo-auth-users.mjs
 *
 * .env.local 의 NEXT_PUBLIC_SUPABASE_URL 과 함께 service role 키가 필요합니다.
 * (Dashboard → Settings → API → service_role secret)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function loadEnvLocal() {
  const path = resolve(root, '.env.local');
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const key = t.slice(0, i).trim();
    const val = t.slice(i + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const DEMO_USERS = [
  { email: 'okto0914@gmail.com', password: 'okto0914!', role: 'admin', name: '김원장' },
  { email: 'okto0915@gmail.com', password: 'okto0914!', role: 'parent', name: '김학부모' },
  { email: 'okto0916@gmail.com', password: 'okto0914!', role: 'student', name: '김민준' },
];

if (!url || !serviceKey) {
  console.error(
    'NEXT_PUBLIC_SUPABASE_URL 과 SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.\n' +
      '예: SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/create-demo-auth-users.mjs'
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(email) {
  let page = 1;
  const perPage = 200;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function upsertDemoUser({ email, password, role, name }) {
  const existing = await findUserByEmail(email);
  const metadata = { role, name, profile_setup: 'complete' };

  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { ...existing.user_metadata, ...metadata },
    });
    if (error) throw error;
    console.log(`✓ 업데이트: ${email} (${data.user.id})`);
    return data.user.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (error) throw error;
  console.log(`✓ 생성: ${email} (${data.user.id})`);
  return data.user.id;
}

async function main() {
  console.log('EduFlow 데모 Auth 계정 생성 중...\n');
  for (const u of DEMO_USERS) {
    await upsertDemoUser(u);
  }
  console.log('\n완료. 이어서 Supabase SQL Editor에서 supabase/seed-eduflow-demo.sql 을 실행하세요.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
