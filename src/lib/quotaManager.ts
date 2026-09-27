import { useSyncExternalStore } from "react";

let firestoreQuotaExceededState = false;
const listeners = new Set<(exceeded: boolean) => void>();

export type QuotaCategory = 
  | "admin"               // لوحة تحكم الإدارة (المهام، الكوادر، النطاقات، مؤشرات الأداء، السجلات)
  | "cleaners"            // تطبيق عمال النظافة (عرض مهام اليوم، بنود الفحص، رفع الصور، تسليم المهمة، مؤشراتي)
  | "auth_session"        // تسجيل الدخول، استرجاع الجلسة، والتحقق الدوري في الخلفية
  | "realtime_listeners"  // الاستماع المباشر للسحابة (onSnapshot)
  | "background_tasks";   // توليد المهام المتكررة، الفحص الأولي للبيانات

export type QuotaOperationType = "read" | "write" | "delete" | "realtime_read";

export interface QuotaEvent {
  id: string;
  timestamp: number;
  timeFormatted: string;
  category: QuotaCategory;
  categoryLabel: string;
  action: string;
  collection: string;
  operation: QuotaOperationType;
  docCount: number;
  isCacheHit: boolean;
  notes?: string;
}

export interface QuotaCategoryStats {
  reads: number;
  writes: number;
  realtimeReads: number;
  deletes: number;
  cacheHits: number;
  totalOps: number;
  percentageOfReads: number;
}

export interface QuotaTelemetryStats {
  date: string;
  totalCloudReads: number;
  totalCloudWrites: number;
  totalRealtimeReads: number;
  totalCloudDeletes: number;
  totalCacheSavedReads: number;
  // Free tier limits for Firebase Spark Plan
  dailyReadLimit: number;
  dailyWriteLimit: number;
  categories: Record<QuotaCategory, QuotaCategoryStats>;
  recentEvents: QuotaEvent[];
  ultraQuotaSaver: boolean;
  skipSessionFocusChecks: boolean;
}

const CATEGORY_LABELS: Record<QuotaCategory, string> = {
  admin: "لوحة تحكم الإدارة (Admin Dashboard)",
  cleaners: "تطبيق عمال النظافة (Cleaners App)",
  auth_session: "تسجيل الدخول والجلسات (Login & Session)",
  realtime_listeners: "الاستماع اللحظي (Real-time Snapshots)",
  background_tasks: "التوليد التلقائي والتهيئة (Auto-Sync & Seed)"
};

// Global active context for attributing queries to their initiator
let currentCallerContext: { category: QuotaCategory; action: string } = {
  category: "admin",
  action: "تهيئة النظام"
};

export function setQuotaCallerContext(category: QuotaCategory, action: string) {
  currentCallerContext = { category, action };
}

export function getQuotaCallerContext() {
  return currentCallerContext;
}

export function withQuotaContext<T>(category: QuotaCategory, action: string, fn: () => T): T {
  const prev = currentCallerContext;
  currentCallerContext = { category, action };
  try {
    return fn();
  } finally {
    currentCallerContext = prev;
  }
}

export async function withQuotaContextAsync<T>(category: QuotaCategory, action: string, fn: () => Promise<T>): Promise<T> {
  const prev = currentCallerContext;
  currentCallerContext = { category, action };
  try {
    return await fn();
  } finally {
    currentCallerContext = prev;
  }
}

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const STATS_STORAGE_PREFIX = "naris_quota_telemetry_";
const ULTRA_SAVER_KEY = "naris_ultra_quota_saver";
const SKIP_FOCUS_KEY = "naris_skip_session_focus_checks";

// In-memory state with persistence
let statsState: QuotaTelemetryStats = loadInitialStats();
const statsListeners = new Set<(stats: QuotaTelemetryStats) => void>();

