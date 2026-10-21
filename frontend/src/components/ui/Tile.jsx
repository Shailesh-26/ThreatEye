/** A bento tile: heading row (title + optional action) and content. */
export default function Tile({ title, action, children, className = "", bodyClassName = "", flush = false, as: Tag = "section", ...props }) {
    return (
        <Tag className={`flex min-w-0 flex-col rounded-[var(--radius-panel)] border border-graticule bg-bezel ${className}`} {...props}>
            {(title || action) && (
                <div className="flex items-center justify-between gap-3 px-5 pt-4">
                    {title && <h2 className="font-display text-lg font-semibold text-readout">{title}</h2>}
                    {action}
                </div>
            )}
            <div className={`min-w-0 flex-1 ${flush ? "" : "p-5"} ${bodyClassName}`}>{children}</div>
        </Tag>
    );
}
