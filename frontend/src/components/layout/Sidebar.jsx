import {
  LayoutDashboard,
  Database,
  ShieldAlert,
  Radar,
  Clock3,
  FileText,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import {
  NavLink,
  useNavigate,
  useLocation,
} from "react-router-dom";

const menu = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/" },
  { name: "Logs", icon: Database, path: "/logs" },
  { name: "Alerts", icon: ShieldAlert, path: "/alerts" },
  { name: "Detections", icon: Radar, path: "/detections" },
  { name: "Timeline", icon: Clock3, path: "/timeline" },
  { name: "Reports", icon: FileText, path: "/reports" },
  { name: "Settings", icon: Settings, path: "/settings" },
];

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoClick = () => {
    if (location.pathname !== "/") {
      navigate("/");
      return;
    }

    if (window.scrollY > 50) {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      return;
    }

    window.location.reload();
  };

  return (
    <aside
      className={`bg-[#0b0f14] border-r border-green-500/10 transition-all duration-300 flex flex-col ${
        sidebarOpen ? "w-72" : "w-24"
      }`}
    >
      <div className="h-24 border-b border-green-500/10 flex items-center justify-between px-5">

        <div
          onClick={handleLogoClick}
          className="flex items-center cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center text-black font-bold shadow-[0_0_25px_rgba(34,197,94,.6)]">
            T
          </div>

          {sidebarOpen && (
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-green-400">
                ThreatEye
              </h1>

              <p className="text-sm text-zinc-500">
                Cyber Threat Hunting
              </p>
            </div>
          )}
        </div>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-zinc-400 hover:text-green-400 transition"
        >
          {sidebarOpen ? (
            <PanelLeftClose size={22} />
          ) : (
            <PanelLeftOpen size={22} />
          )}
        </button>

      </div>

      <nav className="flex-1 px-3 py-6">
        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `flex items-center ${
                  sidebarOpen
                    ? "justify-start px-5"
                    : "justify-center"
                } py-4 rounded-xl mb-3 transition-all duration-300 ${
                  isActive
                    ? "bg-green-500/10 text-green-400"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-green-400"
                }`
              }
            >
              <Icon size={21} />

              {sidebarOpen && (
                <span className="ml-4 font-medium">
                  {item.name}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-green-500/10 p-5">
        <div
          className={`flex items-center ${
            sidebarOpen
              ? "justify-start"
              : "justify-center"
          }`}
        >
          <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />

          {sidebarOpen && (
            <span className="ml-3 text-green-400">
              System Online
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}