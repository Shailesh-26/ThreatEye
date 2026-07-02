import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { PieChart as PieChartIcon } from "lucide-react";

import { getThreatDistribution } from "../../services/chartService";

const COLORS = [
  "#ef4444",
  "#22c55e",
  "#06b6d4"
];

export default function ThreatChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function loadChart() {
      const chartData = await getThreatDistribution();
      setData(chartData);
    }

    loadChart();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-zinc-800 bg-[#0B0F14] p-6"
    >
      <div className="mb-6 flex items-center gap-3">
        <PieChartIcon className="text-green-400" size={24} />

        <div>
          <h2 className="text-xl font-bold">Threat Distribution</h2>
          <p className="text-sm text-zinc-500">
            Overview of detected events
          </p>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              outerRadius={110}
              innerRadius={60}
              paddingAngle={4}
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}