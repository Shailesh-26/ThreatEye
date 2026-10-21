import { useEffect, useRef, useState } from "react";

/** Open/close state for a small menu: closes on outside click or Escape. */
export default function usePopover() {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const onClick = (e) => {
            if (!ref.current?.contains(e.target)) setOpen(false);
        };
        const onKey = (e) => e.key === "Escape" && setOpen(false);
        window.addEventListener("mousedown", onClick);
        window.addEventListener("keydown", onKey);
        return () => {
            window.removeEventListener("mousedown", onClick);
            window.removeEventListener("keydown", onKey);
        };
    }, [open]);

    return { open, setOpen, ref };
}
