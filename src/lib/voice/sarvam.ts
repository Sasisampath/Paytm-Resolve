import "server-only";
import { SarvamAIClient } from "sarvamai";

export function sarvamClient() {
  const apiSubscriptionKey = process.env.SARVAM_API_KEY?.trim();
  if (!apiSubscriptionKey) return undefined;
  return new SarvamAIClient({ apiSubscriptionKey, timeoutInSeconds: 12, maxRetries: 0 });
}
