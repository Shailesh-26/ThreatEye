import { Link } from "react-router-dom";

const VARIANTS = {
    // The one phosphor-filled button per screen: the main action.
    primary:
        "bg-phosphor text-scope font-semibold hover:bg-[#8af0b4] active:bg-phosphor-dim disabled:bg-graticule disabled:text-faint",
    // Raised plate for secondary actions.
    secondary:
        "bg-plate text-readout border border-graticule-hi hover:bg-plate-hi hover:border-faint disabled:text-faint",
    // Text-only, for low-emphasis actions.
    ghost: "text-muted hover:text-readout hover:bg-plate",
    danger:
        "bg-plate text-sev-critical border border-sev-critical/30 hover:border-sev-critical/70 hover:bg-sev-critical/10",
};

const SIZES = {
    sm: "h-8 px-3 text-sm gap-1.5",
    md: "h-10 px-4 text-[15px] gap-2",
    lg: "h-12 px-6 text-base gap-2.5",
};

function classes(variant, size, className) {
    return [
        "inline-flex items-center justify-center rounded-[var(--radius-control)] transition-colors duration-150",
        "disabled:cursor-not-allowed select-none whitespace-nowrap",
        VARIANTS[variant],
        SIZES[size],
        className,
    ].join(" ");
}

/**
 * <Button variant="primary">Save</Button>
 * <Button to="/login">Sign in</Button>   renders a router Link
 * <Button href="https://...">Docs</Button> renders an external link
 */
export default function Button({
    variant = "secondary",
    size = "md",
    to,
    href,
    className = "",
    children,
    ...props
}) {
    const cls = classes(variant, size, className);

    if (to) {
        return <Link to={to} className={cls} {...props}>{children}</Link>;
    }
    if (href) {
        return (
            <a href={href} className={cls} target="_blank" rel="noreferrer" {...props}>
                {children}
            </a>
        );
    }
    return <button type="button" className={cls} {...props}>{children}</button>;
}
