"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  canCloseCase, decodeCases, findSavedCase, latestVerification, matchedReference, type CaseVerification, type SavedIssue,
} from "./cases";

const storageKey = "resolve-issue-cases-v1";
const changeEvent = "resolve-issue-cases-change";

function subscribe(callback: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key === storageKey || event.key === null) callback();
  }
  window.addEventListener(changeEvent, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(changeEvent, callback);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  try {
    return window.localStorage.getItem(storageKey) ?? "[]";
  } catch {
    return "";
  }
}

export function useSavedCases() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => null);
  return useMemo(() => {
    if (snapshot === null) return { cases: [], loading: true, storageError: false };
    try {
      return { cases: decodeCases(snapshot), loading: false, storageError: false };
    } catch {
      return { cases: [], loading: false, storageError: true };
    }
  }, [snapshot]);
}

function withCaseWrite<T>(write: (cases: SavedIssue[]) => T): Promise<T> {
  const run = () => write(decodeCases(getSnapshot()));
  // Keep the read and write together across tabs where Web Locks is available.
  const locks = window.navigator?.locks;
  return locks ? locks.request(storageKey, run) : Promise.resolve().then(run);
}

function persist(cases: SavedIssue[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(cases));
  window.dispatchEvent(new Event(changeEvent));
}

export function saveIssue(check: CaseVerification): Promise<SavedIssue> {
  return withCaseWrite((cases) => {
    const existing = findSavedCase(cases, check);
    if (existing) {
      const last = latestVerification(existing);
      if (existing.closedAt || existing.history.some(({ id }) => id === check.id)
        || Date.parse(check.outcome.checkedAt) <= Date.parse(last.outcome.checkedAt)) return existing;

      const updated: SavedIssue = { ...existing, history: [...existing.history, check] };
      persist(cases.map((issue) => issue.id === existing.id ? updated : issue));
      return updated;
    }
    if (check.outcome.status === "received") throw new Error("This payment is already confirmed.");

    const issue: SavedIssue = {
      id: `PR-${crypto.randomUUID().replaceAll("-", "").toUpperCase()}`,
      originCheckId: check.id,
      createdAt: new Date().toISOString(),
      history: [check],
    };
    persist([issue, ...cases]);
    return issue;
  });
}

function updateIssue(id: string, expectedCheckId: string, update: (issue: SavedIssue) => SavedIssue) {
  return withCaseWrite((cases) => {
    const index = cases.findIndex((issue) => issue.id === id);
    const issue = cases[index];
    if (!issue || issue.closedAt || latestVerification(issue).id !== expectedCheckId) return false;

    cases[index] = update(issue);
    persist(cases);
    return true;
  });
}

export function appendVerification(id: string, expectedCheckId: string, check: CaseVerification) {
  return updateIssue(id, expectedCheckId, (issue) => {
    const original = issue.history[0].request;
    const reference = matchedReference(issue);
    if (check.request.amountRupees !== original.amountRupees || check.request.paymentDate !== original.paymentDate
      || check.request.approximateTime !== original.approximateTime
      || (reference !== undefined && check.request.upiReference !== reference)) {
      throw new Error("Verification must use this case’s payment details.");
    }
    return { ...issue, history: [...issue.history, check] };
  });
}

export function closeIssue(id: string, expectedCheckId: string) {
  return updateIssue(id, expectedCheckId, (issue) => {
    if (!canCloseCase(issue)) throw new Error("A final verified outcome is required.");
    return { ...issue, closedAt: new Date().toISOString() };
  });
}
