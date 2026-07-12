import React, { useState, useRef } from "react";
import { Camera, RefreshCw, Upload, CheckCircle, Loader2 } from "lucide-react";
import { uploadPhoto } from "../lib/api";

interface PhotoCaptureProps {
  label: string;
  onPhotoUploaded: (url: string) => void;
  required?: boolean;
  storagePath: string; // Structured path for Firebase Storage
}

export default function PhotoCapture({ label, onPhotoUploaded, required = true, storagePath }: PhotoCaptureProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Create a local preview
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    // Read file as base64 for the Firebase Storage upload
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      await uploadToFirebaseStorage(base64);
    };
    reader.onerror = () => {
      setError("حدث خطأ أثناء قراءة ملف الصورة");
    };
    reader.readAsDataURL(file);
  };

  const uploadToFirebaseStorage = async (base64String: string) => {
    setUploading(true);
    setProgress(15);
    
    // Simulate upload progress steps for interactive feedback
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 15;
      });
    }, 100);

    try {
      const imageUrl = await uploadPhoto(base64String, storagePath);
      clearInterval(interval);
      setProgress(100);
      setUploadedUrl(imageUrl);
      onPhotoUploaded(imageUrl);
    } catch (err) {
      clearInterval(interval);
      setError("فشل رفع الصورة إلى Firebase Storage. يرجى المحاولة مرة أخرى.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const resetPhoto = () => {
    setPreviewUrl(null);
    setUploadedUrl(null);
    setProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="border border-dashed border-slate-300 rounded-xl p-5 bg-slate-50 flex flex-col items-center justify-center text-center">
      <span className="text-sm font-semibold text-slate-700 mb-3 block">
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
          className="flex flex-col items-center gap-2 py-6 px-8 bg-white border border-slate-200 shadow-sm hover:shadow hover:bg-slate-50 text-blue-600 rounded-xl transition duration-200 cursor-pointer w-full max-w-xs"
        >
          <Camera className="w-8 h-8 text-blue-500 animate-pulse" />
          <span className="text-xs font-semibold">افتح الكاميرا أو اختر صورة</span>
          <span className="text-[10px] text-slate-400">يدعم الكاميرا الخلفية مباشرة على الهاتف</span>
        </button>
      )}

      {previewUrl && (
        <div className="w-full max-w-xs flex flex-col items-center gap-3">
          <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-slate-200 bg-black">
            <img src={previewUrl} alt="معاينة" className="w-full h-full object-contain" />
            
            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white p-4">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400 mb-1" />
                <span className="text-xs">جاري رفع الصورة... {progress}%</span>
                <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {uploadedUrl && !uploading && (
              <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1 shadow">
                <CheckCircle className="w-5 h-5" />
              </div>
            )}
          </div>

          <div className="flex gap-2 w-full justify-center">
            {uploadedUrl && (
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 bg-emerald-50 py-1 px-2.5 rounded-full border border-emerald-200">
                <CheckCircle className="w-3.5 h-3.5" /> تم الرفع بنجاح
              </span>
            )}
            
            {!uploading && (
              <button
                type="button"
                onClick={resetPhoto}
                className="flex items-center gap-1 py-1 px-3 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-600 rounded-full text-xs font-semibold cursor-pointer transition duration-150"
              >
                <RefreshCw className="w-3.5 h-3.5" /> إعادة التقاط
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 text-xs text-red-600 font-semibold bg-red-50 p-2 rounded border border-red-200">
          {error}
        </div>
      )}
    </div>
  );
}
