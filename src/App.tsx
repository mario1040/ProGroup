import React, { useState, useEffect } from "react";
import { 
  Shield, 
  User, 
  Lock, 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  Bell, 
  Check, 
  Sparkles,
  Info,
  Smartphone,
  LayoutDashboard
} from "lucide-react";
import { loginUser, getNotifications, markNotificationAsRead, getCurrentUserProfile, logoutUser } from "./lib/api";
import { auth } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Profile, Notification } from "./types";
import TodayTasksPage from "./components/TodayTasksPage";
import MyKpiPage from "./components/MyKpiPage";
import AdminDashboard from "./components/AdminDashboard";

export default function App() {
  const [user, setUser] = useState<Profile | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Navigation states for cleaners
  const [cleanerView, setCleanerView] = useState<'tasks' | 'kpis'>('tasks');
  
  // Real-time notification lists
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Load and listen to user session from Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthLoading(true);
      if (firebaseUser && firebaseUser.email) {
        try {
          const profile = await getCurrentUserProfile(firebaseUser.email);
          if (profile) {
            setUser(profile);
            localStorage.setItem("naris_ops_user", JSON.stringify(profile));
          } else {
            setError("تم تسجيل الدخول بنجاح، ولكن ليس لديك ملف تعريف موظف في النظام. يرجى مراجعة المسؤول.");
            setUser(null);
            localStorage.removeItem("naris_ops_user");
          }
        } catch (e) {
          console.error("Failed to restore session profile", e);
          setUser(null);
        }
      } else {
        const savedUser = localStorage.getItem("naris_ops_user");
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch (e) {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch notifications for the user
  const loadNotifications = async () => {
    if (!user) return;
    try {
      // In cleaner role, fetch only theirs; in admin, fetch all
      const list = await getNotifications(user.role === "cleaner" ? user.id : undefined);
      setNotifications(list);
    } catch (e) {
      console.error("Failed to load notifications", e);
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
      // Poll notifications every 8 seconds for a rich, real-time feel
      const interval = setInterval(loadNotifications, 8000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("يرجى إدخال اسم المستخدم");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const profile = await loginUser(username.trim(), password);
      setUser(profile);
      localStorage.setItem("naris_ops_user", JSON.stringify(profile));
    } catch (err: any) {
      setError(err.message || "فشل تسجيل الدخول. اسم المستخدم أو كلمة المرور غير صحيحة");
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
    }
    setUser(null);
    setUsername("");
    setPassword("");
    localStorage.removeItem("naris_ops_user");
    setCleanerView('tasks');
    setLoading(false);
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

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
      
      {/* 1. LOGIN SCREEN */}
      {!user && (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 px-4 py-12 relative overflow-hidden">
          
          {/* Subtle design shapes for cosmic feeling */}
          <div className="absolute w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -top-12 -right-12"></div>
          <div className="absolute w-96 h-96 bg-slate-800/20 rounded-full blur-3xl -bottom-12 -left-12"></div>

          <div className="w-full max-w-md z-10 flex flex-col gap-6">
            
            {/* Logo and branding */}
            <div className="text-center">
              <div className="inline-flex bg-indigo-600 p-3 rounded-2xl shadow-xl shadow-indigo-900/30 text-white mb-3">
                <Shield className="w-8 h-8 animate-pulse" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">Naris Ops</h1>
              <p className="text-xs text-slate-400 mt-1 font-semibold">نظام تشغيل النظافة والجودة الرقمي الموحد</p>
            </div>

            {/* Login Card */}
            <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 border border-slate-800">
              <h2 className="text-base font-bold text-slate-800 mb-5 text-center">بوابة الموظفين والمشرفين 🔐</h2>
              
              <form onSubmit={handleLogin} className="flex flex-col gap-4 text-xs font-bold text-slate-600">
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-500">اسم المستخدم للتشغيل (Username):</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="أدخل اسمك التقني (مثال: afaf, rehab, admin)"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pr-10 pl-3 py-3 border border-slate-200 rounded-xl outline-none focus:border-slate-400 font-bold bg-slate-50/50 text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-500">كلمة المرور (اختيارية للتوضيح):</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                    <input
                      type="password"
                      placeholder="••••••••"
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 text-white font-bold py-3.5 rounded-xl cursor-pointer shadow-md shadow-indigo-600/15 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>تسجيل الدخول الآمن</span>
                  )}
                </button>
              </form>

              {/* Helper Quick Account Credentials Block - Beautiful evaluation help */}
              <div className="mt-6 border-t border-slate-100 pt-4">
                <span className="text-[10px] text-slate-400 block font-bold mb-2 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-blue-500" /> حسابات افتراضية مبرمجة للتقييم:
                </span>
                <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => { setUsername("afaf"); setPassword("123"); }}
                    className="bg-slate-50 hover:bg-slate-100 border border-slate-200 p-2 rounded-lg cursor-pointer text-slate-700"
                  >
                    🙋‍♀️ الموظفة عفاف <span className="block text-[8px] text-slate-400 mt-0.5">(afaf)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setUsername("rehab"); setPassword("123"); }}
                    className="bg-slate-50 hover:bg-slate-100 border border-slate-200 p-2 rounded-lg cursor-pointer text-slate-700"
                  >
                    🙋‍♀️ الموظفة رحاب <span className="block text-[8px] text-slate-400 mt-0.5">(rehab)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setUsername("admin"); setPassword("123"); }}
                    className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 p-2 rounded-lg cursor-pointer text-indigo-700"
                  >
                    👑 مدير العمليات <span className="block text-[8px] text-indigo-400 mt-0.5">(admin)</span>
                  </button>
                </div>
              </div>

            </div>

            <div className="text-center text-[10px] text-slate-500 font-semibold">
              مقر النرجس الرئيسي • Naris Clean Operations Control Panel
            </div>
          </div>
        </div>
      )}

      {/* 2. AUTHENTICATED WORKSPACES */}
      {user && (
        <div className="min-h-screen flex flex-col">
          
          {/* Global In-app Notifications Bell overlay button on corner */}
          <div className="fixed bottom-4 right-4 z-40">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-full p-3 shadow-2xl relative border border-slate-800 cursor-pointer flex items-center justify-center transition"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -left-1 bg-rose-500 text-white text-[9px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center animate-bounce border-2 border-slate-900">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Drawer Dialog overlay */}
            {showNotifications && (
              <div className="absolute bottom-14 right-0 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 flex flex-col gap-3 max-h-96 overflow-y-auto text-right">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-800">جرس تنبيهات التشغيل والمهام 🔔</span>
                  <button onClick={() => setShowNotifications(false)} className="text-[10px] font-bold text-slate-400 hover:text-slate-600">
                    إغلاق
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {notifications.length === 0 ? (
                    <span className="text-xs text-slate-400 text-center py-6 block font-medium">لا توجد إشعارات حالياً</span>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        onClick={() => handleMarkRead(notif.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex flex-col gap-1 ${
                          notif.is_read ? "border-slate-100 bg-slate-50/50 text-slate-500" : "border-blue-100 bg-blue-50/30 text-slate-800 font-bold"
                        }`}
                      >
                        <div className="flex justify-between items-center text-[9px]">
                          <span className="text-blue-600">{notif.type === "rework_requested" ? "إعادة تنفيذ ⚠️" : "تحديث تشغيل"}</span>
                          <span className="text-slate-400">{notif.created_at ? new Date(notif.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ""}</span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-[11px] mt-0.5">{notif.title}</h4>
                        <p className="text-[10px] text-slate-500 leading-normal font-medium mt-0.5">{notif.body}</p>
                        
                        {!notif.is_read && (
                          <span className="text-[8px] text-blue-500 text-left mt-1 block">اضغط للمسح والقراءة</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Role specific routing layout renderer */}
          {user.role === "cleaner" ? (
            /* Cleaner view (TodayTasksPage or MyKpiPage) */
            cleanerView === 'tasks' ? (
              <TodayTasksPage 
                user={user} 
                onLogout={handleLogout} 
                onNavigateToKpis={() => setCleanerView('kpis')} 
              />
            ) : (
              <MyKpiPage 
                user={user} 
                onBack={() => setCleanerView('tasks')} 
              />
            )
          ) : (
            /* Admin & Supervisor rich layout */
            <AdminDashboard 
              user={user} 
              onLogout={handleLogout} 
            />
          )}

        </div>
      )}

    </div>
  );
}
