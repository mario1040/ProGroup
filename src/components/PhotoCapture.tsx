import React, { useState, useRef, useEffect } from "react";
import { Camera, RefreshCw, Upload, CheckCircle, Loader2, AlertCircle, Trash2, ShieldCheck } from "lucide-react";
import { uploadPhotoTask, compressImage } from "../lib/api";
import { getDownloadURL, UploadTask } from "firebase/storage";

interface PhotoCaptureProps {
  label: string;
  onPhotoUploaded: (metadata: { url: string; size: number; mimeType: string; takenAt: string }) => void;
  required?: boolean;
  storagePath: string; // Structured path for Firebase Storage: e.g. task-photos/{zoneId}/{taskInstanceId}/after.jpg
  disabled?: boolean;
}

export default function PhotoCapture({ label, onPhotoUploaded, required = true, storagePath, disabled = false }: PhotoCaptureProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rawBase64, setRawBase64] = useState<string | null>(null);
  const [compressedBase64, setCompressedBase64] = useState<string | null>(null);
  
  const [uploading, setUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Concurrency lock ref to prevent rapid multi-click/multi-touch duplicates
  const isUploadingRef = useRef(false);
  const activeTaskRef = useRef<UploadTask | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const isCanceledByUserRef = useRef(false);

  // Metadata states
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [takenAt, setTakenAt] = useState<string>("");
  const [activeTask, setActiveTask] = useState<UploadTask | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Run cleanup only when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
      if (activeTaskRef.current) {
        try {
          activeTaskRef.current.cancel();
        } catch {
          // Ignore
        }
        activeTaskRef.current = null;
      }
    };
  }, []);

  const triggerCamera = () => {
    if (disabled || uploading || isCompressing) return;
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploadedUrl(null);
    setProgress(0);
    
    // File Validation
    const maxSize = 15 * 1024 * 1024; // 15MB
    if (file.size > maxSize) {
      setError("حجم الصورة كبير جداً. الحد الأقصى المسموح به هو 15 ميجابايت.");
      return;
    }
    
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
    if (file.type && !validTypes.includes(file.type.toLowerCase())) {
      setError("نوع الملف غير مدعوم. يرجى اختيار صورة بصيغة JPG، PNG، أو WEBP.");
      return;
    }

    const size = file.size;
    const timeStr = new Date().toISOString();

    setOriginalSize(size);
    setMimeType("image/jpeg");
    setTakenAt(timeStr);

    // Create immediate local blob URL preview for responsiveness
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    const localUrl = URL.createObjectURL(file);
    previewUrlRef.current = localUrl;
    setPreviewUrl(localUrl);
    setIsCompressing(true);

    // Read and compress image client-side to target max 1600x1600 @ 0.75 JPEG
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Str = reader.result as string;
      setRawBase64(base64Str);
      
      try {
        const compressed = await compressImage(base64Str, 1600, 1600, 0.75);
        setCompressedBase64(compressed);
        
        // Calculate compressed payload size in bytes
        const base64Data = compressed.split(",")[1] || "";
        const compSize = Math.round((base64Data.length * 3) / 4);
        setCompressedSize(compSize);
      } catch (err) {
        console.warn("[PhotoCapture] Client-side compression warning, using original:", err);
        setCompressedBase64(base64Str);
        setCompressedSize(size);
      } finally {
        setIsCompressing(false);
      }
    };
    reader.onerror = () => {
      setError("حدث خطأ أثناء قراءة ملف الصورة من الكاميرا.");
      setIsCompressing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmUpload = async () => {
    if (isUploadingRef.current || uploading || disabled) {
      console.warn("[PhotoCapture] Upload already in progress, ignoring duplicate call.");
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError("لا يوجد اتصال بالإنترنت حالياً. يتطلب التطبيق اتصالاً نشطاً لرفع الصور وحفظها.");
      return;
    }

    const payload = compressedBase64 || rawBase64;
    if (!payload) {
      setError("لم يتم اختيار صورة بعد. يرجى فتح الكاميرا والتقاط صورة أولاً.");
      return;
    }

    // 1. Verify storagePath
    const pathSegments = storagePath.split("/");
    const zoneId = pathSegments[1];
    const taskInstanceId = pathSegments[2];

    if (!zoneId || zoneId === "undefined" || zoneId === "null" || !taskInstanceId || taskInstanceId === "undefined" || taskInstanceId === "null") {
      const errorMsg = `خطأ في مسار التخزين السحابي: معرّف المنطقة (${zoneId}) أو معرّف المهمة (${taskInstanceId}) غير صالح.`;
      console.error(`[PhotoCapture] ❌ Validation failed: ${errorMsg}`);
      setError(errorMsg);
      return;
    }

    // Acquire concurrency lock
    isUploadingRef.current = true;
    setUploading(true);
    setProgress(0);
    setError(null);

    console.log("[PhotoCapture] 🚀 Starting upload to Firebase Storage:", {
      storagePath,
      originalSize,
      compressedSize,
      mimeType: "image/jpeg"
    });

    isCanceledByUserRef.current = false;

    try {
      const { task: uploadTask } = await uploadPhotoTask(payload, storagePath);
      activeTaskRef.current = uploadTask;
      setActiveTask(uploadTask);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          if (snapshot.totalBytes > 0) {
            const p = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setProgress(Math.min(p, 99)); // Keep 99 until downloadURL verified
          }
        },
        (err: any) => {
          activeTaskRef.current = null;
          isUploadingRef.current = false;
          setActiveTask(null);
          setUploading(false);

          if (err?.code === "storage/canceled") {
            if (isCanceledByUserRef.current) {
              console.log("[PhotoCapture] Upload canceled by user.");
              setError("تم إلغاء عملية الرفع.");
            }
            return;
          }

          console.error("[PhotoCapture] ❌ Storage Upload Error:", err);
          
          let errorMsg = "تعذر رفع الصورة إلى خوادم التخزين السحابي. يرجى التأكد من جودة الإنترنت والمحاولة مرة أخرى.";
          if (err?.code === "storage/retry-limit-exceeded") {
            errorMsg = "استغرقت عملية الرفع وقتاً طويلاً بسبب بطء الاتصال. يرجى الضغط على زر 'إعادة المحاولة'.";
          } else if (err?.code === "storage/unauthorized") {
            errorMsg = "تم رفض صلاحية الوصول للتخزين السحابي لهذا المسار.";
          } else if (err?.message) {
            errorMsg = `فشل الرفع السحابي: ${err.message}`;
          }
          setError(errorMsg);
        },
        async () => {
          try {
            const imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
            if (!imageUrl || !imageUrl.startsWith("http")) {
              throw new Error("رابط تنزيل الصورة السحابية غير صالح.");
            }

            // Important: Clear task ref before invoking onPhotoUploaded so parent unmount won't cancel
            activeTaskRef.current = null;
            setActiveTask(null);
            isUploadingRef.current = false;
            setUploading(false);
            setProgress(100);
            setUploadedUrl(imageUrl);
            
            const finalSize = compressedSize || originalSize || 0;
            const finalMimeType = "image/jpeg";
            const finalTakenAt = takenAt || new Date().toISOString();

            const metadata = {
              url: imageUrl,
              size: finalSize,
              mimeType: finalMimeType,
              takenAt: finalTakenAt
            };

            console.log("[PhotoCapture] ✅ Photo uploaded successfully to Storage:", metadata);
            onPhotoUploaded(metadata);
          } catch (err: any) {
            console.error("[PhotoCapture] Failed to get download URL:", err);
            setError("تم رفع الصورة ولكن تعذر الحصول على الرابط السحابي. يرجى الضغط على إعادة المحاولة.");
          } finally {
            activeTaskRef.current = null;
            isUploadingRef.current = false;
            setActiveTask(null);
            setUploading(false);
          }
        }
      );
    } catch (err: any) {
      activeTaskRef.current = null;
      isUploadingRef.current = false;
      setActiveTask(null);
      setUploading(false);
      console.error("[PhotoCapture] ❌ Upload initialization failed:", err);
      setError(err?.message || "تعذر بدء عملية رفع الصورة. يرجى التحقق من اتصال الإنترنت.");
    }
  };

  const handleCancelUpload = () => {
    isCanceledByUserRef.current = true;
    if (activeTaskRef.current) {
      try {
        activeTaskRef.current.cancel();
      } catch {
        // Ignore
      }
      activeTaskRef.current = null;
    }
    isUploadingRef.current = false;
    setActiveTask(null);
    setUploading(false);
    setProgress(0);
    setError("تم إلغاء عملية الرفع.");
  };

  const handlePauseResume = () => {
    const task = activeTaskRef.current || activeTask;
    if (task) {
      if (isPaused) {
        task.resume();
        setIsPaused(false);
      } else {
        task.pause();
        setIsPaused(true);
      }
    }
  };

  const resetPhoto = () => {
    if (uploading) return;
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
    setRawBase64(null);
    setCompressedBase64(null);
    setUploadedUrl(null);
    setProgress(0);
    setError(null);
    setOriginalSize(0);
    setCompressedSize(0);
    setTakenAt("");
    isUploadingRef.current = false;
    activeTaskRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm flex flex-col items-center justify-center text-center transition duration-200 hover:border-slate-300">
      <span className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </span>

      {/* Hidden native input with camera capture for mobile and file picker for desktop */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        disabled={disabled || uploading || isCompressing}
        className="hidden"
      />

      {!previewUrl && (
        <button
          type="button"
          onClick={disabled || uploading ? undefined : triggerCamera}
          disabled={disabled || uploading}
          className="flex flex-col items-center gap-3 py-8 px-10 bg-slate-50 border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/30 text-slate-600 rounded-2xl transition duration-200 cursor-pointer w-full max-w-sm group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="p-4 bg-white rounded-full shadow-sm group-hover:scale-110 transition duration-200 border border-slate-100">
            <Camera className="w-8 h-8 text-blue-500" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600">افتح الكاميرا أو اختر صورة</span>
            <span className="text-xs text-slate-400">تصوير حي فوري ومباشر إلى السحابة</span>
          </div>
        </button>
      )}

      {previewUrl && (
        <div className="w-full max-w-sm flex flex-col gap-4">
          <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shadow-inner group">
            <img src={previewUrl} alt="معاينة الصورة" className="w-full h-full object-contain" />
            
            {isCompressing && (
              <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center text-white p-6 backdrop-blur-xs">
                <Loader2 className="w-8 h-8 text-blue-400 mb-2 animate-spin" />
                <span className="text-xs font-bold">جاري تجهيز وضغط الصورة...</span>
              </div>
            )}

            {uploading && (
              <div className="absolute inset-0 bg-slate-900/85 flex flex-col items-center justify-center text-white p-6 backdrop-blur-xs">
                <Loader2 className={`w-8 h-8 text-blue-400 mb-2 ${isPaused ? '' : 'animate-spin'}`} />
                <span className="text-sm font-bold">
                  {isPaused ? 'متوقف مؤقتاً...' : 'جاري رفع الصورة إلى Firebase Storage...'} {progress}%
                </span>
                <div className="w-full bg-slate-800 h-2.5 rounded-full mt-3 overflow-hidden border border-slate-700 max-w-xs">
                  <div 
                    className={`h-full transition-all duration-200 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)] ${isPaused ? 'bg-slate-400' : 'bg-blue-500'}`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button 
                    type="button"
                    onClick={handlePauseResume}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    {isPaused ? 'استئناف' : 'إيقاف مؤقت'}
                  </button>
                  <button 
                    type="button"
                    onClick={handleCancelUpload}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}

            {uploadedUrl && !uploading && (
              <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-2xs flex items-center justify-center text-white">
                <div className="bg-emerald-500 text-white rounded-full p-2.5 shadow-lg scale-110 animate-fade-in">
                  <CheckCircle className="w-8 h-8" />
                </div>
              </div>
            )}
          </div>

          {/* Forensic / metadata dashboard */}
          <div className="bg-slate-50 rounded-xl p-3 text-right text-xs text-slate-600 border border-slate-100 flex flex-col gap-1.5 font-mono">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-500">حجم الملف الأصلي:</span>
              <span className="text-slate-800 font-bold">{formatSize(originalSize)}</span>
            </div>
            {compressedSize > 0 && (
              <div className="flex justify-between items-center border-t border-slate-200/60 pt-1.5">
                <span className="font-semibold text-slate-500">الحجم المحسن للرفع:</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  {formatSize(compressedSize)} {originalSize > 0 ? `(وفر ${Math.max(0, Math.round((1 - compressedSize / originalSize) * 100))}%)` : ""}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center border-t border-slate-200/60 pt-1.5">
              <span className="font-semibold text-slate-500">صيغة الملف:</span>
              <span className="text-slate-800 font-bold">{mimeType}</span>
            </div>
            {takenAt && (
              <div className="flex justify-between items-center border-t border-slate-200/60 pt-1.5">
                <span className="font-semibold text-slate-500">وقت الالتقاط:</span>
                <span className="text-slate-800">{new Date(takenAt).toLocaleTimeString("ar-EG")}</span>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-xs flex flex-col gap-2 text-right">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span className="font-semibold">{error}</span>
              </div>
              <button
                type="button"
                onClick={handleConfirmUpload}
                disabled={uploading || isCompressing || disabled}
                className="self-end px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition shadow-xs disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" /> إعادة المحاولة
              </button>
            </div>
          )}

          <div className="flex gap-2 w-full">
            {uploadedUrl ? (
              <div className="w-full flex flex-col gap-2">
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs font-bold flex items-center justify-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>تم الرفع والتثبيت بنجاح في Firebase Storage</span>
                </div>
                <button
                  type="button"
                  onClick={resetPhoto}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> إعادة التقاط صورة أخرى
                </button>
              </div>
            ) : (
              !uploading && (
                <>
                  <button
                    type="button"
                    onClick={disabled || isCompressing ? undefined : resetPhoto}
                    disabled={disabled || isCompressing}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition duration-150 flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> إلغاء وإعادة التقاط
                  </button>
                  <button
                    type="button"
                    onClick={disabled || isCompressing ? undefined : handleConfirmUpload}
                    disabled={disabled || isCompressing || (!compressedBase64 && !rawBase64)}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold cursor-pointer transition duration-150 flex items-center justify-center gap-1.5 shadow-sm shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload className="w-3.5 h-3.5" /> تأكيد ورفع سحابي
                  </button>
                </>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
