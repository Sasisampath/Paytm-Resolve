"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import type { PaymentCheckOutcome } from "@/lib/payments/types";
import { getTamilGuidance } from "@/lib/voice/guidance";

export function TamilGuidance({ status, amountRupees }: {
  status: PaymentCheckOutcome["status"];
  amountRupees: number;
}) {
  const [source, setSource] = useState<string>();
  const [message, setMessage] = useState("");
  const request = useRef<AbortController | undefined>(undefined);
  const audioUrl = useRef<string | undefined>(undefined);
  const player = useRef<HTMLAudioElement>(null);

  useEffect(() => () => {
    request.current?.abort();
    if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
    audioUrl.current = undefined;
  }, []);

  async function prepareAudio() {
    if (request.current || audioUrl.current) return;
    const controller = new AbortController();
    request.current = controller;
    setMessage("Loading Tamil audio…");
    try {
      const response = await fetch("/api/voice/guidance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, amountRupees }),
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]),
      });
      if (!response.ok || !response.headers.get("content-type")?.startsWith("audio/mpeg")) {
        setMessage(response.status === 429 ? "Audio is busy. Try again in a minute." : "Tamil audio is unavailable. You can read the guidance below.");
        return;
      }
      const audio = await response.blob();
      if (controller.signal.aborted) return;
      audioUrl.current = URL.createObjectURL(audio);
      setSource(audioUrl.current);
      setMessage("Tamil audio ready. Press Play to listen.");
    } catch {
      if (!controller.signal.aborted) setMessage("Tamil audio is unavailable. You can read the guidance below.");
    } finally {
      if (request.current === controller) request.current = undefined;
    }
  }

  function clearAudio() {
    player.current?.pause();
    if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
    audioUrl.current = undefined;
    setSource(undefined);
    setMessage("Tamil audio is unavailable. You can read the guidance below.");
  }

  return (
    <section aria-labelledby="tamil-guidance-title" className="space-y-2 rounded-xl border border-line bg-white p-4">
      <h2 id="tamil-guidance-title" className="flex items-center gap-2 font-bold text-navy">
        <Volume2 size={18} aria-hidden="true" /> Tamil guidance
      </h2>
      <p lang="ta" className="text-sm leading-relaxed text-ink">{getTamilGuidance(status, amountRupees)}</p>
      {source ? (
        <audio
          ref={player}
          src={source}
          controls
          preload="metadata"
          aria-label="Tamil guidance audio"
          onError={clearAudio}
          className="w-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => void prepareAudio()}
          disabled={message === "Loading Tamil audio…"}
          className="min-h-11 w-full rounded-xl border border-line px-4 text-sm font-semibold text-navy hover:bg-cyan-soft disabled:text-muted"
        >
          Listen in Tamil
        </button>
      )}
      <p role="status" className={message ? "text-sm text-muted" : "sr-only"}>{message}</p>
    </section>
  );
}
