import { useNavigate, useLocation } from "react-router-dom";

export default function Logo() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    if (location.pathname !== "/") {
      navigate("/");
      return;
    }

    if (window.scrollY > 0) {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
      return;
    }

    window.location.reload();
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-4"
    >
      <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center text-black font-bold shadow-[0_0_30px_rgba(34,197,94,.6)]">
        T
      </div>

      <div>
        <h1 className="text-2xl font-bold text-green-400">
          ThreatEye
        </h1>

        <p className="text-sm text-zinc-500">
          Cyber Threat Hunting
        </p>
      </div>
    </button>
  );
}