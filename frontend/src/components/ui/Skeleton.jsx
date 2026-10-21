/** Placeholder block shown while data loads. */
export default function Skeleton({ className = "" }) {
    return <div className={`animate-pulse rounded-[12px] bg-plate/70 ${className}`} aria-hidden="true" />;
}
