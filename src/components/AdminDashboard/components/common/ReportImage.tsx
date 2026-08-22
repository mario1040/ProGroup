import { useState } from "react";

export default function ReportImage({
  url,
  alt,
  emptyLabel,
  onOpen,
}: {
  url?: string;
  alt: string;
  emptyLabel: string;
  onOpen?: () => void;
}) {
  const [failed, setFailed] = useState(false);

  if (!url || failed) {
    return (
      <div className="h-full rounded-lg bg-slate-50/50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 text-center px-2">
        <span className="text-xl">📷</span>
        <span className="text-[10px] mt-1">{failed ? "تعذر تحميل الصورة" : emptyLabel}</span>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      className="max-h-full object-contain cursor-zoom-in transition duration-200 hover:scale-105"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      onClick={onOpen}
    />
  );
}
