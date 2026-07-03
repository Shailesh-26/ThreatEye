import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../services/authService";

import CyberGrid from "../components/auth/CyberGrid";
import FloatingHexagons from "../components/auth/FloatingHexagons";
import LoginHero from "../components/auth/LoginHero";
import LoginForm from "../components/auth/LoginForm";

export default function Login() {
  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050608] text-white">
      <CyberGrid />
      <FloatingHexagons />

      <div className="relative z-10 flex min-h-screen">
        {/* Left Side */}
        <section className="hidden lg:flex w-[58%] px-16 xl:px-24 py-16 items-center">
          <LoginHero />
        </section>

        {/* Divider */}
        <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-green-500/20 to-transparent" />

        {/* Right Side */}
        <section className="flex w-full lg:flex-1 items-center justify-center px-6 sm:px-10 lg:px-16 py-12">
          <LoginForm />
        </section>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,.08),transparent_40%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70" />
    </div>
  );
}