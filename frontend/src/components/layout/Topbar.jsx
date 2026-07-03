import { useEffect, useState } from "react";
import {
  Search,
  Bell,
  LogOut,
  ShieldAlert,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import LiveClock from "../common/LiveClock";

export default function Topbar() {
  const navigate = useNavigate();

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const confirmLogout = () => {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") {
        setShowLogoutModal(false);
      }
    };

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <>
      <header className="h-24 border-b border-green-500/10 bg-[#07090c] px-10 flex items-center justify-between">

        <div>
          <h1 className="text-4xl font-bold">
            Security Operations Center
          </h1>

          <p className="text-zinc-500 mt-1">
            ThreatEye v1.0
          </p>
        </div>

        <div className="flex items-center gap-5">

          <div className="relative">

            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
            />

            <input
              placeholder="Search..."
              className="w-72 bg-[#101418] border border-zinc-800 rounded-xl py-3 pl-11 pr-4 outline-none transition focus:border-green-500"
            />

          </div>

          <button className="w-12 h-12 rounded-xl bg-[#101418] border border-zinc-800 flex items-center justify-center hover:border-green-500 transition">
            <Bell size={18} />
          </button>

          <div className="text-right">
            <div className="text-green-400">
              ● Online
            </div>

            <LiveClock />
          </div>

          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-400 transition-all duration-300 hover:border-red-500 hover:bg-red-500/20 hover:text-red-300"
          >
            <LogOut size={18} />
            Logout
          </button>

        </div>

      </header>

      {showLogoutModal && (
        <div
          onClick={() => setShowLogoutModal(false)}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
  onClick={(e) => e.stopPropagation()}
  className="
    w-[460px]
    rounded-3xl
    border
    border-red-500/20
    bg-[#0c1014]
    p-8
    shadow-[0_0_50px_rgba(239,68,68,.12)]
    animate-[logoutPopup_.35s_cubic-bezier(.22,1,.36,1)]
  "
>

            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
              <ShieldAlert size={34} />
            </div>

            <h2 className="text-center text-3xl font-bold">
              Confirm Logout
            </h2>

            <p className="mt-4 text-center text-zinc-400 leading-7">
              Are you sure you want to log out from
              <br />
              <span className="font-semibold text-green-400">
                ThreatEye Enterprise SOC
              </span>
              ?
            </p>

            <p className="mt-3 text-center text-sm text-zinc-500">
              Your current authenticated session will end.
            </p>

            <div className="mt-8 flex gap-4">

              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 rounded-xl border border-zinc-700 bg-[#14191e] py-3 font-semibold transition hover:border-green-500 hover:text-green-400"
              >
                Stay Logged In
              </button>

              <button
                onClick={confirmLogout}
                className="flex-1 rounded-xl bg-red-600 py-3 font-semibold transition hover:bg-red-500"
              >
                Yes, Log Out
              </button>

            </div>

          </div>
        </div>
      )}
    </>
  );
}