export default function Kbd({ children }) {
    return (
        <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] border border-graticule-hi bg-scope px-1.5 font-mono text-[11px] text-muted">
            {children}
        </kbd>
    );
}
