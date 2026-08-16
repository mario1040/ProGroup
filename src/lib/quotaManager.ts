import { useSyncExternalStore } from "react";

let firestoreQuotaExceededState = false;
const listeners = new Set<(exceeded: boolean) => void>();

/**
 * Detects whether an error is caused by Firestore quota / rate-limit exhaustion.
 * Preserves strict classification: network disconnections or generic permission errors
 * without quota indicators are NOT classified as quota errors.
 */
export function isFirestoreQuotaError(error: unknown): boolean {
  if (!error) return false;

  let code = "";
  let message = "";

  if (typeof error === "string") {
    message = error;
    try {
      const parsed = JSON.parse(error);
      if (parsed && typeof parsed === "object") {
        if (parsed.code) code = String(parsed.code);
        if (parsed.error) message += " " + String(parsed.error);
        if (parsed.message) message += " " + String(parsed.message);
      }
    } catch (_) {}
  } else if (typeof error === "object") {
    const errObj = error as any;
    if (errObj.code) code = String(errObj.code);
    if (errObj.message) {
      message = String(errObj.message);
      try {
        const parsed = JSON.parse(errObj.message);
        if (parsed && typeof parsed === "object") {
          if (parsed.code) code = String(parsed.code);
          if (parsed.error) message += " " + String(parsed.error);
          if (parsed.message) message += " " + String(parsed.message);
        }
      } catch (_) {}
    }
    if (errObj.error) {
      message += " " + String(errObj.error);
    }
  }

  const normalizedCode = code.toLowerCase();
  const normalizedMsg = message.toLowerCase();

  // 1. Explicit Firebase/gRPC error codes
  if (
    normalizedCode.includes("resource-exhausted") ||
    normalizedCode.includes("resource_exhausted") ||
    normalizedCode.includes("quota-exceeded") ||
    normalizedCode.includes("quota_exceeded") ||
    normalizedCode === "8" || // gRPC code 8 = RESOURCE_EXHAUSTED
    normalizedCode.includes("functions/resource-exhausted")
  ) {
    return true;
  }

  // 2. Specific message indicators
  if (
    normalizedMsg.includes("resource-exhausted") ||
    normalizedMsg.includes("resource_exhausted") ||
    normalizedMsg.includes("quota exceeded") ||
    normalizedMsg.includes("quota-exceeded") ||
    normalizedMsg.includes("quota_exceeded") ||
    normalizedMsg.includes("exceeded quota") ||
    normalizedMsg.includes("rate limit") ||
    normalizedMsg.includes("too many requests") ||
    normalizedMsg.includes("bandwidth quota") ||
    normalizedMsg.includes("write quota") ||
    normalizedMsg.includes("read quota") ||
    (normalizedMsg.includes("quota") && normalizedMsg.includes("exhausted"))
  ) {
    return true;
  }

  return false;
}

/**
 * Returns the current global Firestore quota state.
 */
export function getFirestoreQuotaExceeded(): boolean {
  return firestoreQuotaExceededState;
}

/**
 * Sets the global Firestore quota state and notifies all active listeners and window events.
 */
export function setFirestoreQuotaExceeded(exceeded: boolean): void {
  if (firestoreQuotaExceededState === exceeded) return;
  firestoreQuotaExceededState = exceeded;

  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(
        new CustomEvent("firestore_quota_changed", { detail: { exceeded } })
      );
    } catch (_) {}
  }

  listeners.forEach((listener) => {
    try {
      listener(firestoreQuotaExceededState);
    } catch (e) {
      console.error("[QuotaManager] Listener error:", e);
    }
  });
}

/**
 * Records a Firestore error. If it is a quota error, flips the global quota state to true.
 */
export function recordFirestoreError(error: unknown): void {
  if (isFirestoreQuotaError(error)) {
    console.warn("[QuotaManager] Firestore quota error detected:", error);
    setFirestoreQuotaExceeded(true);
  }
}

/**
 * Clears the Firestore quota warning upon confirmation of a successful Firestore operation.
 * Does not perform aggressive polling.
 */
export function clearFirestoreQuotaWarning(): void {
  if (firestoreQuotaExceededState) {
    console.log("[QuotaManager] Successful Firestore operation confirmed. Clearing quota warning.");
    setFirestoreQuotaExceeded(false);
  }
}

/**
 * Subscribes to global quota state changes.
 */
export function subscribeFirestoreQuota(callback: (exceeded: boolean) => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/**
 * React hook to reactively bind UI components to the global quota state.
 */
export function useFirestoreQuota(): boolean {
  return useSyncExternalStore(
    subscribeFirestoreQuota,
    getFirestoreQuotaExceeded,
    getFirestoreQuotaExceeded
  );
}
