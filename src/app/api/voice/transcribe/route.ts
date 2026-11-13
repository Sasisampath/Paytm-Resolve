import { audioFormat, maxAudioBytes, validAudioHeader } from "@/lib/voice/audio";
import { noStore, readLimited, throttleVoice, voiceError } from "@/lib/voice/http";
import { sarvamClient } from "@/lib/voice/sarvam";
import { extractVoiceReview, sarvamFailure } from "@/lib/voice/sarvam-review";

export async function POST(request: Request) {
  const format = audioFormat(request.headers.get("content-type") ?? "");
  if (!format) return voiceError(415, "invalid_audio");

  const throttled = throttleVoice(request);
  if (throttled) return throttled;
  const client = sarvamClient();
  if (!client) return voiceError(503, "unavailable");

  try {
    const bytes = await readLimited(request, maxAudioBytes);
    if (!bytes) return voiceError(413, "invalid_audio");
    if (!validAudioHeader(bytes, format)) return voiceError(400, "invalid_audio");

    const audio = new File([bytes], `recording.${format.extension}`, { type: format.mime });
    const result = await client.speechToText.transcribe({
      file: audio, model: "saaras:v4", mode: "codemix", language_code: "unknown",
    }, { abortSignal: request.signal });
    const transcript = result.transcript?.trim();
    if (!transcript || transcript.length > 4_000) return voiceError(422, "no_transcript");

    return Response.json(await extractVoiceReview(client, transcript, request.signal), { headers: noStore });
  } catch (error) {
    return sarvamFailure(error);
  }
}
