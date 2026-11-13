"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "resolve-splash-done";
const SPLASH_MS = 1400;

/**
 * Splash overlay. The animation itself is pure CSS (see globals.css) so it
 * plays and hides even if JS fails. This component only unmounts the overlay
 * and records, per session, that it has played.
 */
export function SplashGate() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let played = false;
    try {
      played = sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch {}
    if (played) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(false);
      return;
    }
    const t = setTimeout(() => {
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {}
      setVisible(false);
    }, SPLASH_MS + 50);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  const img = { src: "/assets/paytm-resolve-wordmark.png", width: 1850, height: 255 };
  return (
    <div
      aria-hidden="true"
      className="splash fixed inset-0 z-[100] flex items-center justify-center bg-white px-6"
    >
      <div className="relative w-full max-w-[420px]" style={{ aspectRatio: "1850 / 255" }}>
        {/* eslint-disable @next/next/no-img-element */}
        <img {...img} alt="" className="splash-paytm absolute inset-0 h-full w-full" />
        <img {...img} alt="" className="splash-resolve absolute inset-0 h-full w-full" />
        <img {...img} alt="" className="splash-check absolute inset-0 h-full w-full" />
        {/* eslint-enable @next/next/no-img-element */}
      </div>
    </div>
  );
}