function initEmptyCategories(): Record<QuotaCategory, QuotaCategoryStats> {
  return {
    admin: { reads: 0, writes: 0, realtimeReads: 0, deletes: 0, cacheHits: 0, totalOps: 0, percentageOfReads: 0 },
    cleaners: { reads: 0, writes: 0, realtimeReads: 0, deletes: 0, cacheHits: 0, totalOps: 0, percentageOfReads: 0 },
    auth_session: { reads: 0, writes: 0, realtimeReads: 0, deletes: 0, cacheHits: 0, totalOps: 0, percentageOfReads: 0 },
    realtime_listeners: { reads: 0, writes: 0, realtimeReads: 0, deletes: 0, cacheHits: 0, totalOps: 0, percentageOfReads: 0 },
    background_tasks: { reads: 0, writes: 0, realtimeReads: 0, deletes: 0, cacheHits: 0, totalOps: 0, percentageOfReads: 0 }
  };
}

function loadInitialStats(): QuotaTelemetryStats {
  const today = getTodayKey();
  const defaultUltraSaver = true; // Default ON to protect user quota out of the box
  const defaultSkipFocus = true;

  if (typeof localStorage === "undefined") {
    return {
      date: today,
      totalCloudReads: 0,
      totalCloudWrites: 0,
      totalRealtimeReads: 0,
      totalCloudDeletes: 0,
      totalCacheSavedReads: 0,
      dailyReadLimit: 50000,
      dailyWriteLimit: 20000,
      categories: initEmptyCategories(),
      recentEvents: [],
      ultraQuotaSaver: defaultUltraSaver,
      skipSessionFocusChecks: defaultSkipFocus
    };
  }

  let ultraSaver = defaultUltraSaver;
  const storedUltra = localStorage.getItem(ULTRA_SAVER_KEY);
  if (storedUltra !== null) {
    ultraSaver = storedUltra === "true";
  }

  let skipFocus = defaultSkipFocus;
  const storedSkip = localStorage.getItem(SKIP_FOCUS_KEY);
  if (storedSkip !== null) {
    skipFocus = storedSkip === "true";
  }

  try {
    const raw = localStorage.getItem(`${STATS_STORAGE_PREFIX}${today}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.date === today) {
        return {
          ...parsed,
          dailyReadLimit: 50000,
          dailyWriteLimit: 20000,
          ultraQuotaSaver: ultraSaver,
          skipSessionFocusChecks: skipFocus,
          recentEvents: Array.isArray(parsed.recentEvents) ? parsed.recentEvents : []
        };
      }
    }
  } catch (_) {}

  return {
    date: today,
    totalCloudReads: 0,
    totalCloudWrites: 0,
    totalRealtimeReads: 0,
    totalCloudDeletes: 0,
    totalCacheSavedReads: 0,
    dailyReadLimit: 50000,
    dailyWriteLimit: 20000,
    categories: initEmptyCategories(),
    recentEvents: [],
    ultraQuotaSaver: ultraSaver,
    skipSessionFocusChecks: skipFocus
  };
}

function persistStats(stats: QuotaTelemetryStats) {
  if (typeof localStorage === "undefined") return;
  try {
    const toSave = {
      ...stats,
      // Only keep the latest 40 events in localStorage to stay lightweight
      recentEvents: stats.recentEvents.slice(0, 40)
    };
    localStorage.setItem(`${STATS_STORAGE_PREFIX}${stats.date}`, JSON.stringify(toSave));
  } catch (_) {}
}

function notifyStatsListeners() {
  statsListeners.forEach((fn) => {
    try {
      fn(statsState);
    } catch (e) {
      console.error("[QuotaTelemetry] Listener error:", e);
    }
  });
}

/**
 * Main telemetry recorder called by Firestore wrapper functions in api.ts
 */
export function recordQuotaUsage(params: {
  category?: QuotaCategory;
  action?: string;
  collection: string;
  operation: QuotaOperationType;
  docCount: number;
  isCacheHit: boolean;
  notes?: string;
}) {
  const today = getTodayKey();
  if (statsState.date !== today) {
    // New day reset
    statsState = {
      date: today,
      totalCloudReads: 0,
      totalCloudWrites: 0,
      totalRealtimeReads: 0,
      totalCloudDeletes: 0,
      totalCacheSavedReads: 0,
      dailyReadLimit: 50000,
      dailyWriteLimit: 20000,
      categories: initEmptyCategories(),
      recentEvents: [],
      ultraQuotaSaver: statsState.ultraQuotaSaver,
      skipSessionFocusChecks: statsState.skipSessionFocusChecks
    };
  }

  const category = params.category || currentCallerContext.category;
  const action = params.action || currentCallerContext.action;
  const docCount = Math.max(1, params.docCount || 1);

  const event: QuotaEvent = {
    id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    timeFormatted: new Date().toLocaleTimeString("ar-EG", { hour12: true, hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    category,
    categoryLabel: CATEGORY_LABELS[category] || category,
    action,
    collection: params.collection,
    operation: params.operation,
    docCount,
    isCacheHit: params.isCacheHit,
    notes: params.notes
  };

  const catStats = statsState.categories[category] || {
    reads: 0, writes: 0, realtimeReads: 0, deletes: 0, cacheHits: 0, totalOps: 0, percentageOfReads: 0
  };

  if (params.isCacheHit) {
    statsState.totalCacheSavedReads += docCount;
    catStats.cacheHits += docCount;
  } else {
    if (params.operation === "read") {
      statsState.totalCloudReads += docCount;
      catStats.reads += docCount;
    } else if (params.operation === "realtime_read") {
      statsState.totalRealtimeReads += docCount;
      catStats.realtimeReads += docCount;
    } else if (params.operation === "write") {
      statsState.totalCloudWrites += docCount;
      catStats.writes += docCount;
    } else if (params.operation === "delete") {
      statsState.totalCloudDeletes += docCount;
      catStats.deletes += docCount;
    }
  }

  catStats.totalOps += docCount;
  statsState.categories[category] = catStats;

  // Recalculate read percentages
  const totalReads = (statsState.totalCloudReads + statsState.totalRealtimeReads) || 1;
  (Object.keys(statsState.categories) as QuotaCategory[]).forEach((catKey) => {
    const c = statsState.categories[catKey];
    const catReadOps = c.reads + c.realtimeReads;
    c.percentageOfReads = Math.round((catReadOps / totalReads) * 100);
  });

  // Prepend event, limit to 60 in memory
  statsState.recentEvents = [event, ...statsState.recentEvents.slice(0, 59)];

  persistStats(statsState);
  notifyStatsListeners();
}

export function getQuotaTelemetryStats(): QuotaTelemetryStats {
  return statsState;
}

export function resetQuotaTelemetryStats(): void {
  const today = getTodayKey();
  statsState = {
    date: today,
    totalCloudReads: 0,
    totalCloudWrites: 0,
    totalRealtimeReads: 0,
    totalCloudDeletes: 0,
    totalCacheSavedReads: 0,
    dailyReadLimit: 50000,
    dailyWriteLimit: 20000,
    categories: initEmptyCategories(),
    recentEvents: [],
    ultraQuotaSaver: statsState.ultraQuotaSaver,
    skipSessionFocusChecks: statsState.skipSessionFocusChecks
  };
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(`${STATS_STORAGE_PREFIX}${today}`);
    } catch (_) {}
  }
  notifyStatsListeners();
}

export function setUltraQuotaSaverEnabled(enabled: boolean): void {
  statsState.ultraQuotaSaver = enabled;
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(ULTRA_SAVER_KEY, String(enabled));
  }
  notifyStatsListeners();
}

export function isUltraQuotaSaverEnabled(): boolean {
  return statsState.ultraQuotaSaver;
}

export function setSkipSessionFocusChecksEnabled(enabled: boolean): void {
  statsState.skipSessionFocusChecks = enabled;
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(SKIP_FOCUS_KEY, String(enabled));
  }
  notifyStatsListeners();
}

export function isSkipSessionFocusChecksEnabled(): boolean {
  return statsState.skipSessionFocusChecks;
}

export function subscribeQuotaTelemetry(callback: (stats: QuotaTelemetryStats) => void): () => void {
  statsListeners.add(callback);
  return () => {
    statsListeners.delete(callback);
  };
}

export function useQuotaTelemetry(): QuotaTelemetryStats {
  return useSyncExternalStore(
    subscribeQuotaTelemetry,
    getQuotaTelemetryStats,
    getQuotaTelemetryStats
  );
}

/**
 * Intelligent Audit Diagnostic Scanner that answers:
 * "Where is the quota being wasted? Is it from Admin, Cleaners, or Logins/Sessions?"
 */
export interface QuotaScanResult {
  scanTimestamp: string;
  totalReads: number;
  totalWrites: number;
  totalRealtime: number;
  savedByCache: number;
  riskLevel: "safe" | "moderate" | "critical";
  mainCulprit: {
    category: QuotaCategory;
    title: string;
    percentage: number;
    readsCount: number;
    description: string;
  };
  breakdown: Array<{
    category: QuotaCategory;
    title: string;
    percentage: number;
    reads: number;
    writes: number;
    realtime: number;
    saved: number;
    isHighest: boolean;
  }>;
  findings: string[];
  recommendations: string[];
}

export function runQuotaAuditScan(): QuotaScanResult {
  const stats = getQuotaTelemetryStats();
  const totalCombinedReads = stats.totalCloudReads + stats.totalRealtimeReads;
  const safeDivisor = totalCombinedReads > 0 ? totalCombinedReads : 1;

  // Breakdown across all 4 main categories
  const categoriesList: QuotaCategory[] = ["admin", "cleaners", "auth_session", "realtime_listeners", "background_tasks"];
  const breakdown = categoriesList.map((catKey) => {
    const c = stats.categories[catKey];
    const catReads = c.reads + c.realtimeReads;
    const percentage = Math.round((catReads / safeDivisor) * 100);
    return {
      category: catKey,
      title: CATEGORY_LABELS[catKey],
      percentage,
      reads: c.reads,
      writes: c.writes,
      realtime: c.realtimeReads,
      saved: c.cacheHits,
      isHighest: false
    };
  });

  // Sort by reads descending
  breakdown.sort((a, b) => (b.reads + b.realtime) - (a.reads + a.realtime));
  if (breakdown.length > 0 && (breakdown[0].reads + breakdown[0].realtime) > 0) {
    breakdown[0].isHighest = true;
  }

  const highest = breakdown[0];

  // Evaluate risk level based on 50,000 daily read limit
  let riskLevel: "safe" | "moderate" | "critical" = "safe";
  if (totalCombinedReads > 40000 || stats.totalCloudWrites > 16000) {
    riskLevel = "critical";
  } else if (totalCombinedReads > 25000 || stats.totalCloudWrites > 10000) {
    riskLevel = "moderate";
  }

  const findings: string[] = [];
  const recommendations: string[] = [];

  // Tailored diagnostics
  if (totalCombinedReads === 0) {
    findings.push("لم يتم تسجيل عمليات قراءة سحابية جديدة حتى الآن، أو أن الذاكرة المؤقتة (Smart Cache) استوعبت كافة الطلبات بنجاح.");
    recommendations.push("استمر بتفعيل وضع التوفير الفائق (Ultra Quota-Saver) لضمان بقاء الاستهلاك قريباً من الصفر.");
  } else {
    // Analyze Admin consumption
    const adminReads = stats.categories.admin.reads + stats.categories.admin.realtimeReads;
    const cleanerReads = stats.categories.cleaners.reads + stats.categories.cleaners.realtimeReads;
    const authReads = stats.categories.auth_session.reads;
    const realtimeReads = stats.categories.realtime_listeners.realtimeReads;

    if (adminReads > cleanerReads && adminReads > authReads) {
      findings.push(`لوحة تحكم الإدارة (Admin Dashboard) هي المستهلك الأكبر بنسبة ${highest.percentage}% بإجمالي ${adminReads} قراءة سحابية.`);
      findings.push("أكبر عمليات الإدارة استهلاكاً هي: استعلامات مؤشرات KPI وجدول المهام اللحظي وتحميل الكوادر والمناطق.");
      recommendations.push("الاعتماد على التحديث اليدوي (Manual Refresh) في لوحة الإدارة وتفعيل كاش مؤشرات KPI (15-60 دقيقة).");
    } else if (cleanerReads > adminReads && cleanerReads > authReads) {
      findings.push(`تطبيق عمال النظافة هو المستهلك الأكبر بنسبة ${highest.percentage}% بإجمالي ${cleanerReads} قراءة.`);
      findings.push("السبب الرئيسي هو: فتح بطاقات المهام المتعددة وتحميل الصور وقوائم الفحص المتكررة.");
      recommendations.push("تم تفعيل الفلترة المباشرة على مستوى السيرفر (assigned_to == cleanerId) لمنع تحميل مهام المنشأة بالكامل لهواتف العمال.");
    } else if (authReads >= adminReads && authReads >= cleanerReads) {
      findings.push(`عمليات تسجيل الدخول وفحص الجلسات تستهلك النسبة الأكبر (${highest.percentage}% بإجمالي ${authReads} قراءة).`);
      findings.push("السبب: فحص الجلسة وإعادة قراءة بيانات المستخدم كلما تم قفل شاشة الهاتف أو التبديل بين الكاميرا والمتصفح.");
      recommendations.push("تفعيل قفل فحص الجلسة عند العودة للشاشة (Skip Focus Checks) يمنع هذا الهدر فورياً 100%.");
    }

    if (realtimeReads > 1000) {
      findings.push(`الاستماع اللحظي (onSnapshot) استهلك ${realtimeReads} قراءة بسبب كثرة التحديثات المتزامنة.`);
      recommendations.push("دمج التحديثات المتزامنة (Debouncing) وتجنب إعادة طلب البيانات الثابتة داخل دوال الاستماع.");
    }

    if (stats.totalCacheSavedReads > 0) {
      findings.push(`الذاكرة الذكية (Smart Multi-Tab Cache) وفرت حتى الآن ${stats.totalCacheSavedReads} قراءة من كوتة السحابة مجاناً!`);
    }
  }

  let culpritDesc = "";
  if (highest.category === "admin") {
    culpritDesc = "لوحة تحكم الإدارة أثناء عرض المهام وجداول الـ KPI وسجلات التشغيل.";
  } else if (highest.category === "cleaners") {
    culpritDesc = "هواتف عمال النظافة أثناء متابعة مهام اليوم ورفع الصور وإتمام البنود.";
  } else if (highest.category === "auth_session") {
    culpritDesc = "الدخول والخروج وإعادة فحص الجلسة عند قفل شاشات الهواتف والعودة للتطبيق.";
  } else if (highest.category === "realtime_listeners") {
    culpritDesc = "الاستماع اللحظي التلقائي لتحديثات المهام والمهام المتزامنة.";
  } else {
    culpritDesc = "توليد المهام المتكررة اليومية وفحص تهيئة قاعدة البيانات.";
  }

  return {
    scanTimestamp: new Date().toLocaleTimeString("ar-EG"),
    totalReads: totalCombinedReads,
    totalWrites: stats.totalCloudWrites,
    totalRealtime: stats.totalRealtimeReads,
    savedByCache: stats.totalCacheSavedReads,
    riskLevel,
    mainCulprit: {
      category: highest.category,
      title: highest.title,
      percentage: highest.percentage,
      readsCount: highest.reads + highest.realtime,
      description: culpritDesc
    },
    breakdown,
    findings,
    recommendations
  };
}

// -------------------------------------------------------------
// Existing Quota Error Detection Logic (Preserved)
// -------------------------------------------------------------
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

  // Explicit Firebase/gRPC error codes
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

  // Specific message indicators
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

export function getFirestoreQuotaExceeded(): boolean {
  return firestoreQuotaExceededState;
}

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

export function recordFirestoreError(error: unknown): void {
  if (isFirestoreQuotaError(error)) {
    console.warn("[QuotaManager] Firestore quota error detected:", error);
    setFirestoreQuotaExceeded(true);
  }
}

export function clearFirestoreQuotaWarning(): void {
  if (firestoreQuotaExceededState) {
    console.log("[QuotaManager] Successful Firestore operation confirmed. Clearing quota warning.");
    setFirestoreQuotaExceeded(false);
  }
}

export function subscribeFirestoreQuota(callback: (exceeded: boolean) => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function useFirestoreQuota(): boolean {
  return useSyncExternalStore(
    subscribeFirestoreQuota,
    getFirestoreQuotaExceeded,
    getFirestoreQuotaExceeded
  );
}
