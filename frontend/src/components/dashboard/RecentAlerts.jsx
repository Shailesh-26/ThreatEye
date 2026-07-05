import {

    useEffect,

    useState

} from "react";

import { motion } from "framer-motion";

import {

    ShieldAlert

} from "lucide-react";

import AlertRow from "../alerts/AlertRow";

import { fetchAlerts } from "../../services/alertService";

export default function RecentAlerts() {

    const [alerts, setAlerts] = useState([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {

        async function loadAlerts() {

            try {

                const data = await fetchAlerts();

                setAlerts(data);

            }

            catch (err) {

                console.error(err);

            }

            finally {

                setLoading(false);

            }

        }

        loadAlerts();

    }, []);

    return (

        <motion.div

            initial={{

                opacity: 0,

                y: 25

            }}

            animate={{

                opacity: 1,

                y: 0

            }}

            transition={{

                duration: 0.5

            }}

            className="mt-10 rounded-3xl
                       border border-zinc-800
                       bg-[#0B0F14]
                       p-7"

        >

            <div className="mb-7 flex items-center justify-between">

                <div className="flex items-center gap-3">

                    <ShieldAlert

                        className="text-green-400"

                        size={24}

                    />

                    <div>

                        <h2 className="text-2xl font-bold">

                            Recent Alerts

                        </h2>

                        <p className="text-sm text-zinc-500">

                            Latest detected threats

                        </p>

                    </div>

                </div>

            </div>

            {

                loading

                ?

                <p className="text-zinc-500">

                    Loading...

                </p>

                :

                alerts.length === 0

                ?

                <p className="text-zinc-500">

                    No alerts found.

                </p>

                :

                <div className="space-y-4">

                    {

                        alerts

                            .slice(0,5)

                            .map(alert => (

                                <AlertRow

                                    key={alert._id}

                                    alert={alert}

                                />

                            ))

                    }

                </div>

            }

        </motion.div>

    );

}