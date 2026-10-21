import { Link } from "react-router-dom";

import Logo from "../ui/Logo";
import ReplayScope from "../replay/ReplayScope";
import day from "../../data/sampleDay.json";

/** Shared frame for sign-in and sign-up: form on the left, the sample replay running quietly on the right. */
export default function AuthLayout({ title, subtitle, children, footer }) {
    return (
        <div className="grid min-h-screen bg-scope lg:grid-cols-[minmax(420px,520px)_1fr]">
            <div className="flex flex-col border-graticule px-6 py-8 sm:px-10 lg:border-r">
                <Link to="/" aria-label="ThreatEye home" className="self-start">
                    <Logo />
                </Link>

                <div className="my-auto w-full max-w-[400px] py-12">
                    <h1 className="font-display text-4xl font-semibold text-readout">{title}</h1>
                    {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
                    <div className="mt-8">{children}</div>
                    {footer && <div className="mt-6 text-sm text-muted">{footer}</div>}
                </div>
            </div>

            <div className="graticule relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-center">
                <div className="px-10">
                    <ReplayScope mode="ambient" />
                </div>
                <p className="absolute bottom-6 left-10 text-sm text-faint">
                    Replaying <span className="font-mono">{day.source}</span>: {day.events.length} rows, {day.alerts.length} alerts.
                </p>
            </div>
        </div>
    );
}
