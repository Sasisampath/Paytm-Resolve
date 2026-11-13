"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { PaymentCheckOutcome, PaymentCheckRequest, PaymentFormValues } from "./types";

type SavedPaymentCheck = {
  checkId?: string;
  values: PaymentFormValues;
  request: PaymentCheckRequest;
  outcome: PaymentCheckOutcome;
};

const storageKey = "resolve-payment-check-v1";
const changeEvent = "resolve-payment-check-change";
let memoryFallback: string | null = null;

function subscribe(callback: () => void) {
  window.addEventListener(changeEvent, callback);
  return () => window.removeEventListener(changeEvent, callback);
}

function getSnapshot() {
  try {
    return window.sessionStorage.getItem(storageKey) ?? memoryFallback;
  } catch {
    return memoryFallback;
  }
}

export function savePaymentCheck(check: SavedPaymentCheck) {
  const value = JSON.stringify(check);
  memoryFallback = value;
  try {
    window.sessionStorage.setItem(storageKey, value);
  } catch {
    // The current tab can still navigate when browser storage is disabled.
  }
  window.dispatchEvent(new Event(changeEvent));
}

export function useSavedPaymentCheck(): SavedPaymentCheck | null {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => null);
  return useMemo(() => {
    if (!snapshot) return null;
    try {
      return JSON.parse(snapshot);
    } catch {
      return null;
    }
  }, [snapshot]);
}
