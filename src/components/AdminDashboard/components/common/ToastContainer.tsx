import { AlertTriangle, CheckCircle } from "lucide-react";

type Toast = { message: string; type: "success" | "error" | "warning" };

export default function ToastContainer({ toast }: { toast: Toast | null }) {
  if (!toast) return null;
  return (
    <div className={`fixed top-4 left-4 right-4 md:left-auto md:w-96 z-50 p-4 rounded-xl shadow-xl border transition-all duration-300 flex items-center gap-3 ${
      toast.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
      toast.type === "error" ? "bg-rose-50 text-rose-800 border-rose-200" :
      "bg-amber-50 text-amber-800 border-amber-200"
    }`}>
      <div className="shrink-0">
        {toast.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-600" />}
        {toast.type === "error" && <AlertTriangle className="w-5 h-5 text-rose-600" />}
        {toast.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-600" />}
      </div>
      <span className="text-sm font-bold">{toast.message}</span>
    </div>
  );
}
