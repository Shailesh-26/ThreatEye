import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Shield } from "lucide-react";
import { login } from "../../services/authService";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await login(email, password);
      window.location.href = "/";
    } catch (err) {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8 }}
      className="w-full max-w-md"
    >
      <div className="rounded-3xl border border-green-500/20 bg-white/[0.04] backdrop-blur-2xl p-10 shadow-[0_0_60px_rgba(34,197,94,.12)]">

        {/* Header */}

        <div className="flex items-center gap-4">

          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500 shadow-[0_0_30px_rgba(34,197,94,.45)]">

            <Shield className="text-black" size={28} />

          </div>

          <div>

            <h2 className="text-3xl font-bold tracking-tight">

              Welcome Back

            </h2>

            <p className="mt-1 text-sm text-zinc-500">

              Sign in to continue to ThreatEye

            </p>

          </div>

        </div>

        {/* Form */}

        <form
          onSubmit={handleLogin}
          className="mt-10 space-y-6"
        >

          <div>

            <label className="mb-2 block text-sm font-medium text-zinc-400">

              Email Address

            </label>

            <input
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="
                w-full
                rounded-xl
                border
                border-zinc-700
                bg-[#0a0d12]
                px-5
                py-4
                outline-none
                transition-all
                duration-300
                focus:border-green-400
                focus:ring-2
                focus:ring-green-500/20
              "
            />

          </div>

          <div>

            <label className="mb-2 block text-sm font-medium text-zinc-400">

              Password

            </label>

            <div className="relative">

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="
                  w-full
                  rounded-xl
                  border
                  border-zinc-700
                  bg-[#0a0d12]
                  px-5
                  py-4
                  pr-14
                  outline-none
                  transition-all
                  duration-300
                  focus:border-green-400
                  focus:ring-2
                  focus:ring-green-500/20
                "
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="
                  absolute
                  right-4
                  top-1/2
                  -translate-y-1/2
                  text-zinc-500
                  transition
                  hover:text-green-400
                "
              >
                {showPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>

            </div>

          </div>

          <div className="flex items-center justify-between text-sm">

            <label className="flex items-center gap-2 text-zinc-400">

              <input
                type="checkbox"
                className="accent-green-500"
              />

              Remember Me

            </label>

            <button
              type="button"
              className="text-green-400 transition hover:text-green-300 hover:underline"
            >

              Forgot Password?

            </button>

          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="
                rounded-xl
                border
                border-red-500/20
                bg-red-500/10
                px-4
                py-3
                text-sm
                text-red-400
              "
            >
              {error}
            </motion.div>
          )}

          <motion.button
            whileHover={!loading ? { scale: 1.02 } : {}}
            whileTap={!loading ? { scale: 0.98 } : {}}
            type="submit"
            disabled={loading}
            className="
              w-full
              rounded-xl
              bg-green-500
              py-4
              font-semibold
              text-black
              transition-all
              duration-300
              shadow-[0_0_30px_rgba(34,197,94,.25)]
              hover:bg-green-400
              disabled:cursor-not-allowed
              disabled:opacity-70
            "
          >
            {loading ? "Signing In..." : "Secure Login"}
          </motion.button>

          <div className="flex items-center gap-3 pt-2">

            <div className="h-px flex-1 bg-zinc-800" />

            <span className="text-xs uppercase tracking-widest text-zinc-600">

              Secure Access

            </span>

            <div className="h-px flex-1 bg-zinc-800" />

          </div>

          <p className="text-center text-sm text-zinc-500">

            Protected using JWT Authentication

          </p>

        </form>

      </div>
    </motion.div>
  );
}