import React, { useState, useEffect } from "react";
import { ShieldCheck, CheckCircle2, AlertTriangle, Loader2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { TaskInstance, Zone, TaskTemplate } from "../types";

interface PhotoSyncIntegrityCenterProps {
  tasks: (TaskInstance & { zone?: Zone; template?: TaskTemplate })[];
}

export default function PhotoSyncIntegrityCenter({ tasks }: PhotoSyncIntegrityCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [results, setResults] = useState<Record<string, { before: 'verified' | 'local' | 'failed' | 'checking'; after: 'verified' | 'local' | 'failed' | 'checking' }>>({});

  // Helper to check image availability
  const checkImage = async (url: string): Promise<'verified' | 'local' | 'failed'> => {
    if (!url) return 'failed';
    if (url.startsWith('data:image/')) {
      return url.length > 500 ? 'local' : 'failed';
    }
    return new Promise((resolve) => {
      const img = new Image();
      img.referrerPolicy = "no-referrer";
      img.onload = () => resolve('verified');
      img.onerror = () => resolve('failed');
      img.src = url;
    });
  };

  const handleVerify = async () => {
    setVerifying(true);
    const newResults: typeof results = {};

    for (const t of tasks) {
      if (t.photo_before_url || t.photo_after_url) {
        newResults[t.id] = {
          before: t.photo_before_url ? 'checking' : 'failed',
          after: t.photo_after_url ? 'checking' : 'failed'
        };
      }
    }
    setResults({ ...newResults });

    for (const t of tasks) {
      if (t.photo_before_url || t.photo_after_url) {
        const beforeRes = t.photo_before_url ? await checkImage(t.photo_before_url) : 'failed';
        const afterRes = t.photo_after_url ? await checkImage(t.photo_after_url) : 'failed';
        newResults[t.id] = {
          before: beforeRes,
          after: afterRes
        };
        setResults({ ...newResults });
      }
    }
    setVerifying(false);
  };

  useEffect(() => {
    if (isOpen) {
      void handleVerify();
    }
  }, [isOpen, tasks.length]);

  const tasksWithPhotos = tasks.filter(t => t.photo_before_url || t.photo_after_url);
  if (tasksWithPhotos.length === 0) return null;

  // Calculate totals
  let totalPhotos = 0;
  let syncedPhotos = 0;
  let localPhotos = 0;
  let failedPhotos = 0;

  for (const t of tasksWithPhotos) {
    if (t.photo_before_url) {
      totalPhotos++;
      const status = results[t.id]?.before;
      if (status === 'verified') syncedPhotos++;
      else if (status === 'local') localPhotos++;
      else if (status === 'failed') failedPhotos++;
      else {
        if (t.photo_before_url.startsWith('data:')) localPhotos++;
        else syncedPhotos++;
      }
    }
    if (t.photo_after_url) {
      totalPhotos++;
      const status = results[t.id]?.after;
      if (status === 'verified') syncedPhotos++;
      else if (status === 'local') localPhotos++;
      else if (status === 'failed') failedPhotos++;
      else {
        if (t.photo_after_url.startsWith('data:')) localPhotos++;
        else syncedPhotos++;
      }
    }
  }

  return (
    <div id="photo-sync-integrity-card" className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-4 mt-2 transition-all" dir="rtl">
      <div 
        id="photo-sync-header"
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 rounded-xl border border-indigo-100">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-right">
            <h4 className="text-xs font-bold text-slate-800">📸 مركز تأمين ومراقبة صحة الصور</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">
              متابعة حالة حفظ وحماية صور الإثبات من الفقدان والتحقق منها
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {failedPhotos > 0 && (
            <span className="text-[9px] bg-red-50 text-red-600 border border-red-100 py-0.5 px-1.5 rounded-full font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> {failedPhotos} تحذير
            </span>
          )}
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {/* Summary progress bar */}
      <div className="mt-3">
        <div className="flex justify-between text-[9px] font-bold text-slate-500 mb-1">
          <span>الحالة العامة للتأمين: {syncedPhotos + localPhotos} من أصل {totalPhotos} صور</span>
          <span className="text-indigo-600">{Math.round(((syncedPhotos + localPhotos) / totalPhotos) * 100)}%</span>
        </div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
          <div className="bg-emerald-500 h-full transition-all" style={{ width: `${(syncedPhotos / Math.max(1, totalPhotos)) * 100}%` }} title="سحابي مؤمن" />
          <div className="bg-amber-400 h-full transition-all" style={{ width: `${(localPhotos / Math.max(1, totalPhotos)) * 100}%` }} title="محلي مؤمن" />
          <div className="bg-red-400 h-full transition-all" style={{ width: `${(failedPhotos / Math.max(1, totalPhotos)) * 100}%` }} title="تالف أو مفقود" />
        </div>
      </div>

      {isOpen && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-[10px] font-bold">
            <span className="text-slate-500">تفاصيل صور مهام اليوم:</span>
            <button
              id="btn-reverify-photos"
              onClick={(e) => {
                e.stopPropagation();
                void handleVerify();
              }}
              disabled={verifying}
              className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${verifying ? 'animate-spin' : ''}`} />
              {verifying ? 'جاري التحقق...' : 'إعادة التحقق الفوري'}
            </button>
          </div>

          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
            {tasksWithPhotos.map((t) => {
              const beforeStatus = results[t.id]?.before;
              const afterStatus = results[t.id]?.after;

              return (
                <div key={t.id} className="bg-slate-50/70 border border-slate-100 p-2 rounded-xl flex items-center justify-between gap-3 text-right">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-200 border border-slate-200 flex-shrink-0">
                      <img
                        src={t.photo_after_url || t.photo_before_url || ""}
                        alt="Task Thumbnail"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="overflow-hidden">
                      <span className="text-[10px] font-bold text-slate-800 block truncate">{t.title}</span>
                      <span className="text-[8px] text-slate-400 block">{t.zone?.name || "منطقة مخصصة"}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 items-end flex-shrink-0">
                    {t.photo_before_url && (
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] text-slate-500">صورة قبل:</span>
                        {beforeStatus === 'checking' && <Loader2 className="w-2.5 h-2.5 animate-spin text-slate-400" />}
                        {beforeStatus === 'verified' && <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 py-0.5 px-1.5 rounded border border-emerald-100">☁️ مؤمنة سحابياً</span>}
                        {beforeStatus === 'local' && <span className="text-[8px] font-bold text-amber-600 bg-amber-50 py-0.5 px-1.5 rounded border border-amber-100">📱 محلية وآمنة</span>}
                        {beforeStatus === 'failed' && <span className="text-[8px] font-bold text-red-600 bg-red-50 py-0.5 px-1.5 rounded border border-red-100">⚠️ مفقودة أو غير متوفرة</span>}
                        {!beforeStatus && (
                          t.photo_before_url.startsWith('data:') 
                            ? <span className="text-[8px] font-bold text-amber-600 bg-amber-50 py-0.5 px-1.5 rounded border border-amber-100">📱 محلية</span>
                            : <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 py-0.5 px-1.5 rounded border border-emerald-100">☁️ سحابية</span>
                        )}
                      </div>
                    )}
                    {t.photo_after_url && (
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] text-slate-500">صورة بعد:</span>
                        {afterStatus === 'checking' && <Loader2 className="w-2.5 h-2.5 animate-spin text-slate-400" />}
                        {afterStatus === 'verified' && <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 py-0.5 px-1.5 rounded border border-emerald-100">☁️ مؤمنة سحابياً</span>}
                        {afterStatus === 'local' && <span className="text-[8px] font-bold text-amber-600 bg-amber-50 py-0.5 px-1.5 rounded border border-amber-100">📱 محلية وآمنة</span>}
                        {afterStatus === 'failed' && <span className="text-[8px] font-bold text-red-600 bg-red-50 py-0.5 px-1.5 rounded border border-red-100">⚠️ مفقودة أو غير متوفرة</span>}
                        {!afterStatus && (
                          t.photo_after_url.startsWith('data:') 
                            ? <span className="text-[8px] font-bold text-amber-600 bg-amber-50 py-0.5 px-1.5 rounded border border-amber-100">📱 محلية</span>
                            : <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 py-0.5 px-1.5 rounded border border-emerald-100">☁️ سحابية</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
