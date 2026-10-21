import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AuthLayout from "../components/layout/AuthLayout";
import Button from "../components/ui/Button";
import Field from "../components/ui/Field";
import { errorMessage, register } from "../services/authService";

function validate({ username, email, password, confirm }) {
    const errors = {};
    if (username.trim().length < 2) errors.username = "Use at least 2 characters.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) errors.email = "Enter an email like name@example.com.";
    if (password.length < 8) errors.password = "Use at least 8 characters.";
    if (confirm !== password) errors.confirm = "The passwords don't match.";
    return errors;
}

export default function Signup() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
    const [touched, setTouched] = useState({});
    const [serverError, setServerError] = useState("");
    const [loading, setLoading] = useState(false);

    const errors = validate(form);
    const show = (field) => (touched[field] ? errors[field] : undefined);
    const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });
    const blur = (field) => () => setTouched({ ...touched, [field]: true });

    async function onSubmit(e) {
        e.preventDefault();
        setTouched({ username: true, email: true, password: true, confirm: true });
        if (Object.keys(errors).length) return;

        setServerError("");
        setLoading(true);
        try {
            await register(form.username.trim(), form.email.trim(), form.password);
            navigate("/dashboard", { replace: true });
        } catch (err) {
            setServerError(errorMessage(err, "The account couldn't be created. Try again."));
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthLayout
            title="Create an account"
            subtitle="Your account is saved in the MongoDB database this ThreatEye server uses."
            footer={
                <>
                    Already registered?{" "}
                    <Link to="/login" className="text-phosphor hover:underline">Sign in</Link>
                </>
            }
        >
            <form onSubmit={onSubmit} className="space-y-5" noValidate>
                <Field label="Name" autoComplete="username" value={form.username} onChange={update("username")} onBlur={blur("username")} error={show("username")} />
                <Field label="Email" type="email" autoComplete="email" value={form.email} onChange={update("email")} onBlur={blur("email")} error={show("email")} />
                <Field label="Password" type="password" autoComplete="new-password" hint="At least 8 characters." value={form.password} onChange={update("password")} onBlur={blur("password")} error={show("password")} />
                <Field label="Confirm password" type="password" autoComplete="new-password" value={form.confirm} onChange={update("confirm")} onBlur={blur("confirm")} error={show("confirm")} />
                {serverError && (
                    <p role="alert" className="rounded-[var(--radius-control)] border border-sev-critical/30 bg-sev-critical/10 px-3.5 py-2.5 text-sm text-sev-critical">
                        {serverError}
                    </p>
                )}
                <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
                    {loading ? "Creating account" : "Create account"}
                </Button>
            </form>
        </AuthLayout>
    );
}
