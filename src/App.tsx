import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Info,
  LayoutDashboard,
  Loader2,
  Lock,
  Sparkles,
  User,
} from "lucide-react";
import {
  getCurrentUserProfile,
  loginUser,
  logoutUser,
  isSkipSessionFocusChecksEnabled,
} from "./lib/api";
import type { Profile } from "./types";
import TodayTasksPage from "./components/TodayTasksPage";
import MyKpiPage from "./components/MyKpiPage";
import AdminDashboard from "./components/AdminDashboard";
import ProfessorLogo from "./components/ProfessorLogo";
import FirebaseDiagnosticTool from "./components/FirebaseDiagnosticTool";
import SwitchLabelsGuide from "./components/SwitchLabelsGuide";
import FirestoreQuotaBanner from "./components/FirestoreQuotaBanner";

type SessionSummary = {
  id: string;
  username: string;
  role: Profile["role"];
};

const SESSION_KEY = "naris_ops_session";
const LEGACY_SESSION_KEY = "naris_ops_user";
const DEFAULT_DOMAIN = "narisops.com";

function makeProfileEmail(username: string): string {
  const clean = username.trim().toLowerCase();
  return clean.includes("@") ? clean : `${clean}@${DEFAULT_DOMAIN}`;
}

function parseStoredProfile(raw: string | null): Profile | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const v = parsed as Record<string, unknown>;
    if (
      typeof v.id === "string" &&
      typeof v.username === "string" &&
      (v.role === "admin" || v.role === "cleaner" || v.role === "supervisor")
    ) {
      return {
        id: v.id,
        username: v.username,
        full_name: typeof v.full_name === "string" ? v.full_name : v.username,
        role: v.role as Profile["role"],
        phone: typeof v.phone === "string" ? v.phone : "",
        is_active: v.is_active !== false,
        shift_start: typeof v.shift_start === "string" ? v.shift_start : "08:00",
        shift_end: typeof v.shift_end === "string" ? v.shift_end : "16:00",
        assigned_zones: Array.isArray(v.assigned_zones) ? (v.assigned_zones as string[]) : [],
        assigned_locations: Array.isArray(v.assigned_locations) ? (v.assigned_locations as string[]) : [],
        ...((v.created_at ? { created_at: v.created_at } : {}) as any),
        ...((v.password ? { password: v.password } : {}) as any),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export default function App() {
  const [user, setUser] = useState<Profile | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [cleanerView, setCleanerView] = useState<"tasks" | "kpis" | "switch_guide">("tasks");
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleProjectChangedSignOut = () => {
      setUser(null);
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("project_changed_sign_out", handleProjectChangedSignOut);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("project_changed_sign_out", handleProjectChangedSignOut);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      try {
        const raw = localStorage.getItem(SESSION_KEY) ?? localStorage.getItem(LEGACY_SESSION_KEY);
        const storedProfile = parseStoredProfile(raw);

        if (!storedProfile) {
          if (!cancelled) {
            setUser(null);
            setAuthLoading(false);
          }
          return;
        }

        // Instantly restore user session so cleaners enter the application immediately
        if (!cancelled) {
          setUser(storedProfile);
          setAuthLoading(false);
        }

        // Background non-blocking verification with Firestore: only sign out if explicitly deactivated by admin
        try {
          const current = await getCurrentUserProfile(makeProfileEmail(storedProfile.username));
          if (current) {
            if (current.is_active === false) {
              localStorage.removeItem(SESSION_KEY);
              localStorage.removeItem(LEGACY_SESSION_KEY);
              if (!cancelled) {
                setUser(null);
                setError("تم تعطيل هذا الحساب من قِبل الإدارة.");
              }
              return;
            }
            if (!cancelled) {
              setUser(current);
              localStorage.setItem(SESSION_KEY, JSON.stringify(current));
            }
          }
        } catch (fetchErr) {
          // Keep the existing cached session if offline or if network is slow
          console.warn("Background profile verification skipped due to network condition; maintaining active session:", fetchErr);
        }
      } catch (e) {
        console.error("Failed to restore session profile", e);
        if (!cancelled) setAuthLoading(false);
      }
    };

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    let checking = false;

    const clearInvalidSession = () => {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(LEGACY_SESSION_KEY);
      if (!cancelled) {
        setUser(null);
        setCleanerView("tasks");
        setError("تم تعطيل هذا الحساب. تم تسجيل خروجك لحماية النظام.");
      }
    };

    let lastChecked = Date.now();
    const revalidateActiveSession = async (force = false) => {
      if (checking || cancelled) return;
      // When skipSessionFocusChecks is enabled, never perform background queries on screen unlock/app switch
      if (!force && isSkipSessionFocusChecksEnabled()) return;
      const now = Date.now();
      const minInterval = isSkipSessionFocusChecksEnabled() ? 60 * 60 * 1000 : 15 * 60 * 1000;
      if (!force && (now - lastChecked < minInterval)) return;
      lastChecked = now;
      checking = true;
      try {
        const current = await getCurrentUserProfile(makeProfileEmail(user.username));
        // ONLY clear session if server responded AND user is explicitly inactive
        if (current && current.is_active === false) {
          clearInvalidSession();
          return;
        }
        if (current && !cancelled) {
          setUser(current);
          localStorage.setItem(SESSION_KEY, JSON.stringify(current));
        }
      } catch (error) {
        // A transient network failure must never log out a worker.
        console.warn("Active session revalidation failed; keeping the current session securely.", error);
      } finally {
        checking = false;
      }
    };

    // Recheck only once every 60 minutes instead of burning hundreds of reads every 5 minutes
    const interval = window.setInterval(() => {
      if (!isSkipSessionFocusChecksEnabled()) {
        void revalidateActiveSession(true);
      }
    }, 60 * 60 * 1000);

    const onVisibilityOrFocus = () => {
      if (!isSkipSessionFocusChecksEnabled()) {
        void revalidateActiveSession(false);
      }
    };
    window.addEventListener("focus", onVisibilityOrFocus);
    document.addEventListener("visibilitychange", onVisibilityOrFocus);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", onVisibilityOrFocus);
      document.removeEventListener("visibilitychange", onVisibilityOrFocus);
    };
  }, [user?.id, user?.username]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(null), 2500);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setError("يرجى إدخال اسم المستخدم");
      return;
    }
    if (!password) {
      setError("يرجى إدخال كلمة المرور");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const profile = await loginUser(cleanUsername, password);
      setUser(profile);
      localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
      localStorage.removeItem(LEGACY_SESSION_KEY);
      setPassword("");
      setSuccessMessage("تم تسجيل الدخول بنجاح");
    } catch (err: any) {
      setError(err?.message || "فشل تسجيل الدخول. اسم المستخدم أو كلمة المرور غير صحيحة");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logoutUser();
    } catch (e) {
      console.error(e);
    } finally {
      setUser(null);
      setUsername("");
      setPassword("");
      setCleanerView("tasks");
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(LEGACY_SESSION_KEY);
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
          <span className="text-sm font-bold">جاري تحميل النظام والتحقق من الهوية...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased rtl-grid text-right flex flex-col">
      {!isOnline && (
        <div className="bg-rose-600 text-white px-4 py-2.5 text-xs md:text-sm font-bold flex items-center justify-between shadow-md border-b border-rose-700 gap-4 z-50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-white shrink-0 animate-pulse" />
            <span>
              <strong>انقطاع الاتصال بالإنترنت:</strong> النظام يعمل بنمط السحابة المباشر (Online-Only). يرجى التحقق من اتصال شبكة الإنترنت لضمان إرسال وتحديث المهام والصور.
            </span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1 rounded-lg text-[10px] md:text-xs transition font-bold shrink-0 cursor-pointer"
          >
            إعادة المحاولة
          </button>
        </div>
      )}
      {isOnline && !user && <FirestoreQuotaBanner onRetry={() => window.location.reload()} />}
      {!user ? (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 px-4 py-12 relative overflow-hidden">
          <div className="absolute w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -top-12 -right-12" />
          <div className="absolute w-96 h-96 bg-slate-800/20 rounded-full blur-3xl -bottom-12 -left-12" />

          <div className="w-full max-w-md z-10 flex flex-col gap-6">
            <div className="text-center flex flex-col items-center">
              <div className="mb-4 w-4/5 max-w-[280px]">
                <ProfessorLogo variant="full" light={true} className="h-16" />
              </div>
              <p className="text-xs text-indigo-300 mt-1 font-semibold">
                نظام تشغيل النظافة والجودة الرقمي الموحد (Naris Ops)
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 border border-slate-800">
              <h2 className="text-base font-bold text-slate-800 mb-5 text-center">
                بوابة الموظفين والمشرفين 🔐
              </h2>

              <form onSubmit={handleLogin} className="flex flex-col gap-4 text-xs font-bold text-slate-600">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-500">اسم المستخدم للتشغيل (Username):</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                    <input
                      type="text"
                      autoComplete="username"
                      required
                      placeholder="أدخل اسمك التقني (مثال: afaf, rehab, admin)"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pr-10 pl-3 py-3 border border-slate-200 rounded-xl outline-none focus:border-slate-400 font-bold bg-slate-50/50 text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-500">كلمة المرور (Password):</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                    <input
                      type="password"
                      autoComplete="current-password"
                      required
                      placeholder="أدخل كلمة المرور"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pr-10 pl-3 py-3 border border-slate-200 rounded-xl outline-none focus:border-slate-400 bg-slate-50/50 text-slate-800"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-800 border border-red-100 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{error}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{successMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 text-white font-bold py-3.5 rounded-xl cursor-pointer shadow-md shadow-indigo-600/15 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>تسجيل الدخول الآمن</span>}
                </button>
              </form>

              <div className="mt-6 border-t border-slate-100 pt-4">
                <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-100 text-[10px] text-indigo-800 leading-relaxed font-bold flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                  <span>
                    يتم حفظ جلسة خفيفة بدون كلمة المرور، ويتم إعادة التحقق من الملف الشخصي من Firestore عند استعادة الجلسة.
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-500 font-semibold">
              مقر النرجس الرئيسي • Naris Clean Operations Control Panel
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen flex flex-col">
          {user.role === "cleaner" ? (
            cleanerView === "tasks" ? (
              <TodayTasksPage
                user={user}
                onLogout={handleLogout}
                onNavigateToKpis={() => setCleanerView("kpis")}
                onNavigateToSwitchGuide={() => setCleanerView("switch_guide")}
              />
            ) : cleanerView === "kpis" ? (
              <MyKpiPage user={user} onBack={() => setCleanerView("tasks")} />
            ) : (
              <div className="min-h-screen bg-slate-50 flex flex-col p-2 md:p-4">
                <SwitchLabelsGuide onBack={() => setCleanerView("tasks")} />
              </div>
            )
          ) : (
            <AdminDashboard user={user} onLogout={handleLogout} />
          )}
        </div>
      )}
      <FirebaseDiagnosticTool />
    </div>
  );
}
