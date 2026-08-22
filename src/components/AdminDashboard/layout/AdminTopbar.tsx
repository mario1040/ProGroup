import {
  CalendarDays,
  ChevronDown,
  Menu,
  Sparkles,
  UserRound,
  LogOut,
} from "lucide-react";
import type { Profile } from "../../../types";

type AdminTopbarProps = {
  user: Profile;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onLogout: () => void;
  onMenuToggle: () => void;
};

export default function AdminTopbar({
  user,
  selectedDate,
  onDateChange,
  onLogout,
  onMenuToggle,
}: AdminTopbarProps) {
  const initials =
    user.full_name?.trim().slice(0, 2).toUpperCase() || "AD";

  return (
    <header
      className="
        admin-topbar
        relative z-30
        w-full
        px-3 py-3
        sm:px-5
        lg:px-7
        sticky top-0 z-40 w-full px-3 py-3 sm:px-5 lg:px-7
      "
      style={{ position: "sticky", top: 0, zIndex: 40 }}
      dir="rtl"
    >
      <div
        className="
          admin-topbar-inner
          mx-auto
          flex
          min-h-[68px]
          max-w-[1680px]
          items-center
          justify-between
          gap-3
          rounded-[22px]
          border
          border-white/[0.08]
          bg-slate-950/85
          px-3
          py-2.5
          shadow-[0_18px_50px_rgba(0,0,0,0.22)]
          backdrop-blur-2xl
          sm:px-4
          lg:px-5
        "
      >
        {/* =====================================================
            BRAND SECTION
        ====================================================== */}
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3.5">
          {/* Mobile Menu */}
          <button
            type="button"
            onClick={onMenuToggle}
            className="
              admin-menu-button
              no-print
              inline-flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-2xl
              border
              border-white/[0.10]
              bg-white/[0.06]
              text-slate-200
              shadow-lg
              transition-all
              duration-200
              hover:border-white/[0.16]
              hover:bg-white/[0.10]
              hover:text-white
              active:scale-95
              md:hidden
            "
            aria-label="فتح القائمة الجانبية"
            title="فتح القائمة الجانبية"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Logo */}
          <div
            className="
              hidden
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              overflow-hidden
              rounded-2xl
              border
              border-white/[0.12]
              bg-white/[0.06]
              shadow-[0_8px_25px_rgba(0,0,0,0.20)]
              sm:flex
            "
          >
            <img
              src="/logowhigth.png"
              alt="Professor Kitchens"
              className="
                h-9
                w-9
                object-contain
                select-none
              "
            />
          </div>

          {/* Brand Content */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {/* Brand Name */}
              <div className="flex items-center gap-2">
                <img
                  src="/logowhigth.png"
                  alt="Professor Kitchens"
                  className="
                    h-7
                    w-auto
                    max-w-[145px]
                    object-contain
                    object-left
                    sm:hidden
                  "
                />

                <span
                  className="
                    hidden
                    text-[15px]
                    font-black
                    tracking-tight
                    text-white
                    sm:block
                    lg:text-[17px]
                  "
                >
                  Professor Kitchens
                </span>
              </div>

              {/* Command Center Badge */}
              <span
                className="
                  hidden
                  items-center
                  gap-1.5
                  rounded-full
                  border
                  border-indigo-300/[0.18]
                  bg-indigo-400/[0.10]
                  px-2.5
                  py-1
                  text-[9px]
                  font-extrabold
                  text-indigo-100
                  sm:inline-flex
                "
              >
                <Sparkles className="h-3 w-3 text-indigo-300" />

                مركز القيادة
              </span>
            </div>

            {/* Description */}
            <div className="mt-1 hidden items-center gap-2 sm:flex">
              <span
                className="
                  h-1.5
                  w-1.5
                  shrink-0
                  rounded-full
                  bg-emerald-400
                  shadow-[0_0_8px_rgba(52,211,153,0.7)]
                "
              />

              <p
                className="
                  max-w-[23rem]
                  truncate
                  text-[10px]
                  font-medium
                  text-slate-400
                "
              >
                نظرة أذكى على التشغيل والجودة وأداء الفريق
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================
            RIGHT CONTROLS
        ====================================================== */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* System Status */}
          <div
            className="
              hidden
              items-center
              gap-2
              rounded-2xl
              border
              border-emerald-400/[0.12]
              bg-emerald-400/[0.05]
              px-3
              py-2
              lg:flex
            "
          >
            <span className="relative flex h-2 w-2">
              <span
                className="
                  absolute
                  inline-flex
                  h-full
                  w-full
                  animate-ping
                  rounded-full
                  bg-emerald-400
                  opacity-60
                "
              />

              <span
                className="
                  relative
                  inline-flex
                  h-2
                  w-2
                  rounded-full
                  bg-emerald-400
                "
              />
            </span>

            <span className="text-[9px] font-extrabold text-emerald-300">
              النظام يعمل
            </span>
          </div>

          {/* Date Control */}
          <div
            className="
              admin-date-control
              group
              flex
              items-center
              gap-2
              rounded-2xl
              border
              border-white/[0.09]
              bg-white/[0.055]
              px-2.5
              py-2
              transition-all
              duration-200
              hover:border-indigo-400/[0.25]
              hover:bg-white/[0.08]
              sm:px-3
            "
          >
            {/* Calendar */}
            <div
              className="
                hidden
                h-8
                w-8
                items-center
                justify-center
                rounded-xl
                bg-indigo-500/[0.14]
                text-indigo-300
                sm:flex
              "
            >
              <CalendarDays className="h-4 w-4" />
            </div>

            {/* Date */}
            <div className="flex flex-col">
              <span
                className="
                  hidden
                  text-[9px]
                  font-bold
                  leading-none
                  text-slate-500
                  sm:block
                "
              >
                تاريخ العرض
              </span>

              <input
                type="date"
                value={selectedDate}
                onChange={(event) => onDateChange(event.target.value)}
                aria-label="تاريخ العرض"
                className="
                  w-[8.5rem]
                  cursor-pointer
                  bg-transparent
                  text-[11px]
                  font-extrabold
                  text-white
                  outline-none
                  [color-scheme:dark]
                  sm:w-[9.25rem]
                "
              />
            </div>

            <ChevronDown
              className="
                hidden
                h-3.5
                w-3.5
                shrink-0
                text-slate-500
                transition-transform
                duration-200
                group-hover:translate-y-0.5
                sm:block
              "
            />
          </div>

          {/* Divider */}
          <div className="hidden h-8 w-px bg-white/[0.08] sm:block" />

          {/* =================================================
              USER PROFILE
          ================================================== */}
          <div
            className="
              group
              flex
              items-center
              gap-2
              rounded-2xl
              border
              border-white/[0.09]
              bg-white/[0.055]
              px-2
              py-1.5
              transition-all
              duration-200
              hover:border-white/[0.13]
              hover:bg-white/[0.075]
              sm:gap-3
              sm:px-3
            "
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-xl
                  bg-gradient-to-br
                  from-indigo-500
                  via-violet-500
                  to-fuchsia-500
                  text-[10px]
                  font-black
                  text-white
                  shadow-lg
                  shadow-indigo-500/20
                  sm:h-10
                  sm:w-10
                "
              >
                {initials}
              </div>

              {/* Online */}
              <span
                className="
                  absolute
                  -bottom-0.5
                  -left-0.5
                  h-2.5
                  w-2.5
                  rounded-full
                  border-2
                  border-slate-950
                  bg-emerald-400
                "
              />
            </div>

            {/* User Information */}
            <div className="hidden min-w-0 text-right sm:block">
              <div className="flex items-center gap-1.5">
                <UserRound className="h-3 w-3 shrink-0 text-indigo-300" />

                <span
                  className="
                    max-w-[7rem]
                    truncate
                    text-[11px]
                    font-extrabold
                    text-slate-100
                  "
                >
                  {user.full_name || "Administrator"}
                </span>
              </div>

              <div className="mt-0.5 flex items-center gap-1.5">
                <span
                  className="
                    h-1.5
                    w-1.5
                    rounded-full
                    bg-emerald-400
                  "
                />

                <span className="text-[9px] font-semibold text-emerald-300">
                  متصل الآن
                </span>
              </div>
            </div>

            {/* Logout */}
            <button
              type="button"
              onClick={onLogout}
              aria-label="تسجيل الخروج"
              title="تسجيل الخروج"
              className="
                group/logout
                inline-flex
                h-8
                items-center
                justify-center
                gap-1.5
                rounded-xl
                border
                border-white/[0.09]
                bg-white/[0.045]
                px-2
                text-[10px]
                font-extrabold
                text-slate-400
                transition-all
                duration-200
                hover:border-rose-400/[0.20]
                hover:bg-rose-400/[0.08]
                hover:text-rose-200
                active:scale-95
                sm:px-2.5
              "
            >
              <LogOut
                className="
                  h-3.5
                  w-3.5
                  transition-transform
                  duration-200
                  group-hover/logout:-translate-x-0.5
                "
              />

              <span className="hidden sm:inline">
                خروج
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* =======================================================
          BOTTOM ACCENT
      ======================================================== */}
      <div
        className="
          pointer-events-none
          absolute
          bottom-0
          left-1/2
          h-px
          w-[70%]
          -translate-x-1/2
          bg-gradient-to-r
          from-transparent
          via-indigo-500/30
          to-transparent
        "
      />
    </header>
  );
}