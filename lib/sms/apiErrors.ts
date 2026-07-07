/** SMS API — 클라이언트에 노출할 안전한 오류 메시지 */
export function toSmsApiError(error: unknown): { message: string; status: number } {
  const raw = error instanceof Error ? error.message : '서버 오류';

  if (raw.includes('SUPABASE_SERVICE_ROLE_KEY')) {
    return {
      message:
        '휴대폰 인증 서버 설정이 완료되지 않았습니다. 관리자에게 문의해 주세요. (서버 환경 변수 SUPABASE_SERVICE_ROLE_KEY 필요)',
      status: 503,
    };
  }

  if (raw.includes('phone_verifications') && raw.includes('does not exist')) {
    return {
      message: '휴대폰 인증 DB가 준비되지 않았습니다. 관리자에게 migration 055 적용을 요청해 주세요.',
      status: 503,
    };
  }

  return { message: raw, status: 500 };
}
