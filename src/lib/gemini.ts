// Uses the "-latest" model alias so this keeps working as Google rotates the
// underlying Gemini Flash model, instead of pinning a version that expires.
const GEMINI_MODEL = 'gemini-flash-latest';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export async function askCoach(
  apiKey: string,
  history: ChatMessage[],
  contextSummary: string
): Promise<string> {
  const systemInstruction = {
    parts: [
      {
        text:
          '당신은 "runner\'s high" 앱의 AI 러닝 코치입니다. 사용자의 러닝/산책/자전거 활동 기록을 바탕으로 ' +
          '친근하고 실용적인 조언을 한국어로 간결하게 제공하세요. 과장된 의학적 조언은 피하고, 가능하면 ' +
          '사용자의 실제 기록 수치를 근거로 이야기하세요.\n\n사용자 최근 활동 요약:\n' +
          contextSummary,
      },
    ],
  };

  const contents = history.map((m) => ({
    role: m.role,
    parts: [{ text: m.text }],
  }));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  let response: Response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemInstruction, contents }),
        signal: controller.signal,
      }
    );
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('응답 시간이 초과되었습니다. 네트워크 상태를 확인 후 다시 시도해주세요.');
    }
    throw new Error('네트워크 연결에 실패했습니다.');
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    if (response.status === 400 || response.status === 403) {
      throw new Error('API 키가 올바르지 않거나 권한이 없습니다. 설정 탭에서 키를 확인해주세요.');
    }
    throw new Error(`코치 응답을 받아오지 못했습니다 (${response.status}).`);
  }

  const data = await response.json();
  const text: string =
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';

  if (!text.trim()) {
    throw new Error('빈 응답을 받았습니다. 잠시 후 다시 시도해주세요.');
  }

  return text.trim();
}
