import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function AppLayout({ children }) {

    return (

        <div className="flex h-screen bg-[#050608]">

            <Sidebar />

            <div className="flex flex-1 flex-col">

                <Topbar />

                <main className="flex-1 overflow-auto p-8">

                    {children}

                </main>

            </div>

        </div>

    );

}

export default AppLayout;