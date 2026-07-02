import {
    Search,
    Bell,
} from "lucide-react";

export default function Topbar() {

    const now = new Date();

    return (

        <header className="h-24 border-b border-green-500/10 bg-[#07090c] px-10 flex items-center justify-between">

            <div>

                <h1 className="text-4xl font-bold">

                    Security Operations Center

                </h1>

                <p className="text-zinc-500 mt-1">

                    ThreatEye v1.0

                </p>

            </div>

            <div className="flex items-center gap-5">

                <div className="relative">

                    <Search
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                    />

                    <input

                        placeholder="Search..."

                        className="w-72 bg-[#101418]
                        border border-zinc-800
                        rounded-xl
                        py-3
                        pl-11
                        pr-4
                        outline-none
                        text-white
                        focus:border-green-500"

                    />

                </div>

                <button

                    className="w-12 h-12 rounded-xl
                    bg-[#101418]
                    border border-zinc-800
                    flex items-center justify-center
                    hover:border-green-500"

                >

                    <Bell size={18}/>

                </button>

                <div className="text-right">

                    <div className="text-green-400">

                        ● Online

                    </div>

                    <div className="text-sm text-zinc-500">

                        {now.toLocaleTimeString()}

                    </div>

                </div>

            </div>

        </header>

    );

}