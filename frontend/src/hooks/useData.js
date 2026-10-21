import { useCallback, useEffect, useState } from "react";

import { LOGS_UPDATED } from "../lib/events";

/**
 * Loads data with `loader()` and reloads it whenever logs change.
 * Returns { data, error, loading, reload }.
 */
export default function useData(loader) {
    const [state, setState] = useState({ data: null, error: null, loading: true });

    const reload = useCallback(() => {
        setState((s) => ({ ...s, loading: true }));
        return loader()
            .then((data) => setState({ data, error: null, loading: false }))
            .catch((error) => setState((s) => ({ data: s.data, error, loading: false })));
    }, [loader]);

    useEffect(() => {
        let cancelled = false;
        loader()
            .then((data) => !cancelled && setState({ data, error: null, loading: false }))
            .catch((error) => !cancelled && setState({ data: null, error, loading: false }));
        const onUpdate = () => reload();
        window.addEventListener(LOGS_UPDATED, onUpdate);
        return () => {
            cancelled = true;
            window.removeEventListener(LOGS_UPDATED, onUpdate);
        };
    }, [loader, reload]);

    return { ...state, reload };
}
