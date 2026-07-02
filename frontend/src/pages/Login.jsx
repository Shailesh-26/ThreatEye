import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Shield, Eye, EyeOff } from "lucide-react";
import { login, isAuthenticated } from "../services/authService";

export default function Login() {

    const [email, setEmail] = useState("");

    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    if (isAuthenticated()) {

        return <Navigate to="/" replace />;

    }

    async function handleLogin(e) {

        e.preventDefault();

        setLoading(true);

        setError("");

        try {

            await login(email, password);

            window.location.href = "/";

        }

        catch {

            setError("Invalid email or password");

        }

        finally {

            setLoading(false);

        }

    }

    return (

        <div className="min-h-screen flex items-center justify-center bg-[#050608] px-5">

            <div className="w-full max-w-md rounded-3xl border border-green-500/20 bg-[#11161d]/95 backdrop-blur-xl shadow-[0_0_60px_rgba(34,197,94,.08)] p-10">

                <div className="flex items-center gap-4 mb-8">

                    <div className="w-16 h-16 rounded-2xl bg-green-500 flex items-center justify-center shadow-[0_0_35px_rgba(34,197,94,.5)]">

                        <Shield className="text-black" size={28}/>

                    </div>

                    <div>

                        <h1 className="text-3xl font-bold">

                            Welcome Back

                        </h1>

                        <p className="text-zinc-500">

                            ThreatEye Secure Login

                        </p>

                    </div>

                </div>

                <form onSubmit={handleLogin} className="space-y-5">

                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e)=>setEmail(e.target.value)}
                        className="w-full rounded-xl bg-[#0b0f14] border border-zinc-800 px-5 py-4 outline-none focus:border-green-500"
                    />

                    <div className="relative">

                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={password}
                            onChange={(e)=>setPassword(e.target.value)}
                            className="w-full rounded-xl bg-[#0b0f14] border border-zinc-800 px-5 py-4 pr-14 outline-none focus:border-green-500"
                        />

                        <button
                            type="button"
                            onClick={()=>setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500"
                        >

                            {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}

                        </button>

                    </div>

                    {error && (

                        <p className="text-red-400">

                            {error}

                        </p>

                    )}

                    <button
                        disabled={loading}
                        className="w-full rounded-xl bg-green-500 py-4 font-bold text-black transition hover:scale-[1.02] hover:bg-green-400"
                    >

                        {loading ? "Signing In..." : "LOGIN"}

                    </button>

                </form>

            </div>

        </div>

    );

}