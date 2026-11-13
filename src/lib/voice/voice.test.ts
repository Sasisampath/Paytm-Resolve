import assert from "node:assert/strict";
import { test } from "node:test";
import { SarvamAIClient, SarvamAIError, SarvamAITimeoutError } from "sarvamai";
import { audioFormat, maxAudioBytes, microphoneAccessDenied, validAudioHeader } from "./audio";
import { reviewTranscript } from "./extraction";
import { voiceFormValues } from "./form-review";
import { getTamilGuidance, isGuidanceStatus } from "./guidance";
import { readLimited, throttleVoice } from "./http";
import { extractVoiceReview, sarvamFailure } from "./sarvam-review";

const noFields = {
  amountRupees: null, amountQuote: null,
  approximateTime: null, timeQuote: null,
  upiReference: null, referenceQuote: null,
  concern: null,
};
const reply = (fields = {}) => JSON.stringify({ ...noFields, ...fields });

test("grounds amount, clock time and reference in the transcript and populates editable fields", () => {
  const transcript = "Customer paid ₹850 at 9:21 AM. UPI reference 990000000850.";
  const review = reviewTranscript(transcript, reply({
    amountRupees: 850, amountQuote: "₹850", approximateTime: "09:21", timeQuote: "9:21 AM",
    upiReference: "990000000850", referenceQuote: "UPI reference 990000000850",
  }));
  assert.deepEqual(review.missing, []);
  assert.equal(review.transcript, transcript);
  assert.deepEqual(voiceFormValues(review), { amount: "850", approximateTime: "09:21", upiReference: "990000000850" });
});

test("supports Tamil and Tanglish amounts while leaving unstated time and reference blank", () => {
  for (const amountQuote of ["rendu aayiram rupees", "இரண்டு ஆயிரம் ரூபாய்", "இரண்டாயிரம் ரூபாய்", "௨,௦௦௦ ரூபாய்"]) {
    const transcript = `Customer ${amountQuote} pay pannitaanga. Aana confirmation varala.`;
    const review = reviewTranscript(transcript, reply({
      amountRupees: 2000, amountQuote, concern: "missing_confirmation",
    }));
    assert.equal(review.concern, "missing_confirmation");
    assert.deepEqual(review.missing, ["approximateTime", "upiReference"]);
    assert.deepEqual(voiceFormValues(review), { amount: "2000", approximateTime: "", upiReference: "" });
  }
});

test("rejects invented and unlabelled references even when unrelated digits occur", () => {
  for (const transcript of [
    "Customer phone number 990000002006.",
    "Customer gave UPI reference 990000002007.",
    "They said 990000002006 was the amount in paise.",
    "UPI reference 990000002006 or UPI reference 990000002007.",
  ]) {
    const review = reviewTranscript(transcript, reply({
      upiReference: "990000002006", referenceQuote: transcript,
    }));
    assert.equal(review.upiReference, null);
  }
});

test("rejects wrong, out of range and conflicting amounts", () => {
  for (const amountRupees of [500, 2000.005, -2000, 10_00_001]) {
    const review = reviewTranscript("Customer paid ₹2,000.", reply({ amountRupees, amountQuote: "₹2,000" }));
    assert.equal(review.amountRupees, null);
  }
  const conflicting = reviewTranscript("₹2,000 or ₹850", reply({ amountRupees: 2000, amountQuote: "₹2,000" }));
  assert.equal(conflicting.amountRupees, null);
});

test("rejects invented, invalid, relative and conflicting clock values", () => {
  for (const [transcript, approximateTime] of [
    ["I haven't got the confirmation.", "09:48"],
    ["It was 25:40", "25:40"],
    ["At 9:48 PM", "09:48"],
    ["It was 9:48 minutes ago", "09:48"],
    ["At 09:48 or 10:48", "09:48"],
  ]) {
    assert.equal(reviewTranscript(transcript, reply({ approximateTime, timeQuote: transcript })).approximateTime, null);
  }
});

test("strict structure rejects status, extra keys, invalid types and malformed JSON", () => {
  const transcript = "₹2,000";
  for (const malformed of ["{", "[]", "null", "{}", reply({ status: "received" }), reply({ amountRupees: "2000" })]) {
    const review = reviewTranscript(transcript, malformed);
    assert.equal(review.extractionAvailable, false);
    assert.equal(review.transcript, transcript);
    assert.equal(voiceFormValues(review), undefined);
  }
});

test("absent suggestions leave the manual form untouched", () => {
  const review = reviewTranscript("No payment details were mentioned.", reply());
  assert.equal(review.extractionAvailable, true);
  assert.equal(review.missing.length, 3);
  assert.equal(voiceFormValues(review), undefined);
});

