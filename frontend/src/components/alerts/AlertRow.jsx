export default function AlertRow({alert}) {
    return (
        <div className="flex justify-between items-center py-4 border-b border-zinc-800">
            <div>
                <h3 className="font-semibold">
                    {alert.alert_type}
                </h3>
                <p className="text-zinc-500 text-sm">
                    {alert.description}
                </p>
            </div>
            <div className="text-right">
                <div className="text-red-400">
                    {alert.severity}
                </div>
                <div className="text-zinc-500 text-sm">
                    {alert.source_ip}
                </div>
            </div>
        </div>
    );
}