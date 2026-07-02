function Logo() {
    return (
        <div className="flex items-center gap-3">

            <div className="h-10 w-10 rounded-xl bg-green-400 shadow-[0_0_20px_#00ff9d] flex items-center justify-center">

                <span className="text-black font-black">
                    T
                </span>

            </div>

            <div>

                <h1 className="text-xl font-bold text-green-400">
                    ThreatEye
                </h1>

                <p className="text-xs text-gray-500">
                    Cyber Threat Hunting
                </p>

            </div>

        </div>
    );
}

export default Logo;