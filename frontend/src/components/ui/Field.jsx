import { useId } from "react";

/** Labelled text input with an optional hint and an error message. */
export default function Field({ label, hint, error, className = "", ...inputProps }) {
    const id = useId();
    const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

    return (
        <div className={className}>
            <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-muted">
                {label}
            </label>
            <input
                id={id}
                aria-invalid={error ? "true" : undefined}
                aria-describedby={describedBy}
                className={[
                    "h-11 w-full rounded-[var(--radius-control)] bg-scope px-3.5 text-readout",
                    "border outline-none focus-visible:outline-none transition-colors placeholder:text-faint disabled:cursor-not-allowed disabled:text-muted disabled:opacity-70",
                    error
                        ? "border-sev-critical/60 focus:border-sev-critical"
                        : "border-graticule-hi focus:border-phosphor",
                ].join(" ")}
                {...inputProps}
            />
            {error ? (
                <p id={`${id}-error`} className="mt-1.5 text-sm text-sev-critical">{error}</p>
            ) : hint ? (
                <p id={`${id}-hint`} className="mt-1.5 text-sm text-faint">{hint}</p>
            ) : null}
        </div>
    );
}
