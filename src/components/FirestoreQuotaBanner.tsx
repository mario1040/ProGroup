import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  WifiOff,
  CheckCircle2,
  Database,
  CloudOff
} from "lucide-react";
import { useFirestoreQuota } from "../lib/quotaManager";
import {
  isOnline,
  usePendingMutationsCount,
  useIsSyncing,
  syncAllPendingToFirestore
} from "../lib/api";

interface FirestoreQuotaBannerProps {
  onRetry?: () => void;
  className?: string;
}

export default function FirestoreQuotaBanner({ onRetry, className = "" }: FirestoreQuotaBannerProps) {
  const quotaExceeded = useFirestoreQuota();
  const pendingCount = usePendingMutationsCount();
  const isSyncing = useIsSyncing();
  const [online, setOnline] = useState(() => isOnline());
  const [syncSuccessToast, setSyncSuccessToast] = useState(false);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleSyncNow = async () => {
    try {
      const res = await syncAllPendingToFirestore();
      if (res.successCount > 0 && res.remainingCount === 0) {
        setSyncSuccessToast(true);
        setTimeout(() => setSyncSuccessToast(false), 4000);
      }
      if (onRetry) {
        onRetry();
      }
    } catch (_) {}
  };

  // Only show banner if quota exceeded OR offline OR there are pending mutations to sync
  if (!quotaExceeded && online && pendingCount === 0) return null;

  return (
    <div
      id="firestore-quota-warning-banner"
      role="alert"
      dir="rtl"
      className={`py-3 px-4 sticky top-0 z-[60] shadow-lg border-b animate-in fade-in transition-all text-right font-sans ${
        !online
          ? "bg-slate-900 border-slate-700 text-white"
          : quotaExceeded
            ? "bg-amber-600 border-amber-700 text-white"
            : "bg-indigo-900 border-indigo-700 text-white"
      } ${className}`}
    >
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/15 border border-white/20 shrink-0">
            {!online ? (
              <WifiOff className="w-5 h-5 text-amber-300 animate-pulse" />
            ) : quotaExceeded ? (
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            ) : (
              <RefreshCw className="w-5 h-5 text-indigo-300 animate-spin" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-black text-xs md:text-sm text-white">
                {!online
                  ? "انقطع الاتصال بالإنترنت - وضع الكاش المحلي الآمن نشط 🛡️"
                  : quotaExceeded
                    ? "تم استنفاد الحصة السحابية مؤقتاً - الحفظ الذكي في الكاش نشط 🛡️"
                    : "توجد تعديلات محفوظة محلياً بانتظار المزامنة 🔄"}
              </h4>

              {pendingCount > 0 && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                  {pendingCount} عملية بانتظار الرفع
                </span>
              )}

              {syncSuccessToast && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white flex items-center gap-1 animate-in fade-in">
                  <CheckCircle2 className="w-3 h-3" /> تم رفع التعديلات بنجاح
                </span>
              )}
            </div>

            <p className="text-[10px] md:text-xs text-white/90 mt-0.5 leading-normal">
              لا تقلق: كافة بياناتك ومهامك وصورك تُحفظ بأمان تام في ذاكرة جهازك دون أي فقدان أو تكرار. ستتم المزامنة تلقائياً فور توفر الاتصال أو تجدد الحصة.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <button
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="bg-white/20 hover:bg-white/30 active:scale-95 text-white text-[11px] md:text-xs font-bold py-1.5 px-3.5 rounded-xl border border-white/30 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "جارٍ المزامنة..." : "مزامنة الآن"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
