// Fired after logs change (upload or sample load) so open pages can refresh.
export const LOGS_UPDATED = "threateye:logs-updated";

export function announceLogsUpdated() {
    window.dispatchEvent(new Event(LOGS_UPDATED));
}

// Fired after the profile (e.g. name) changes so the top bar can refresh.
export const PROFILE_UPDATED = "threateye:profile-updated";

export function announceProfileUpdated() {
    window.dispatchEvent(new Event(PROFILE_UPDATED));
}
