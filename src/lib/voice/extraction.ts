import { isPaymentTime, isReference, toPaise } from "@/lib/payments/validation";

export type VoiceFields = {
  amountRupees: number | null;
  approximateTime: string | null;
  upiReference: string | null;
};

export type VoiceReview = VoiceFields & {
  transcript: string;
  concern: "missing_confirmation" | "customer_debit" | "other" | null;
  missing: (keyof VoiceFields)[];
  extractionAvailable: boolean;
};

const fieldNames = ["amountRupees", "approximateTime", "upiReference"] as const;
const nullableString = { type: ["string", "null"] };
const properties = {
  amountRupees: { type: ["number", "null"] },
  amountQuote: nullableString,
  approximateTime: nullableString,
  timeQuote: nullableString,
  upiReference: nullableString,
  referenceQuote: nullableString,
  concern: { enum: ["missing_confirmation", "customer_debit", "other", null] },
};
export const extractionSchema = {
  type: "object",
  additionalProperties: false,
  required: Object.keys(properties),
  properties,
};

const tamilDigits = "௦௧௨௩௪௫௬௭௮௯";
// Saaras can transcribe spoken Tamil numbers as joined words.
const joinedThousands: Record<string, string> = {
  ஓராயிரம்: "ஒரு ஆயிரம்",
  இரண்டாயிரம்: "இரண்டு ஆயிரம்",
  மூவாயிரம்: "மூன்று ஆயிரம்",
  நாலாயிரம்: "நான்கு ஆயிரம்",
  ஐந்தாயிரம்: "ஐந்து ஆயிரம்",
  ஆறாயிரம்: "ஆறு ஆயிரம்",
  ஏழாயிரம்: "ஏழு ஆயிரம்",
  எட்டாயிரம்: "எட்டு ஆயிரம்",
  ஒன்பதாயிரம்: "ஒன்பது ஆயிரம்",
  பத்தாயிரம்: "பத்து ஆயிரம்",
};
const joinedThousandsPattern = new RegExp(
  `(?<![\\p{L}\\p{M}])(?:${Object.keys(joinedThousands).join("|")})(?![\\p{L}\\p{M}])`,
  "gu",
);
const normalize = (value: string) => value.normalize("NFKC").toLowerCase()
  .replace(/[௦-௯]/g, (digit) => String(tamilDigits.indexOf(digit)))
  .replace(joinedThousandsPattern, (word) => joinedThousands[word])
  .replace(/\s+/g, " ").trim();

const numbers: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40,
  fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  oru: 1, onnu: 1, rendu: 2, irandu: 2, moonu: 3, naalu: 4, anju: 5, aaru: 6,
  ezhu: 7, ettu: 8, onbadhu: 9, pathu: 10, pathinonnu: 11, pannirandu: 12,
  ஒன்று: 1, ஒரு: 1, இரண்டு: 2, ரெண்டு: 2, மூன்று: 3, நான்கு: 4, ஐந்து: 5, ஆறு: 6,
  ஏழு: 7, எட்டு: 8, ஒன்பது: 9, பத்து: 10, பதினொன்று: 11, பன்னிரண்டு: 12,
  இருபது: 20, முப்பது: 30, நாற்பது: 40, ஐம்பது: 50, அறுபது: 60,
  எழுபது: 70, எண்பது: 80, தொண்ணூறு: 90,
};
const scales: Record<string, number> = {
  lakh: 100_000, lakhs: 100_000, latcham: 100_000, லட்சம்: 100_000,
  thousand: 1000, aayiram: 1000, ayiram: 1000, ஆயிரம்: 1000, ஆயிரத்து: 1000,
  hundred: 100, nooru: 100, நூறு: 100, நூற்று: 100,
};

function amountFromPhrase(phrase: string): number | undefined {
  const clean = phrase.trim();
  if (/^(?:\d+|\d{1,3}(?:,\d{3})+|\d{1,2}(?:,\d{2})+,\d{3})(?:\.\d{1,2})?$/.test(clean)) {
    return Number(clean.replaceAll(",", ""));
  }
  if (!clean) return undefined;
  let total = 0;
  let group = 0;
  let lastScale = Infinity;
  let previous = 0;
  for (const word of clean.split(/[ -]+/)) {
    if (word === "and" && total > 0 && group === 0 && previous === 0) {
      previous = -1;
      continue;
    }
    const value = (Object.hasOwn(numbers, word) ? numbers[word] : undefined) ?? (/^[1-9]\d?$/.test(word) ? Number(word) : undefined);
    if (value !== undefined) {
      if (previous > 0 && !(previous >= 20 && previous % 10 === 0 && value < 10)) return undefined;
      group += value;
      previous = value;
      continue;
    }
    const scale = Object.hasOwn(scales, word) ? scales[word] : undefined;
    if (scale === undefined || scale >= lastScale || previous === -1) return undefined;
    total += (group || 1) * scale;
    lastScale = scale;
    group = 0;
    previous = 0;
  }
  return previous === -1 ? undefined : total + group;
}