test("official SDK sends only the transcript for structured extraction and preserves it on provider failure", async () => {
  const transcript = "Customer paid ₹2,000.";
  const key = "test-credential";
  let requests = 0;
  const client = new SarvamAIClient({
    apiSubscriptionKey: key,
    maxRetries: 0,
    fetch: async (input, init) => {
      requests++;
      assert.equal(String(input), "https://api.sarvam.ai/v2/chat/completions");
      assert.equal(new Headers(init?.headers).get("api-subscription-key"), key);
      const body = JSON.parse(String(init?.body));
      assert.equal(body.model, "sarvam-105b");
      assert.equal(body.reasoning_effort, "none");
      assert.deepEqual(body.messages[1], { role: "user", content: transcript });
      assert.equal(body.response_format.type, "json_schema");
      return requests === 1
        ? Response.json({ choices: [{ message: { content: reply({ amountRupees: 2000, amountQuote: "₹2,000" }) } }] })
        : Response.json({ error: { message: "Sensitive upstream detail" } }, { status: 429 });
    },
  });
  const signal = new AbortController().signal;
  assert.equal((await extractVoiceReview(client, transcript, signal)).amountRupees, 2000);
  const fallback = await extractVoiceReview(client, transcript, signal);
  assert.equal(fallback.transcript, transcript);
  assert.equal(fallback.extractionAvailable, false);
  assert.equal(voiceFormValues(fallback), undefined);
  assert.equal(requests, 2);
});

test("sanitizes rate-limit, credential, credit and timeout errors", async () => {
  for (const [upstream, expected] of [[429, 429], [403, 503], [402, 503], [500, 503]]) {
    const result = sarvamFailure(new SarvamAIError({ statusCode: upstream, body: "private upstream detail" }));
    assert.equal(result.status, expected);
    assert.deepEqual(await result.json(), { code: upstream === 429 ? "rate_limited" : "unavailable" });
  }
  assert.equal(sarvamFailure(new SarvamAITimeoutError("private detail")).status, 504);
});

test("all six Tamil guidance messages match their distinct status and only receipt confirms receipt", () => {
  const keywords = {
    received: "பெறப்பட்டது உறுதியாகியுள்ளது",
    not_verified: "உறுதிப்படுத்த முடியவில்லை",
    pending: "நிலுவையில்",
    failed: "தோல்வியடைந்ததாக",
    unavailable: "சரிபார்க்க முடியவில்லை",
    more_details_needed: "மேலும் விவரங்கள்",
  };
  const messages = new Set<string>();
  for (const [status, keyword] of Object.entries(keywords)) {
    assert.ok(isGuidanceStatus(status));
    const text = getTamilGuidance(status, 850);
    assert.ok(text.includes(keyword));
    assert.equal(text.includes("₹850"), status === "received");
    assert.equal(text.includes(keywords.received), status === "received");
    messages.add(text);
  }
  assert.equal(messages.size, 6);
  assert.equal(isGuidanceStatus("__proto__"), false);
});

test("microphone permission denial is distinct from a missing or busy device", () => {
  assert.equal(microphoneAccessDenied(new DOMException("Denied", "NotAllowedError")), true);
  assert.equal(microphoneAccessDenied(new DOMException("Blocked", "SecurityError")), true);
  assert.equal(microphoneAccessDenied(new DOMException("Missing", "NotFoundError")), false);
  assert.equal(microphoneAccessDenied(new DOMException("Busy", "NotReadableError")), false);
});

test("audio type, signature, streaming size limit and demo throttle are enforced", async () => {
  const webm = audioFormat("audio/webm;codecs=opus");
  assert.ok(webm);
  assert.equal(audioFormat("text/plain"), undefined);
  const bytes = new Uint8Array(32);
  assert.equal(validAudioHeader(bytes, webm), false);
  bytes.set([0x1a, 0x45, 0xdf, 0xa3]);
  assert.equal(validAudioHeader(bytes, webm), true);
  const stream = new ReadableStream({ start: (controller) => {
    controller.enqueue(new Uint8Array(maxAudioBytes + 1));
    controller.close();
  } });
  const request = new Request("http://localhost", { method: "POST", body: stream, duplex: "half" } as RequestInit);
  assert.equal(await readLimited(request, maxAudioBytes), null);
  const caller = new Request("http://localhost", { headers: { "x-forwarded-for": "test-caller" } });
  for (let i = 0; i < 8; i++) assert.equal(throttleVoice(caller), undefined);
  assert.equal(throttleVoice(caller)?.status, 429);
});
