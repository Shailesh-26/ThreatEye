import { getDashboard } from "./dashboardService";

export async function getThreatDistribution() {
  const dashboard = await getDashboard();

  return [
    {
      name: "Failed Logins",
      value: dashboard.failed_logins
    },
    {
      name: "Port Scans",
      value: dashboard.port_scan_events
    },
    {
      name: "Successful Logins",
      value: dashboard.successful_logins
    }
  ];
}