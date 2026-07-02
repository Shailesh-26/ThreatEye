import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout({ children }) {

    return (

        <div className="flex h-screen bg-[#050608]">

            <Sidebar />

            <div className="flex-1 flex flex-col">

                <Topbar />

                <main className="flex-1 overflow-auto p-12">

                    {children}

                </main>

            </div>

        </div>

    );

}