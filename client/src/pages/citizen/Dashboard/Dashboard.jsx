import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Camera,
  CheckCircle2,
  CloudRain,
  Droplets,
  FileText,
  Search,
  Scan,
  ThermometerSun,
  Upload,
  AlertTriangle,
  Clock,
  Layers,
  ArrowRight
} from "lucide-react";
import Button from "../../../components/common/Button";
import PageHeader from "../../../components/common/PageHeader";
import Card from "../../../components/common/Card";
import { PREVENTION_TIPS, WEATHER } from "../../../utils/constants";
import citizenService from "../../../services/citizenService";
import useAuth from "../../../hooks/useAuth";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalReports: 0, pending: 0, resolved: 0, highRisk: 0 });
  const [areaRisk, setAreaRisk] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State for live weather data
  const [weather, setWeather] = useState({ temp: "-", humidity: "-", rain: "-" });

  const CITY_COORDINATES = {
    Colombo: { lat: 6.9271, lng: 79.8612 },
    Gampaha: { lat: 7.0873, lng: 79.9925 },
    Kandy: { lat: 7.2906, lng: 80.6337 },
    Galle: { lat: 6.0535, lng: 80.2210 },
    Nugegoda: { lat: 6.8721, lng: 79.8890 },
    Rajagiriya: { lat: 6.9091, lng: 79.8952 },
    Maharagama: { lat: 6.8480, lng: 79.9265 },
    Dehiwala: { lat: 6.8390, lng: 79.8765 },
    Kotte: { lat: 6.8887, lng: 79.9187 },
  };

  useEffect(() => {
    citizenService
      .dashboard()
      .then((data) => {
        if (data?.stats) setStats(data.stats);
        if (data?.areaRisk) setAreaRisk(data.areaRisk);
        
        const resolvedCity = data?.areaRisk?.locationName || user?.area || "Colombo";
        const coords = CITY_COORDINATES[resolvedCity] || CITY_COORDINATES.Colombo;
        
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current=temperature_2m,relative_humidity_2m,precipitation`)
          .then(res => res.json())
          .then(weatherData => {
            if (weatherData && weatherData.current) {
              setWeather({
                temp: Math.round(weatherData.current.temperature_2m),
                humidity: Math.round(weatherData.current.relative_humidity_2m),
                rain: Math.round(weatherData.current.precipitation),
              });
            }
          })
          .catch(err => console.error("Failed to fetch meteorological data", err));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div>
      <PageHeader
        title={`Citizen Surveillance Console // ${user?.name ?? "Citizen"}`}
        description="Public Health Dengue Vector Early Warning & Community Surveillance System"
      />

      {/* Top Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 font-mono">
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Reports Logged</div>
              <div className="mt-1 text-2xl font-bold text-foreground">
                {loading ? "—" : stats.totalReports}
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded border border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Layers className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] text-amber-700 dark:text-amber-400 uppercase tracking-wider">Inspection Queue</div>
              <div className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-400">
                {loading ? "—" : stats.pending}
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-rose-500/20 bg-rose-500/5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] text-rose-700 dark:text-rose-400 uppercase tracking-wider">High Risk Priority</div>
              <div className="mt-1 text-2xl font-bold text-rose-700 dark:text-rose-400">
                {loading ? "—" : stats.highRisk}
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Verified / Resolved</div>
              <div className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                {loading ? "—" : stats.resolved}
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        {/* Utilitarian Report Ingestion Banner */}
        <div className="rounded-lg border border-teal-800/60 bg-slate-950 p-6 text-slate-100 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Technical Corner Reticles */}
          <div className="absolute top-2 left-2 h-3 w-3 border-t-2 border-l-2 border-teal-500/50 pointer-events-none" />
          <div className="absolute top-2 right-2 h-3 w-3 border-t-2 border-r-2 border-teal-500/50 pointer-events-none" />
          <div className="absolute bottom-2 left-2 h-3 w-3 border-b-2 border-l-2 border-teal-500/50 pointer-events-none" />
          <div className="absolute bottom-2 right-2 h-3 w-3 border-b-2 border-r-2 border-teal-500/50 pointer-events-none" />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-teal-500/40 bg-teal-500/10 text-teal-400 font-bold uppercase tracking-wider">
                COMPUTER VISION INGESTION
              </span>
              <span className="font-mono text-xs text-slate-400">// YOLOv8m-Dengue</span>
            </div>
            
            <h2 className="text-lg font-bold tracking-tight text-white font-mono">
              REPORT SUSPECTED MOSQUITO BREEDING SITE
            </h2>
            
            <p className="mt-2 text-xs text-slate-300 font-sans leading-relaxed max-w-lg">
              Capture or upload high-resolution photographic evidence of stagnant water accumulation, discarded tyres, drain inlets, or storage vessels. Automated neural network inference classifies breeding cues and triggers PHI inspection priority.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 font-mono text-xs">
            <Button as={Link} to="/citizen/upload" className="font-mono text-xs h-9">
              <Upload className="h-3.5 w-3.5 mr-1.5" /> UPLOAD EVIDENCE PHOTO
            </Button>
            <Button as={Link} to="/citizen/track" variant="outline" className="font-mono text-xs text-slate-200 border-slate-700 hover:bg-slate-900 h-9">
              <FileText className="h-3.5 w-3.5 mr-1.5" /> AUDIT MY SUBMISSIONS
            </Button>
          </div>
        </div>

        {/* Sector Epidemiological Risk Card */}
        <div className="rounded-lg border border-border bg-card p-5 font-mono">
          <div className="flex items-start justify-between mb-4 border-b border-border/80 pb-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">SURVEILLANCE SECTOR RISK</span>
              <h3 className="text-sm font-bold text-foreground mt-0.5">
                {areaRisk?.locationName || user?.area || "Western Province"}
              </h3>
            </div>
            <span className={`px-2.5 py-0.5 rounded text-xs font-bold border uppercase tracking-wider ${
              areaRisk?.riskLevel === 'CRITICAL' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30' :
              areaRisk?.riskLevel === 'HIGH' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30' :
              areaRisk?.riskLevel === 'MODERATE' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' :
              'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
            }`}>
              {areaRisk?.riskLevel ? `${areaRisk.riskLevel} RISK` : "MODERATE RISK"}
            </span>
          </div>

          {/* Metric Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline text-xs">
              <span className="text-muted-foreground">Composite Area Index</span>
              <span className="text-lg font-bold text-foreground">{areaRisk?.riskScore ?? 42}<span className="text-xs text-muted-foreground font-normal"> / 100</span></span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded bg-secondary">
              <div 
                className="h-full bg-teal-500 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(10, areaRisk?.riskScore ?? 42))}%` }}
              />
            </div>
          </div>

          {/* Meteorological Telemetry Feed */}
          <div className="mt-4 pt-3 border-t border-border/80 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded border border-border bg-muted/20">
              <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mb-1">
                <ThermometerSun className="h-3 w-3 text-amber-500" /> TEMP
              </div>
              <div className="font-bold text-foreground">{weather.temp}°C</div>
            </div>

            <div className="p-2 rounded border border-border bg-muted/20">
              <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mb-1">
                <Droplets className="h-3 w-3 text-cyan-500" /> HUMIDITY
              </div>
              <div className="font-bold text-foreground">{weather.humidity}%</div>
            </div>

            <div className="p-2 rounded border border-border bg-muted/20">
              <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mb-1">
                <CloudRain className="h-3 w-3 text-blue-500" /> RAIN (24H)
              </div>
              <div className="font-bold text-foreground">{weather.rain} mm</div>
            </div>
          </div>
        </div>
      </div>

      {/* Field Prevention Guidelines */}
      <div className="mt-6 rounded-lg border border-border bg-card p-5 font-mono">
        <div className="flex items-center gap-2 mb-3 border-b border-border/80 pb-2">
          <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
            COMMUNITY SOURCE REDUCTION PROTOCOLS
          </h3>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-xs font-sans">
          {PREVENTION_TIPS.map((tip, idx) => (
            <div key={idx} className="flex items-start gap-2 p-2.5 rounded border border-border/70 bg-muted/15">
              <span className="font-mono text-teal-600 dark:text-teal-400 font-bold text-xs mt-0.5">
                0{idx + 1}.
              </span>
              <p className="text-muted-foreground text-xs leading-normal">
                {tip}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
