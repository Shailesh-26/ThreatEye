import { motion } from "framer-motion";
import { Eye, EyeOff, Shield } from "lucide-react";
import { useState } from "react";

export default function LoginForm() {

  const [showPassword, setShowPassword] = useState(false);

  return (

    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: .8 }}
      className="w-full max-w-md"
    >

      <div className="rounded-3xl border border-green-500/20 bg-white/[0.04] backdrop-blur-xl p-10 shadow-[0_0_60px_rgba(34,197,94,.12)]">

        <div className="flex items-center gap-3">

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500 text-black">

            <Shield />

          </div>

          <div>

            <h2 className="text-3xl font-bold">

              Welcome Back

            </h2>

            <p className="text-zinc-500">

              Secure Login

            </p>

          </div>

        </div>

        <div className="mt-10 space-y-6">

          <input
            type="email"
            placeholder="Email Address"
            className="w-full rounded-xl border border-zinc-700 bg-[#0a0d12] px-5 py-4 outline-none transition focus:border-green-400"
          />

          <div className="relative">

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full rounded-xl border border-zinc-700 bg-[#0a0d12] px-5 py-4 pr-14 outline-none transition focus:border-green-400"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500"
            >

              {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}

            </button>

          </div>

          <div className="flex items-center justify-between text-sm">

            <label className="flex items-center gap-2">

              <input type="checkbox" />

              Remember Me

            </label>

            <button className="text-green-400 hover:underline">

              Forgot Password?

            </button>

          </div>

          <button
            className="
            w-full
            rounded-xl
            bg-green-500
            py-4
            font-semibold
            text-black
            transition
            hover:scale-[1.02]
            hover:bg-green-400
            "
          >

            LOGIN

          </button>

          <p className="text-center text-zinc-500">

            Don't have an account?

            <button className="ml-2 text-green-400">

              Create Account

            </button>

          </p>

        </div>

      </div>

    </motion.div>

  );
}