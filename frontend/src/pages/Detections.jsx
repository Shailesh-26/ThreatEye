import { useEffect, useState } from "react";
import { getDetectionRules } from "../services/detectionService";

export default function Detections() {
  const [rules, setRules] = useState([]);

  useEffect(() => {
    getDetectionRules().then(setRules);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-white">Detection Rules</h1>
        <p className="text-zinc-400 mt-1">
          Active detection rules used by ThreatEye Detection Engine.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
        <table className="w-full">
          <thead className="bg-zinc-800">
            <tr className="text-left">
              <th className="p-4">Rule</th>
              <th>Status</th>
              <th>Severity</th>
              <th>MITRE</th>
              <th>Last Run</th>
            </tr>
          </thead>

          <tbody>
            {rules.map((rule) => (
              <tr
                key={rule.name}
                className="border-t border-zinc-800 hover:bg-zinc-800/40"
              >
                <td className="p-4 font-medium">{rule.name}</td>

                <td>
                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      rule.status === "Enabled"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {rule.status}
                  </span>
                </td>

                <td>{rule.severity}</td>

                <td>{rule.mitre}</td>

                <td>{rule.last_run}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}