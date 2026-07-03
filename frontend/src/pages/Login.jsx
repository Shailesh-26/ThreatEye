import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../services/authService";

import CyberGrid from "../components/auth/CyberGrid";
import FloatingHexagons from "../components/auth/FloatingHexagons";
import LoginHero from "../components/auth/LoginHero";
import LoginForm from "../components/auth/LoginForm";
import { useRef } from "react";
import CyberScrollbar from "../components/auth/CyberScrollbar";

export default function Login() {
  const leftRef = useRef(null);
  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="relative h-screen overflow-hidden bg-[#050608] text-white">
      <CyberGrid />
      <FloatingHexagons />

      <div className="relative z-10 flex h-screen">
        {/* LEFT PANEL */}
        <section
    ref={leftRef}
    className="relative hidden lg:block w-[58%] h-screen overflow-y-auto overflow-x-hidden px-8 xl:px-12 no-scrollbar"
>
          <LoginHero />
          <CyberScrollbar containerRef={leftRef}/>
        </section>

        {/* Divider */}
        <div className="hidden lg:block w-px h-full bg-gradient-to-b from-transparent via-green-500/20 to-transparent" />

        {/* RIGHT PANEL */}
        <section className="flex-1 h-screen sticky top-0 flex items-center justify-center px-10">
          <div className="w-full max-w-lg">
            <LoginForm />
          </div>
        </section>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,.08),transparent_40%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70" />
    </div>
  );
}