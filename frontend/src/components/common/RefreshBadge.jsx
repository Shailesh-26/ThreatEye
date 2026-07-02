import { RefreshCw } from "lucide-react";

export default function RefreshBadge() {
    return (
        <div className="flex items-center gap-2 text-green-400 text-sm">
            <RefreshCw
                size={14}
                className="animate-spin"
                style={{
                    animationDuration: "3s",
                }}
            />
            Auto Refresh (10s)
        </div>
    );
}