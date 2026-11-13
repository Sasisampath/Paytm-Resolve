export const noStore = { "Cache-Control": "no-store" };

export function voiceError(status: number, code: string, headers = {}) {
  return Response.json({ code }, { status, headers: { ...noStore, ...headers } });
}

export async function readLimited(request: Request, limit: number): Promise<Uint8Array<ArrayBuffer> | null> {
  if (Number(request.headers.get("content-length")) > limit || !request.body) return null;

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) {
        void reader.cancel().catch(() => undefined);
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

let windowEnd = 0;
let total = 0;
const byClient = new Map<string, number>();

export function throttleVoice(request: Request): Response | undefined {
  const now = Date.now();
  if (now >= windowEnd) {
    windowEnd = now + 60_000;
    total = 0;
    byClient.clear();
  }
  const key = request.headers.get("x-forwarded-for")?.split(",")[0].trim().slice(0, 64) || "local";
  const count = byClient.get(key) ?? 0;
  if (total >= 48 || count >= 8) {
    return voiceError(429, "rate_limited", { "Retry-After": String(Math.ceil((windowEnd - now) / 1000)) });
  }
  byClient.set(key, count + 1);
  total++;
}