const rupees = "(?:rupees?|rs\\.?|inr|ரூபாய்|ரூ\\.?)";
const numericAmount = "[0-9][0-9,]*(?:\\.[0-9]{1,2})?";
const words = [...Object.keys(numbers), ...Object.keys(scales), "and"].join("|");
const amountPhrase = `(?:${numericAmount}|(?:${words})(?:[ -]+(?:${words}))*|[1-9][0-9]? (?:${Object.keys(scales).join("|")}))`;
const currencyAmount = new RegExp(
  `(?:₹|(?<![\\p{L}\\p{M}])${rupees}\\s*)\\s*(${numericAmount})(?![\\d,.]\\d|[\\d,])|(?<![\\p{L}\\p{M}\\d.,])(${amountPhrase})\\s*${rupees}(?![\\p{L}\\p{M}])`,
  "gu",
);
const referencePattern = /(?<![\p{L}\p{M}])(?:upi\s*(?:reference(?:\s*(?:number|no\.?))?|ref\.?|transaction\s*id)|reference\s*(?:number|no\.?)|utr|rrn|யுபிஐ\s*குறிப்பு\s*எண்|குறிப்பு\s*எண்)\s*(?:(?:is|number|no\.?|எண்)\s*)?[:#-]?\s*(\d+(?:[ -]\d+)*)(?![\d.]+\d)/gu;
const clockPattern = /(?<![\d:])(\d{1,2}):(\d{2})(?:\s*(a\.?m\.?|p\.?m\.?))?(?![\d:])/g;
const periodClock = /(?<![\d:\p{L}\p{M}])(\d{1,2})(?:[.:](\d{2}))?\s*(a\.?m\.?|p\.?m\.?)(?![\p{L}\p{M}])/gu;
const tamilClock = /(?<![\p{L}\p{M}])(?:காலை|மதியம்|மாலை|இரவு|kaalai|kalai|malai|maalai|iravu)\s+(\d{1,2}|[^\s]+)(?::(\d{2}))?\s+(?:மணி|mani)(?![\p{L}\p{M}])/gu;

function timesIn(text: string): string[] {
  const found = new Set<string>();
  function add(hour: number, minutes: string, period?: string) {
    if (period) {
      if (hour < 1 || hour > 12) return;
      hour = (hour % 12) + (period.startsWith("p") ? 12 : 0);
    }
    const time = `${String(hour).padStart(2, "0")}:${minutes}`;
    if (isPaymentTime(time)) found.add(time);
  }
  for (const pattern of [clockPattern, periodClock]) {
    for (const match of text.matchAll(pattern)) {
      const [, hour, minutes, period] = match;
      const context = text.slice(Math.max(0, match.index - 16), match.index + match[0].length + 24);
      if (/\b(?:ago|later|minutes?|seconds?|duration)\b|நிமிட|வினாடி/u.test(context)) continue;
      add(Number(hour), minutes ?? "00", period);
    }
  }
  for (const [phrase, hour, minutes] of text.matchAll(tamilClock)) {
    // Noon and midnight are ambiguous when described as 12 in colloquial speech.
    const value = numbers[hour] ?? Number(hour);
    if (value === 12) continue;
    add(value, minutes ?? "00", /^(?:காலை|ka?alai|kalai)/u.test(phrase) ? "am" : "pm");
  }
  return [...found];
}

const amountsIn = (text: string) => [...new Set([...text.matchAll(currencyAmount)]
  .map(([, prefix, suffix]) => amountFromPhrase(prefix ?? suffix)).filter((value): value is number => value !== undefined && toPaise(value) !== undefined))];
const referencesIn = (text: string) => [...new Set([...text.matchAll(referencePattern)]
  .map(([, value]) => value.replace(/[ -]/g, "")).filter((value) => value.length >= 12 && isReference(value)))];

function supported<T>(candidate: T | null, quote: string | null, transcript: string, find: (text: string) => T[]): T | null {
  if (candidate === null || !quote) return null;
  const normalizedQuote = normalize(quote);
  const candidates = find(transcript);
  return transcript.includes(normalizedQuote) && candidates.length === 1 && candidates[0] === candidate
    && find(normalizedQuote).includes(candidate) ? candidate : null;
}

export function reviewTranscript(transcript: string, modelReply?: string): VoiceReview {
  const fallback: VoiceReview = {
    transcript, amountRupees: null, approximateTime: null, upiReference: null,
    concern: null, missing: [...fieldNames], extractionAvailable: false,
  };
  if (!modelReply) return fallback;

  let decoded: unknown;
  try {
    decoded = JSON.parse(modelReply);
  } catch {
    return fallback;
  }
  if (typeof decoded !== "object" || decoded === null || Array.isArray(decoded)) return fallback;
  const record = decoded as Record<string, unknown>;
  if (Object.keys(record).length !== extractionSchema.required.length
    || !extractionSchema.required.every((key) => Object.hasOwn(record, key))) return fallback;

  const { amountRupees, amountQuote, approximateTime, timeQuote, upiReference, referenceQuote, concern } = record;
  const quoteValid = (value: unknown): value is string | null =>
    value === null || (typeof value === "string" && value.length <= 256 && value.trim().length > 0);
  if ((amountRupees !== null && typeof amountRupees !== "number")
    || !quoteValid(amountQuote) || !quoteValid(timeQuote) || !quoteValid(referenceQuote)
    || (approximateTime !== null && typeof approximateTime !== "string")
    || (upiReference !== null && typeof upiReference !== "string")
    || (concern !== null && concern !== "missing_confirmation" && concern !== "customer_debit" && concern !== "other")) return fallback;

  const text = normalize(transcript);
  const fields: VoiceFields = {
    amountRupees: typeof amountRupees === "number" && toPaise(amountRupees) !== undefined
      ? supported(amountRupees, amountQuote, text, amountsIn) : null,
    approximateTime: isPaymentTime(approximateTime) ? supported(approximateTime, timeQuote, text, timesIn) : null,
    upiReference: isReference(upiReference) ? supported(upiReference, referenceQuote, text, referencesIn) : null,
  };
  return { ...fields, transcript, concern, missing: fieldNames.filter((field) => fields[field] === null), extractionAvailable: true };
}
