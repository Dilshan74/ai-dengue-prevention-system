import { useEffect, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import PageHeader from "../../../components/common/PageHeader";
import ReportsBarChart from "../../../components/charts/ReportsBarChart";
import RiskPieChart from "../../../components/charts/RiskPieChart";
import TrendLineChart from "../../../components/charts/TrendLineChart";
import Button from "../../../components/common/Button";
import adminService from "../../../services/adminService";

export default function Statistics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await adminService.statistics();
      setData(response);
    } catch (err) {
      console.error("Failed to load statistics:", err);
      setError("Failed to load live analytics. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const monthlyData = data?.monthly || [];
  const districtData = data?.reportsByDistrict || [];
  const riskData = data?.riskDistribution || [];
  const statusData = data?.reportStatusSplit || [];

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader title="Statistics" description="System-wide analytics" />
        <Button
          variant="outline"
          size="sm"
          onClick={fetchStats}
          disabled={loading}
          className="self-start sm:self-center"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh Data
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <TrendLineChart
          data={monthlyData}
          title="Monthly Reports"
          dataKey="reports"
          color="var(--accent)"
        />
        <ReportsBarChart
          data={districtData}
          title="Reports by District"
          color="var(--accent)"
        />
        <RiskPieChart data={riskData} title="Risk Distribution" />
        <RiskPieChart data={statusData} title="Report Status" />
      </div>
    </>
  );
}

