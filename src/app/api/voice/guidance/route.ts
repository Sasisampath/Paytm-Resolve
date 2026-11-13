import { getTamilGuidance, isGuidanceStatus } from "@/lib/voice/guidance";
import { noStore, readLimited, throttleVoice, voiceError } from "@/lib/voice/http";
import { sarvamClient } from "@/lib/voice/sarvam";
import { sarvamFailure } from "@/lib/voice/sarvam-review";
import { toPaise } from "@/lib/payments/validation";

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) return voiceError(415, "invalid_guidance");
  const throttled = throttleVoice(request);
  if (throttled) return throttled;

  let input: { status?: unknown; amountRupees?: unknown } | null;
  try {
    const bytes = await readLimited(request, 256);
    if (!bytes) return voiceError(413, "invalid_guidance");
    input = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return voiceError(400, "invalid_guidance");
  }
  if (!input || typeof input !== "object" || Object.keys(input).length !== 2
    || !isGuidanceStatus(input.status) || typeof input.amountRupees !== "number" || toPaise(input.amountRupees) === undefined) {
    return voiceError(400, "invalid_guidance");
  }

  const client = sarvamClient();
  if (!client) return voiceError(503, "unavailable");

  try {
    const result = await client.textToSpeech.convert({
      text: getTamilGuidance(input.status, input.amountRupees),
      model: "bulbul:v4-flash",
      language_code: "ta-IN",
      speaker: "gokul_ta_narration",
      output_audio_codec: "mp3",
    }, { abortSignal: request.signal });
    const encoded = result.audios[0];
    if (!encoded || encoded.length > 2_000_000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
      return voiceError(503, "unavailable");
    }
    return new Response(Uint8Array.from(Buffer.from(encoded, "base64")), {
      headers: { ...noStore, "Content-Type": "audio/mpeg" },
    });
  } catch (error) {
    return sarvamFailure(error);
  }
}
