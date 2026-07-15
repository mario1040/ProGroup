import React, { useState, useRef, useEffect } from "react";
import { Camera, RefreshCw, Upload, CheckCircle, Loader2, AlertCircle, Trash2, ShieldCheck } from "lucide-react";
import { uploadPhotoTask, compressImage } from "../lib/api";
import { getDownloadURL, UploadTask } from "firebase/storage";

interface PhotoCaptureProps {
  label: string;
  onPhotoUploaded: (metadata: { url: string; size: number; mimeType: string; takenAt: string }) => void;
  required?: boolean;
  storagePath: string; // Structured path for Firebase Storage
}

export default function PhotoCapture({ label, onPhotoUploaded, required = true, storagePath }: PhotoCaptureProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rawBase64, setRawBase64] = useState<string | null>(null);
  const [compressedBase64, setCompressedBase64] = useState<string | null>(null);
  
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Metadata states
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [takenAt, setTakenAt] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const triggerCamera = () => {
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

    const size = file.size;
    const type = file.type || "image/jpeg";
    const timeStr = new Date().toISOString();

    setOriginalSize(size);
    setMimeType("image/jpeg"); // Canvas.toDataURL produces image/jpeg during compression
    setTakenAt(timeStr);

    // Create a local blob URL preview
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    // Read file as base64 for compression
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Str = reader.result as string;
      setRawBase64(base64Str);
      
      try {
        // Compress immediately on client-side to show user the optimized file details
        const compressed = await compressImage(base64Str, 800, 800, 0.65);
        setCompressedBase64(compressed);
        
        // Calculate compressed size from base64 string length
        const compSize = Math.round((compressed.length - "data:image/jpeg;base64,".length) * 3 / 4);
        setCompressedSize(compSize);
      } catch (err) {
        console.error("Compression error:", err);
        setCompressedBase64(base64Str);
        setCompressedSize(size);
      }
    };
    reader.onerror = () => {
      setError("حدث خطأ أثناء قراءة ملف الصورة");
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmUpload = async () => {
    const payload = compressedBase64 || rawBase64;
    if (!payload) {
      console.warn("[PhotoCapture] Upload aborted: No image payload (base64) available.");
      setError("لم يتم اختيار صورة بعد");
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    // 1. Verify and parse storagePath parameters
    const pathSegments = storagePath.split("/");
    const zoneId = pathSegments[1];
    const taskInstanceId = pathSegments[2];
    const fileName = pathSegments[3];

    console.log("[PhotoCapture] 🚀 Stage 1: Initiating image upload sequence", {
      storagePath,
      zoneId,
      taskInstanceId,
      fileName,
      payloadLength: payload.length,
      mimeType,
      takenAt,
      originalSize,
      compressedSize,
      isZoneIdValid: !!zoneId && zoneId !== "undefined" && zoneId !== "null",
      isTaskInstanceIdValid: !!taskInstanceId && taskInstanceId !== "undefined" && taskInstanceId !== "null",
    });

    if (!zoneId || zoneId === "undefined" || zoneId === "null" || !taskInstanceId || taskInstanceId === "undefined" || taskInstanceId === "null") {
      const errorMsg = `خطأ في مسار التخزين: قيم معرّف المنطقة (${zoneId}) أو معرّف المهمة (${taskInstanceId}) غير صالحة أو غير معرفة.`;
      console.error(`[PhotoCapture] ❌ Validation failed: ${errorMsg}`);
      setError(errorMsg);
      setUploading(false);
      return;
    }

    try {
      console.log(`[PhotoCapture] 📡 Stage 3: Contacting storage service. Path: ${storagePath}`);
      const { task: uploadTask } = await uploadPhotoTask(payload, storagePath);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const p = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setProgress(p);
          console.log(`[PhotoCapture] ⏳ Stage 2: Upload progress: ${p}%`);
        },
        (err) => {
          setError(err.message || "فشل رفع الصورة إلى التخزين السحابي. يرجى المحاولة مرة أخرى.");
          console.error("[PhotoCapture] ❌ Stage 7: Upload error caught in component:", err);
          setUploading(false);
        },
        async () => {
          try {
            const imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
            setProgress(100);
            setUploadedUrl(imageUrl);
            
            // Determine final metadata safely
            const finalSize = compressedSize || originalSize || 0;
            const finalMimeType = mimeType || "image/jpeg";
            const finalTakenAt = takenAt || new Date().toISOString();

            console.log("[PhotoCapture] 🎉 Stage 4: Upload response received", {
              imageUrlPrefix: imageUrl ? imageUrl.substring(0, 50) + "..." : "EMPTY",
              isBase64Fallback: imageUrl ? imageUrl.startsWith("data:") : false,
              finalSize,
              finalMimeType,
              finalTakenAt
            });

            const metadata = {
              url: imageUrl,
              size: finalSize,
              mimeType: finalMimeType,
              takenAt: finalTakenAt
            };

            console.log("[PhotoCapture] 💾 Stage 5: Emitting metadata to onPhotoUploaded", metadata);
            
            onPhotoUploaded(metadata);
            console.log("[PhotoCapture] ✅ Stage 6: Upload flow fully completed successfully.");
          } catch (err: any) {
            setError(err.message || "فشل جلب رابط الصورة. يرجى المحاولة مرة أخرى.");
          } finally {
            setUploading(false);
          }
        }
      );
    } catch (err: any) {
      setError(err.message || "فشل رفع الصورة إلى التخزين السحابي. يرجى المحاولة مرة أخرى.");
      console.error("[PhotoCapture] ❌ Stage 7: Upload error caught in component:", err);
      setUploading(false);
    }
  };

  const resetPhoto = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm flex flex-col items-center justify-center text-center transition duration-200 hover:border-slate-300">
      <span className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </span>

      {/* Hidden native input with camera capture for mobile and standard files for desktop */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {!previewUrl && (
        <button
          type="button"
          onClick={triggerCamera}
          className="flex flex-col items-center gap-3 py-8 px-10 bg-slate-50 border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/30 text-slate-600 rounded-2xl transition duration-200 cursor-pointer w-full max-w-sm group"
        >
          <div className="p-4 bg-white rounded-full shadow-sm group-hover:scale-110 transition duration-200 border border-slate-100">
            <Camera className="w-8 h-8 text-blue-500" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600">افتح الكاميرا أو اختر صورة</span>
            <span className="text-xs text-slate-400">يدعم التصوير الحي والتنزيل الفوري</span>
          </div>
        </button>
      )}

      {previewUrl && (
        <div className="w-full max-w-sm flex flex-col gap-4">
          <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shadow-inner group">
            <img src={previewUrl} alt="معاينة" className="w-full h-full object-contain" />
            
            {uploading && (
              <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center text-white p-6 backdrop-blur-xs">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400 mb-2" />
                <span className="text-sm font-bold">جاري الرفع للتخزين السحابي... {progress}%</span>
                <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden border border-slate-700 max-w-xs">
                  <div 
                    className="bg-blue-500 h-full transition-all duration-300 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {uploadedUrl && !uploading && (
              <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-2xs flex items-center justify-center text-white">
                <div className="bg-emerald-500 text-white rounded-full p-2.5 shadow-lg scale-110">
                  <CheckCircle className="w-8 h-8" />
                </div>
              </div>
            )}
          </div>

          {/* Comparative compression metadata dashboard */}
          <div className="bg-slate-50 rounded-xl p-3 text-right text-xs text-slate-600 border border-slate-100 flex flex-col gap-1.5 font-mono">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-500">حجم الملف الأصلي:</span>
              <span className="text-slate-800 font-bold">{formatSize(originalSize)}</span>
            </div>
            {compressedSize > 0 && (
              <div className="flex justify-between items-center border-t border-slate-200/60 pt-1.5">
                <span className="font-semibold text-slate-500">الحجم المضغوط (محسن):</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  {formatSize(compressedSize)} (خصم {Math.round((1 - compressedSize / originalSize) * 100)}%)
                </span>
              </div>
            )}
            <div className="flex justify-between items-center border-t border-slate-200/60 pt-1.5">
              <span className="font-semibold text-slate-500">نوع الملف:</span>
              <span className="text-slate-800">{mimeType}</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-200/60 pt-1.5">
              <span className="font-semibold text-slate-500">وقت التقاط الصورة:</span>
              <span className="text-slate-800">{new Date(takenAt).toLocaleTimeString("ar-EG")}</span>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-xs flex items-center gap-2 text-right">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-2 w-full">
            {uploadedUrl ? (
              <div className="w-full flex flex-col gap-2">
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs font-bold flex items-center justify-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <span>تم الرفع والحفظ بأمان في Firebase Storage!</span>
                </div>
                <button
                  type="button"
                  onClick={resetPhoto}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> حذف الصورة والبدء من جديد
                </button>
              </div>
            ) : (
              !uploading && (
                <>
                  <button
                    type="button"
                    onClick={resetPhoto}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition duration-150 flex items-center justify-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> إلغاء وإعادة التقاط
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmUpload}
                    disabled={!compressedBase64 && !rawBase64}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold cursor-pointer transition duration-150 flex items-center justify-center gap-1.5 shadow-sm shadow-blue-200"
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
