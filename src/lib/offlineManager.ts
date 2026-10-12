/**
 * Online Connectivity & Environment Helper
 * Production architecture is Online-Only.
 */

export function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}
