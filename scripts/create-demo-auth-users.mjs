/**
 * EduFlow 데모 Auth 계정 4종 생성/갱신
 *
 *   npm run demo:auth
 *
 * 필요: .env.local 의 NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (eyJ... 또는 sb_secret_...)
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
    if (!val || val === '{' || val.startsWith('"type"')) continue;
    if (key === 'SUPABASE_SERVICE_ROLE_KEY') {
      if (val.startsWith('eyJ') || val.startsWith('sb_secret_')) {
        process.env.SUPABASE_SERVICE_ROLE_KEY = val;
      }
      continue;
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

/** 원장 · 강사 3 · 학부모 · 학생 (DB role) */
const DEMO_USERS = [
  { email: 'okto0914@gmail.com', password: 'okto0914!', role: 'admin', name: '김원장' },
  { email: 'okto0915@gmail.com', password: 'okto0914!', role: 'teacher', name: '이강사' },
  { email: 'okto0918@gmail.com', password: 'okto0914!', role: 'teacher', name: '박강사' },
  { email: 'okto0919@gmail.com', password: 'okto0914!', role: 'teacher', name: '최강사' },
  { email: 'okto0916@gmail.com', password: 'okto0914!', role: 'parent', name: '김학부모' },
  { email: 'okto0917@gmail.com', password: 'okto0914!', role: 'student', name: '김민준' },
];

if (!url || !serviceKey) {
  console.error(
    'NEXT_PUBLIC_SUPABASE_URL 과 SUPABASE_SERVICE_ROLE_KEY(eyJ... 또는 sb_secret_...) 가 필요합니다.'
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
  console.log('EduFlow 데모 Auth 계정 6종 생성 중...\n');
  for (const u of DEMO_USERS) {
    await upsertDemoUser(u);
  }
  console.log('\n완료 → npm run demo:seed 로 DB 시드까지 진행하세요.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
