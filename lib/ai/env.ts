/** 서버 전용 — GEMINI_API_KEY / GCP 설정은 클라이언트에 노출하지 않습니다. */

export type GeminiBackend = 'studio' | 'vertex';

/** Vertex AI에서 권장되는 모델 (express / global endpoint) */
export const VERTEX_DEFAULT_MODEL = 'gemini-2.5-flash';
export const STUDIO_DEFAULT_MODEL = 'gemini-2.0-flash';

/** 404 시 순서대로 재시도 */
export const VERTEX_MODEL_FALLBACKS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash-001',
] as const;

export function getGeminiApiKey(): string | undefined {
  return (
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim() ||
    undefined
  );
}

export function getGeminiModel(backend: GeminiBackend): string {
  const explicit = process.env.GEMINI_MODEL?.trim();
  if (explicit) return explicit;
  if (backend === 'vertex') {
    return process.env.GEMINI_VERTEX_MODEL?.trim() || VERTEX_DEFAULT_MODEL;
  }
  return STUDIO_DEFAULT_MODEL;
}

export function getGoogleCloudProject(): string | undefined {
  return process.env.GOOGLE_CLOUD_PROJECT?.trim() || undefined;
}

export function getGoogleCloudLocation(): string {
  return process.env.GOOGLE_CLOUD_LOCATION?.trim() || 'global';
}

/** API 키 + express mode: global endpoint만 사용 (GCP 문서 권장) */
export function useVertexProjectEndpoint(): boolean {
  return process.env.GEMINI_VERTEX_USE_PROJECT === 'true';
}

/** Google AI Studio 키 (aistudio.google.com) */
export function isGoogleAiStudioKey(key: string): boolean {
  return key.startsWith('AIza');
}

/** Vertex AI express mode 등 GCP 콘솔 키 */
export function isVertexExpressKey(key: string): boolean {
  return key.startsWith('AQ.');
}

export function getGeminiBackend(): GeminiBackend {
  const forced = process.env.GEMINI_BACKEND?.trim().toLowerCase();
  if (forced === 'vertex' || forced === 'gcp') return 'vertex';
  if (forced === 'studio' || forced === 'aistudio') return 'studio';
  if (process.env.GEMINI_USE_VERTEX === 'true') return 'vertex';

  const key = getGeminiApiKey();
  if (!key) return 'studio';
  if (isVertexExpressKey(key)) return 'vertex';
  if (isGoogleAiStudioKey(key)) return 'studio';
  return 'vertex';
}

export type GeminiConfigStatus = 'missing' | 'ready';

export function getGeminiConfigStatus(): GeminiConfigStatus {
  return getGeminiApiKey() ? 'ready' : 'missing';
}

export function isGeminiConfigured(): boolean {
  return getGeminiConfigStatus() === 'ready';
}

export function geminiConfigHint(status: GeminiConfigStatus): string | undefined {
  if (status === 'missing') {
    return '.env.local에 GEMINI_API_KEY(또는 GOOGLE_API_KEY)가 없어 규칙 기반 문구로 생성됩니다.';
  }
  return undefined;
}

export function geminiBackendLabel(backend: GeminiBackend): string {
  return backend === 'vertex' ? 'Vertex AI (GCP)' : 'Google AI Studio';
}
