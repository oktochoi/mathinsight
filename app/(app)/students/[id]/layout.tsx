/** 학생 ID는 DB에서만 존재 — 빌드 시 고정 경로 생성 안 함 */
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function StudentIdLayout({ children }: { children: React.ReactNode }) {
  return children;
}
