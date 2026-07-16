import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  AlertTriangle,
  Bell,
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
  listenNotifications,
  loginUser,
  logoutUser,
  markNotificationAsRead,
} from "./lib/api";
import type { Notification, Profile } from "./types";
import TodayTasksPage from "./components/TodayTasksPage";
import MyKpiPage from "./components/MyKpiPage";
import AdminDashboard from "./components/AdminDashboard";
import ProfessorLogo from "./components/ProfessorLogo";

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

function isSessionSummary(value: unknown): value is SessionSummary {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.username === "string" &&
    (v.role === "admin" || v.role === "cleaner" || v.role === "supervisor")
  );
}

function toSessionSummary(profile: Profile): SessionSummary {
  return {
    id: profile.id,
    username: profile.username,
    role: profile.role,
  };
}

function parseStoredSession(raw: string | null): SessionSummary | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return isSessionSummary(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const audioCtx = new AudioContextClass();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    // Very quick, gentle notification "ping" sound
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
    oscillator.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.05);
    
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.2);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

export default function App() {
  const [user, setUser] = useState<Profile | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [cleanerView, setCleanerView] = useState<"tasks" | "kpis">("tasks");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifiedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      setAuthLoading(true);

      try {
        const raw = localStorage.getItem(SESSION_KEY) ?? localStorage.getItem(LEGACY_SESSION_KEY);
        const stored = parseStoredSession(raw);

        if (!stored) {
          localStorage.removeItem(SESSION_KEY);
          localStorage.removeItem(LEGACY_SESSION_KEY);
          if (!cancelled) setUser(null);
          return;
        }

        const current = await getCurrentUserProfile(makeProfileEmail(stored.username));
        if (!current || current.is_active === false) {
          localStorage.removeItem(SESSION_KEY);
          localStorage.removeItem(LEGACY_SESSION_KEY);
          if (!cancelled) setUser(null);
          return;
        }

        if (!cancelled) setUser(current);
      } catch (e) {
        console.error("Failed to restore session profile", e);
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(LEGACY_SESSION_KEY);
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    };

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setShowNotifications(false);
      notifiedIds.current.clear();
      return;
    }

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const recipientId = user.role === "cleaner" ? user.id : undefined;
    const unsubscribe = listenNotifications(recipientId, (list) => {
      setNotifications(list);

      let playedSound = false;

      if ("Notification" in window && Notification.permission === "granted") {
        list.forEach((notif) => {
          if (!notif.is_read && !notifiedIds.current.has(notif.id)) {
            notifiedIds.current.add(notif.id);
            // Only alert for recent notifications (last 2 minutes)
            const isRecent = notif.created_at && (new Date().getTime() - new Date(notif.created_at).getTime() < 120000);
            if (isRecent) {
              if (!playedSound) {
                playNotificationSound();
                playedSound = true;
              }
              
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(registration => {
                  registration.showNotification(notif.title, {
                    body: notif.body,
                    icon: '/icon.png',
                    badge: '/icon.png',
                    // @ts-ignore
                    vibrate: [100, 50, 100],
                  });
                });
              } else {
                new Notification(notif.title, {
                  body: notif.body,
                  icon: '/icon.png',
                });
              }
            }
          }
        });
      } else {
        // Fallback: still play sound even if system notifications are denied
        list.forEach((notif) => {
          if (!notif.is_read && !notifiedIds.current.has(notif.id)) {
            notifiedIds.current.add(notif.id);
            const isRecent = notif.created_at && (new Date().getTime() - new Date(notif.created_at).getTime() < 120000);
            if (isRecent && !playedSound) {
              playNotificationSound();
              playedSound = true;
            }
          }
        });
      }
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(null), 2500);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

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
      localStorage.setItem(SESSION_KEY, JSON.stringify(toSessionSummary(profile)));
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
      setNotifications([]);
      setShowNotifications(false);
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(LEGACY_SESSION_KEY);
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (e) {
      console.error(e);
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
    <div className="min-h-screen bg-slate-50 font-sans antialiased rtl-grid text-right">
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
          <div className="fixed bottom-4 right-4 z-40">
            <button
              onClick={() => setShowNotifications((v) => !v)}
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-full p-3 shadow-2xl relative border border-slate-800 cursor-pointer flex items-center justify-center transition"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -left-1 bg-rose-500 text-white text-[9px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center animate-bounce border-2 border-slate-900">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute bottom-14 right-0 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 flex flex-col gap-3 max-h-96 overflow-y-auto text-right">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-800">جرس تنبيهات التشغيل والمهام 🔔</span>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-[10px] font-bold text-slate-400 hover:text-slate-600"
                  >
                    إغلاق
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {notifications.length === 0 ? (
                    <span className="text-xs text-slate-400 text-center py-6 block font-medium">
                      لا توجد إشعارات حالياً
                    </span>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleMarkRead(notif.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex flex-col gap-1 ${
                          notif.is_read
                            ? "border-slate-100 bg-slate-50/50 text-slate-500"
                            : "border-blue-100 bg-blue-50/30 text-slate-800 font-bold"
                        }`}
                      >
                        <div className="flex justify-between items-center text-[9px]">
                          <span className="text-blue-600">
                            {notif.type === "rework_requested" ? "إعادة تنفيذ ⚠️" : "تحديث تشغيل"}
                          </span>
                          <span className="text-slate-400">
                            {notif.created_at
                              ? new Date(notif.created_at).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-[11px] mt-0.5">{notif.title}</h4>
                        <p className="text-[10px] text-slate-500 leading-normal font-medium mt-0.5">
                          {notif.body}
                        </p>

                        {!notif.is_read && (
                          <span className="text-[8px] text-blue-500 text-left mt-1 block">
                            اضغط للمسح والقراءة
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {user.role === "cleaner" ? (
            cleanerView === "tasks" ? (
              <TodayTasksPage
                user={user}
                onLogout={handleLogout}
                onNavigateToKpis={() => setCleanerView("kpis")}
              />
            ) : (
              <MyKpiPage user={user} onBack={() => setCleanerView("tasks")} />
            )
          ) : (
            <AdminDashboard user={user} onLogout={handleLogout} />
          )}
        </div>
      )}
    </div>
  );
}
