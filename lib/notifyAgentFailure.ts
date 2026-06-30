/** 프로덕션 크론·에이전트 실패 시 외부 알림 (선택) */
export async function notifyAgentFailure(context: string, error: string) {
  const webhook = process.env.SLACK_WEBHOOK_URL?.trim();
  if (!webhook) return;

  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `[EduFlow] ${context}\n${error}`,
      }),
    });
  } catch {
    // 알림 실패는 크론 자체를 막지 않음
  }
}
