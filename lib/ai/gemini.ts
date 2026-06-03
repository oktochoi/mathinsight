import {
  getGeminiApiKey,
  getGeminiModel,
  getGeminiBackend,
  getGoogleCloudLocation,
  getGoogleCloudProject,
  useVertexProjectEndpoint,
  VERTEX_MODEL_FALLBACKS,
  type GeminiBackend,
} from '@/lib/ai/env';

type GenerateOptions = {
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  error?: { message?: string };
};

function buildRequestBody(userPrompt: string, options: GenerateOptions) {
  return {
    systemInstruction: options.systemInstruction
      ? { parts: [{ text: options.systemInstruction }] }
      : undefined,
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature: options.temperature ?? 0.35,
      maxOutputTokens: options.maxOutputTokens ?? 2048,
    },
  };
}

function extractText(data: GeminiResponse): { text: string; finishReason?: string } {
  const candidate = data.candidates?.[0];
  const parts = candidate?.content?.parts ?? [];
  const text = parts
    .map((p) => p.text ?? '')
    .join('')
    .trim();
  const finishReason = candidate?.finishReason;

  if (!text) {
    throw new Error('Gemini 응답이 비어 있습니다.');
  }

  if (finishReason === 'MAX_TOKENS') {
    console.warn('[gemini] 응답이 maxOutputTokens에서 잘렸을 수 있습니다.');
  }

  return { text, finishReason };
}

function isModelNotFoundError(message: string): boolean {
  return /not found|does not have access|invalid model/i.test(message);
}

/** Google AI Studio — generativelanguage.googleapis.com */
async function generateWithAiStudio(
  userPrompt: string,
  options: GenerateOptions,
  apiKey: string
): Promise<string> {
  const model = getGeminiModel('studio');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildRequestBody(userPrompt, options)),
  });

  const data = (await res.json()) as GeminiResponse;
  if (!res.ok) {
    const msg = data.error?.message ?? res.statusText;
    throw new Error(`Google AI Studio 오류: ${msg}`);
  }
  return extractText(data).text;
}

function buildVertexUrl(model: string, apiKey: string): string {
  const location = getGoogleCloudLocation();
  const project = getGoogleCloudProject();

  // API 키(express mode): global endpoint — project 경로 사용 시 404 빈번
  if (!useVertexProjectEndpoint() || !project) {
    return `https://aiplatform.googleapis.com/v1/publishers/google/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  }

  const loc = location === 'global' ? 'us-central1' : location;
  return `https://${loc}-aiplatform.googleapis.com/v1/projects/${project}/locations/${loc}/publishers/google/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
}

async function vertexGenerateOnce(
  userPrompt: string,
  options: GenerateOptions,
  apiKey: string,
  model: string
): Promise<string> {
  const url = buildVertexUrl(model, apiKey);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildRequestBody(userPrompt, options)),
  });

  const data = (await res.json()) as GeminiResponse & {
    error?: { message?: string; status?: string };
  };

  if (!res.ok) {
    const msg = data.error?.message ?? res.statusText;
    throw new Error(msg);
  }
  return extractText(data).text;
}

/** Vertex AI (GCP) — express mode는 global + gemini-2.5-flash 권장 */
async function generateWithVertexAi(
  userPrompt: string,
  options: GenerateOptions,
  apiKey: string
): Promise<string> {
  const primary = getGeminiModel('vertex');
  const modelsToTry = [
    primary,
    ...VERTEX_MODEL_FALLBACKS.filter((m) => m !== primary),
  ];

  let lastError = 'Vertex AI 호출 실패';

  for (const model of modelsToTry) {
    try {
      return await vertexGenerateOnce(userPrompt, options, apiKey, model);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      lastError = message;
      if (!isModelNotFoundError(message)) {
        throw new Error(`Vertex AI 오류: ${message}`);
      }
      console.warn(`[vertex] model ${model} unavailable, trying next…`);
    }
  }

  throw new Error(
    `Vertex AI 오류: 사용 가능한 모델을 찾지 못했습니다. (${lastError}) ` +
      '.env.local에서 GEMINI_MODEL=gemini-2.5-flash 로 설정해 보세요.'
  );
}

/** 서버 전용 — 백엔드 자동 선택 (GCP 키 → Vertex, AIza → Studio) */
async function generateWithGeminiOnce(
  userPrompt: string,
  options: GenerateOptions,
  apiKey: string,
  backend: GeminiBackend
): Promise<{ text: string; finishReason?: string }> {
  if (backend === 'vertex') {
    const primary = getGeminiModel('vertex');
    const modelsToTry = [
      primary,
      ...VERTEX_MODEL_FALLBACKS.filter((m) => m !== primary),
    ];
    let lastError = 'Vertex AI 호출 실패';
    for (const model of modelsToTry) {
      try {
        const url = buildVertexUrl(model, apiKey);
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildRequestBody(userPrompt, options)),
        });
        const data = (await res.json()) as GeminiResponse & {
          error?: { message?: string };
        };
        if (!res.ok) {
          const msg = data.error?.message ?? res.statusText;
          throw new Error(msg);
        }
        return extractText(data);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        lastError = message;
        if (!isModelNotFoundError(message)) {
          throw new Error(`Vertex AI 오류: ${message}`);
        }
      }
    }
    throw new Error(`Vertex AI 오류: ${lastError}`);
  }

  const model = getGeminiModel('studio');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildRequestBody(userPrompt, options)),
  });
  const data = (await res.json()) as GeminiResponse;
  if (!res.ok) {
    const msg = data.error?.message ?? res.statusText;
    throw new Error(`Google AI Studio 오류: ${msg}`);
  }
  return extractText(data);
}

/** 서버 전용 — 백엔드 자동 선택 (GCP 키 → Vertex, AIza → Studio) */
export async function generateWithGemini(
  userPrompt: string,
  options: GenerateOptions = {}
): Promise<{ text: string; backend: GeminiBackend; finishReason?: string }> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY 또는 GOOGLE_API_KEY가 설정되지 않았습니다.');
  }

  const backend = getGeminiBackend();
  const { text, finishReason } = await generateWithGeminiOnce(
    userPrompt,
    options,
    apiKey,
    backend
  );

  return { text, backend, finishReason };
}

/** "- " 리스트 파싱 */
export function parseBulletList(text: string): string[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const bullets = lines
    .map((l) => l.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);

  return bullets.length > 0 ? bullets : [text.trim()];
}
