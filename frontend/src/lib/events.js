// Fired after logs change (upload or sample load) so open pages can refresh.
export const LOGS_UPDATED = "threateye:logs-updated";

export function announceLogsUpdated() {
    window.dispatchEvent(new Event(LOGS_UPDATED));
}
