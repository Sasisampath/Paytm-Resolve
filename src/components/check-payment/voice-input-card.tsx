import { AudioLines, Mic } from "lucide-react";
import type { VoiceState } from "./types";
import { cn } from "@/lib/utils";

const stateLabel: Record<VoiceState, string> = {
  idle: "Speak in Tamil",
  recording: "Listening… tap to stop",
  processing: "Reading what you said…",
  success: "Details filled in. Please review.",
  error: "Could not understand. Try again.",
  "permission-denied": "Microphone access is off",
};

/**
 * Presentational voice entry. Phase 1B: `disabled` and always `idle`, no
 * microphone permission is requested and no transcript is produced.
 * Later, a Sarvam-backed hook will drive `state` and `onPress`.
 */
export function VoiceInputCard({
  state = "idle",
  disabled = true,
  onPress,
}: {
  state?: VoiceState;
  disabled?: boolean;
  onPress?: () => void;
}) {
  const Icon = state === "recording" ? AudioLines : Mic;
  return (
    <section aria-labelledby="voice-title" className="rounded-2xl bg-cyan-soft p-4">
      <h2 id="voice-title" className="text-base font-bold text-navy">
        Tell us what happened
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        Explain your payment issue in Tamil or English.
      </p>
      <p className="mt-2 rounded-lg bg-white/70 px-3 py-2 text-sm italic text-navy">
        &ldquo;Customer ₹2,000 pay pannitaaru, aana enakku confirmation varala.&rdquo;
      </p>
      <button
        type="button"
        disabled={disabled}
        onClick={onPress}
        aria-label={disabled ? "Speak in Tamil, coming soon" : stateLabel[state]}
        className={cn(
          "mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border px-4 text-base font-semibold",
          disabled
            ? "cursor-not-allowed border-line bg-white/60 text-muted"
            : "border-navy bg-white text-navy hover:bg-white/80",
        )}
      >
        <Icon size={20} strokeWidth={2} aria-hidden="true" />
        {stateLabel[state]}
        {disabled && (
          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-navy">
            Coming soon
          </span>
        )}
      </button>
    </section>
  );
}
