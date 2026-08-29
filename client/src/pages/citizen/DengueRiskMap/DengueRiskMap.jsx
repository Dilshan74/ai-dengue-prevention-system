import { useMemo, useState } from "react";
import PageHeader from "../../../components/common/PageHeader";
import SearchBar from "../../../components/common/SearchBar";
import { Select } from "../../../components/common/Field";
import DengueHotspotMap from "../../../components/maps/DengueHotspotMap";
import AreaRiskList from "../../../components/maps/AreaRiskList";
import { matchesQuery } from "../../../utils/helpers";

const RISK_OPTIONS = [
  { value: "all", label: "All risk levels" },
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Low", label: "Low" },
];

export default function DengueRiskMap() {
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState("all");
  const [dynamicAreas, setDynamicAreas] = useState([]);

  /** Filter for the backend API query. */
  const apiFilter = useMemo(() => {
    const f = {};
    if (risk !== "all") f.risk = risk;
    return f;
  }, [risk]);

  /** Client-side filter for the area list (dynamic data). */
  const areas = useMemo(
    () => {
      // Map API data structure to the expected structure for AreaRiskList
      const mappedAreas = dynamicAreas.map(item => ({
        id: item._id,
        name: item.locationName,
        risk: item.riskLevel === 'CRITICAL' ? 'High' : 
              item.riskLevel === 'HIGH' ? 'High' : 
              item.riskLevel === 'MEDIUM' ? 'Medium' : 'Low',
        reports: item.currentCases, // Show NDCU case count instead of reports
        phi: 'NDCU',
      }));

      return mappedAreas.filter(
        (area) =>
          matchesQuery(area, query, ["name"]) &&
          (risk === "all" || area.risk === risk),
      );
    },
    [query, risk, dynamicAreas],
  );

  return (
    <>
      <PageHeader
        title="Dengue Risk Map"
        description="Live risk zones and reported breeding sites across Sri Lanka."
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search location…"
          className="flex-1 sm:max-w-sm"
        />
        <Select
          className="h-10 w-44"
          value={risk}
          onChange={(event) => setRisk(event.target.value)}
          options={RISK_OPTIONS}
        />
      </div>

      {/* Real Google Map with dengue report markers */}
      <DengueHotspotMap filter={apiFilter} onDataLoaded={setDynamicAreas} />

      {/* Area risk list (dynamic data) */}
      <AreaRiskList areas={areas} className="mt-6 sm:grid-cols-2 lg:grid-cols-3" />
    </>
  );
}
