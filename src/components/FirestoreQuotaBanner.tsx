import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useFirestoreQuota } from "../lib/quotaManager";

interface FirestoreQuotaBannerProps {
  onRetry?: () => void;
  className?: string;
}

export default function FirestoreQuotaBanner({ onRetry, className = "" }: FirestoreQuotaBannerProps) {
  const quotaExceeded = useFirestoreQuota();

  if (!quotaExceeded) return null;

  return (
    <div
      id="firestore-quota-warning-banner"
      role="alert"
      dir="rtl"
      className={`bg-rose-600 text-white py-3.5 px-4 sticky top-0 z-[60] shadow-lg border-b border-rose-700 animate-fade-in text-right ${className}`}
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-100 shrink-0 animate-bounce" />
          <div>
            <p className="font-extrabold text-xs md:text-sm text-rose-50 flex items-center gap-2">
              ⚠️ تم تجاوز حصة قاعدة البيانات السحابية مؤقتًا. لم يتم حفظ العملية. يرجى المحاولة لاحقًا.
            </p>
            <p className="text-[10px] md:text-xs text-rose-100 mt-0.5 leading-normal">
              نظام Naris Ops يعمل بنمط السحابة المباشر (Online-Only). تم إيقاف العمليات مؤقتًا لحماية سلامة البيانات وعدم فقدان التحديثات حتى تتجدد الحصة السحابية.
            </p>
          </div>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-white/15 hover:bg-white/25 active:bg-white/35 text-white text-[10px] md:text-xs font-extrabold py-1.5 px-3 rounded-lg border border-white/25 cursor-pointer shrink-0 transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>إعادة المحاولة</span>
          </button>
        )}
      </div>
    </div>
  );
}
