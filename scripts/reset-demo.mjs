/**
 * 데모 Auth 생성 + (선택) DB 시드 SQL 실행
 *
 *   npm run demo:reset
 *
 * 1) Auth 6계정 upsert
 * 2) SUPABASE_DB_PASSWORD 가 있으면 seed-eduflow-demo.sql 실행
 *    없으면 SQL Editor 안내
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

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

const DEMO_EMAILS = [
  'okto0914@gmail.com',
  'okto0915@gmail.com',
  'okto0918@gmail.com',
  'okto0919@gmail.com',
  'okto0916@gmail.com',
  'okto0917@gmail.com',
];

const DEMO_USERS = [
  { email: 'okto0914@gmail.com', password: 'okto0914!', role: 'admin', name: '김원장' },
  { email: 'okto0915@gmail.com', password: 'okto0914!', role: 'teacher', name: '이강사' },
  { email: 'okto0918@gmail.com', password: 'okto0914!', role: 'teacher', name: '박강사' },
  { email: 'okto0919@gmail.com', password: 'okto0914!', role: 'teacher', name: '최강사' },
  { email: 'okto0916@gmail.com', password: 'okto0914!', role: 'parent', name: '김학부모' },
  { email: 'okto0917@gmail.com', password: 'okto0914!', role: 'student', name: '김민준' },
];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !serviceKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY(eyJ...) 필요');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(email) {
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit;
    if (data.users.length < 200) return null;
    page += 1;
  }
}

async function upsertDemoUser(u) {
  const existing = await findUserByEmail(u.email);
  const metadata = { role: u.role, name: u.name, profile_setup: 'complete' };
  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: u.password,
      email_confirm: true,
      user_metadata: { ...existing.user_metadata, ...metadata },
    });
    if (error) throw error;
    console.log(`✓ Auth 갱신: ${u.email}`);
    return data.user.id;
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (error) throw error;
  console.log(`✓ Auth 생성: ${u.email}`);
  return data.user.id;
}

async function pruneOtherAuthUsers() {
  let page = 1;
  let removed = 0;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    for (const u of data.users) {
      const email = u.email?.toLowerCase() ?? '';
      if (!DEMO_EMAILS.includes(email)) {
        await supabase.auth.admin.deleteUser(u.id);
        removed += 1;
      }
    }
    if (data.users.length < 200) break;
    page += 1;
  }
  if (removed > 0) console.log(`✓ 기타 Auth 계정 ${removed}개 삭제`);
}

function runSeedSql() {
  return new Promise((resolvePromise, reject) => {
    const dbPassword = process.env.SUPABASE_DB_PASSWORD?.trim();
    if (!dbPassword) {
      console.log('\n※ SUPABASE_DB_PASSWORD 가 없어 SQL 시드는 건너뜁니다.');
      console.log('  Supabase Dashboard → SQL Editor 에서 아래 파일을 실행하세요:');
      console.log('  supabase/seed-eduflow-demo.sql\n');
      resolvePromise(false);
      return;
    }

    const ref = url.replace('https://', '').replace('.supabase.co', '');
    const conn = `postgresql://postgres.${ref}:${encodeURIComponent(dbPassword)}@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres`;
    const sqlPath = resolve(root, 'supabase/seed-eduflow-demo.sql');
    const sql = readFileSync(sqlPath, 'utf8');

    import('pg')
      .then(({ default: pg }) => {
        const client = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
        client
          .connect()
          .then(() => client.query(sql))
          .then(() => {
            console.log('✓ seed-eduflow-demo.sql 실행 완료');
            return client.end();
          })
          .then(() => resolvePromise(true))
          .catch((err) => {
            client.end().catch(() => {});
            reject(err);
          });
      })
      .catch(() => {
        console.log('\n※ pg 패키지 없음 — SQL Editor에서 supabase/seed-eduflow-demo.sql 실행\n');
        resolvePromise(false);
      });
  });
}

async function main() {
  console.log('=== 데모 환경 리셋 ===\n');
  await pruneOtherAuthUsers();
  for (const u of DEMO_USERS) {
    await upsertDemoUser(u);
  }
  await runSeedSql();
  console.log('\n데모 계정 (비밀번호 okto0914!):');
  console.log('  원장   okto0914@gmail.com');
  console.log('  강사1  okto0915@gmail.com → 중1A·중2A');
  console.log('  강사2  okto0918@gmail.com → 중2B·중3A');
  console.log('  강사3  okto0919@gmail.com → 중3B·고1');
  console.log('  학부모 okto0916@gmail.com → 김민준 연결');
  console.log('  학생   okto0917@gmail.com → 김민준');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
