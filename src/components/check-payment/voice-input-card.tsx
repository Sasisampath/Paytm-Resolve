"use client";

import { useEffect, useRef, useState } from "react";
import { AudioLines, Mic, Square } from "lucide-react";
import { audioFormat, maxAudioBytes, maxRecordingMs, microphoneAccessDenied } from "@/lib/voice/audio";
import type { VoiceReview } from "@/lib/voice/extraction";
import { cn } from "@/lib/utils";

type Recording = {
  stream?: MediaStream;
  recorder?: MediaRecorder;
  timer?: ReturnType<typeof setTimeout>;
  request: AbortController;
};

type State = "idle" | "permission" | "recording" | "processing" | "ready" | "denied" | "error" | "cancelled";
const concernLabels = {
  missing_confirmation: "Payment confirmation missing",
  customer_debit: "Customer reports a bank debit",
  other: "Other payment concern",
};
const missingLabels = {
  amountRupees: "payment amount",
  approximateTime: "payment time",
  upiReference: "UPI reference",
};

function release(recording: Recording) {
  clearTimeout(recording.timer);
  recording.stream?.getTracks().forEach((track) => track.stop());
}

export function VoiceInputCard({ disabled, onReview }: {
  disabled: boolean;
  onReview: (review: VoiceReview) => boolean;
}) {
  const [state, setState] = useState<State>("idle");
  const [review, setReview] = useState<VoiceReview>();
  const [message, setMessage] = useState("");
  const active = useRef<Recording | undefined>(undefined);

  useEffect(() => () => {
    const recording = active.current;
    active.current = undefined;
    if (!recording) return;
    recording.request.abort();
    if (recording.recorder?.state === "recording") recording.recorder.stop();
    release(recording);
  }, []);

  function stop(cancel: boolean) {
    const recording = active.current;
    if (!recording) return;
    if (cancel) {
      active.current = undefined;
      recording.request.abort();
      setState("cancelled");
      setMessage("Recording cancelled. You can enter the payment details below.");
    } else {
      setState("processing");
      setMessage("Transcribing and extracting payment details…");
    }
    clearTimeout(recording.timer);
    if (recording.recorder?.state === "recording") recording.recorder.stop();
    release(recording);
  }

  async function start() {
    if (active.current || disabled) return;
    setReview(undefined);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setState("error");
      setMessage("Microphone recording is unavailable here. Enter the payment details below.");
      return;
    }

    const recording: Recording = { request: new AbortController() };
    active.current = recording;
    setState("permission");
    setMessage("Allow microphone access to start recording.");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (active.current !== recording) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      recording.stream = stream;
      const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus"]
        .find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 64_000 });
      recording.recorder = recorder;
      const chunks: Blob[] = [];

      recorder.ondataavailable = ({ data }) => { if (data.size) chunks.push(data); };
      recorder.onerror = () => {
        if (active.current !== recording) return;
        active.current = undefined;
        release(recording);
        setState("error");
        setMessage("Recording failed. Try again or enter the payment details below.");
      };
      recorder.onstop = async () => {
        release(recording);
        if (active.current !== recording) return;
        setState("processing");
        setMessage("Transcribing and extracting payment details…");
        try {
          const format = audioFormat(recorder.mimeType || chunks[0]?.type || "");
          const blob = new Blob(chunks, { type: format?.mime });
          chunks.length = 0;
          if (!format || blob.size < 32 || blob.size > maxAudioBytes) {
            setState("error");
            setMessage("No usable recording. Try again or enter the payment details below.");
            return;
          }
          const response = await fetch("/api/voice/transcribe", {
            method: "POST",
            body: blob,
            signal: AbortSignal.any([recording.request.signal, AbortSignal.timeout(28_000)]),
          });
          if (active.current !== recording) return;
          if (!response.ok) {
            setState("error");
            const error: { code?: string } = await response.json().catch(() => ({}));
            if (active.current !== recording) return;
            const failure = response.status === 429
              ? "Voice requests are busy. Wait a minute or enter the payment details below."
              : error.code === "no_transcript"
                ? "No speech could be transcribed. Try again or enter the details below."
                : "Voice transcription is unavailable. Enter the payment details below.";
            setMessage(failure);
            return;
          }
          const result: VoiceReview = await response.json();
          if (active.current !== recording) return;
          const applied = onReview(result);
          setReview(result);
          setState("ready");
          setMessage(!result.extractionAvailable
            ? "The transcript is ready. Enter the payment details manually."
            : result.missing.length === 3
              ? "No payment fields could be filled from this transcript. Enter them below."
              : applied
                ? "Review the suggested details and fill in any missing fields before checking the payment."
                : "Your form edits were kept. Use the transcript to review the payment details.");
        } catch {
          if (active.current !== recording) return;
          setState("error");
          setMessage("Voice transcription is unavailable. Enter the payment details below.");
        } finally {
          if (active.current === recording) active.current = undefined;
        }
      };
      recorder.start();
      recording.timer = setTimeout(() => stop(false), maxRecordingMs);
      setState("recording");
      setMessage("Recording. Stop when you finish speaking. Limit: 25 seconds.");
    } catch (error) {
      release(recording);
      if (active.current !== recording) return;
      active.current = undefined;
      const denied = microphoneAccessDenied(error);
      setState(denied ? "denied" : "error");
      setMessage(denied
        ? "Microphone permission was denied. Allow it in your browser or enter the payment details below."
        : "The microphone is unavailable. Enter the payment details below.");
    }
  }

  const busy = state === "permission" || state === "processing";
  const Icon = state === "recording" ? Square : Mic;
  return (
    <section aria-labelledby="voice-title" className="rounded-2xl bg-cyan-soft p-4">
      <h2 id="voice-title" className="text-base font-bold text-navy">Tell us what happened</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        Speak in Tamil, Tanglish, or English. Your recording is sent to Sarvam for transcription.
      </p>
      <p className="mt-2 rounded-lg bg-white/70 px-3 py-2 text-sm italic text-navy">
        &ldquo;Customer ₹2,000 pay pannitaaru, aana enakku confirmation varala.&rdquo;
      </p>
      <button
        type="button"
        disabled={busy || (disabled && state !== "recording")}
        onClick={() => state === "recording" ? stop(false) : void start()}
        className={cn(
          "mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border bg-white px-4 text-base font-semibold disabled:border-line disabled:text-muted",
          state === "recording" ? "border-danger text-danger" : "border-navy text-navy",
        )}
      >
        <Icon size={20} aria-hidden="true" />
        {state === "recording" ? "Stop recording" : "Speak in Tamil"}
      </button>
      {(state === "permission" || state === "recording" || state === "processing") && (
        <button type="button" onClick={() => stop(true)} className="mt-1 min-h-11 w-full rounded-lg text-sm font-semibold text-navy">
          {state === "processing" ? "Cancel voice request" : "Cancel recording"}
        </button>
      )}
      <div role="status" aria-live="polite" className={cn("text-sm text-navy", message && "mt-2")}>
        {state === "recording" && <AudioLines size={18} aria-hidden="true" className="mr-1 inline align-text-bottom text-danger" />}
        {message}
      </div>
      {review && (
        <div className="mt-3 space-y-2 rounded-xl bg-white p-3 text-sm">
          <h3 className="font-bold text-ink">Transcript</h3>
          <p className="whitespace-pre-wrap break-words text-ink">{review.transcript}</p>
          {review.concern && <p className="text-muted">Reported concern: {concernLabels[review.concern]}</p>}
          {review.extractionAvailable && review.missing.length > 0 && (
            <p className="text-muted">To review: {review.missing.map((field) => missingLabels[field]).join(", ")}.</p>
          )}
        </div>
      )}
    </section>
  );
}
