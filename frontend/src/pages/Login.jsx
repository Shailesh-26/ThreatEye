import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import AuthLayout from "../components/layout/AuthLayout";
import Button from "../components/ui/Button";
import Field from "../components/ui/Field";
import { errorMessage, login } from "../services/authService";

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function onSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await login(email.trim(), password);
            navigate(location.state?.from ?? "/dashboard", { replace: true });
        } catch (err) {
            setError(
                err?.response?.status === 401
                    ? "That email and password don't match an account."
                    : errorMessage(err, "Sign-in failed. Try again.")
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthLayout
            title="Sign in"
            subtitle="Use the email and password you registered with."
            footer={
                <>
                    No account yet?{" "}
                    <Link to="/signup" className="text-phosphor hover:underline">Create one</Link>
                </>
            }
        >
            <form onSubmit={onSubmit} className="space-y-5" noValidate>
                <Field
                    label="Email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <Field
                    label="Password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                {error && (
                    <p role="alert" className="rounded-[var(--radius-control)] border border-sev-critical/30 bg-sev-critical/10 px-3.5 py-2.5 text-sm text-sev-critical">
                        {error}
                    </p>
                )}
                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    disabled={loading || !email || !password}
                >
                    {loading ? "Signing in" : "Sign in"}
                </Button>
            </form>
        </AuthLayout>
    );
}
