import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Camera,
  CheckCircle2,
  CloudRain,
  Droplets,
  FileText,
  Search,
  Sparkles,
  ThermometerSun,
  Upload,
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
        
        // Fetch live weather data based on the area matched by the backend
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
          .catch(err => console.error("Failed to fetch weather", err));
      })
      .catch(() => {}) // silently fail — user still sees zeros
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="fade-in">
      <PageHeader
        title={`Welcome, ${user?.name ?? "Citizen"}`}
        description="AI-Based Dengue Prevention & Early Warning System"
      />

      {/* Top Stat Cards */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-t-4 border-t-cyan-500 delay-100 slide-up">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reports Submitted</div>
              <div className="mt-2 text-xl md:text-2xl font-bold text-foreground">
                {loading ? "—" : stats.totalReports}
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100/50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400">
              <FileText className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="border-t-4 border-t-amber-500 delay-200 slide-up">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending</div>
              <div className="mt-2 text-xl md:text-2xl font-bold text-foreground">
                {loading ? "—" : stats.pending}
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100/50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <Search className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="border-t-4 border-t-blue-500 delay-300 slide-up">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">High Risk</div>
              <div className="mt-2 text-xl md:text-2xl font-bold text-foreground">
                {loading ? "—" : stats.highRisk}
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100/50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <FileText className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="border-t-4 border-t-emerald-500 delay-400 slide-up">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Resolved</div>
              <div className="mt-2 text-xl md:text-2xl font-bold text-foreground">
                {loading ? "—" : stats.resolved}
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100/50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        {/* Report Block */}
        <div className="flex flex-col justify-center rounded-2xl border-none bg-gradient-to-br from-primary to-cyan-600 p-8 shadow-xl shadow-cyan-500/20 text-white relative overflow-hidden slide-in-right delay-200">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-cyan-900/20 blur-2xl" />

          <div className="mb-6 relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-md px-3 py-1.5 text-xs font-medium text-white shadow-sm border border-white/30">
              <Sparkles className="h-4 w-4 text-cyan-200" /> YOLOv8 Image Detection
            </span>
          </div>
          <h2 className="text-base md:text-lg font-semibold tracking-tight relative z-10">Report a Potential Breeding Site</h2>
          <p className="mt-3 text-sm text-cyan-50 leading-relaxed max-w-md relative z-10">
            Take or upload a photo of a container, tire or standing water. AI will analyse the image and estimate the breeding risk instantly.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 relative z-10">
            <Button as={Link} to="/citizen/upload" className="bg-white text-cyan-800 hover:bg-cyan-50 border-none shadow-lg text-sm font-medium">
              <Camera className="h-5 w-5" /> Take Photo
            </Button>
            <Button as={Link} to="/citizen/upload" variant="outline" className="border-white/40 text-white hover:bg-white/10 hover:border-white text-sm font-medium">
              <Upload className="h-5 w-5" /> Upload Image
            </Button>
          </div>
        </div>

        {/* Risk Status Block */}
        <Card className="slide-in-right delay-300">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h3 className="text-base md:text-lg font-semibold text-foreground">Current Area Risk</h3>
              <div className="text-sm font-medium text-muted-foreground mt-1">{areaRisk?.locationName || user?.area || "Loading..."}</div>
            </div>
            <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium border animate-pulse-glow ${
              areaRisk?.riskLevel === 'CRITICAL' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
              areaRisk?.riskLevel === 'HIGH' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
              areaRisk?.riskLevel === 'MODERATE' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
              areaRisk?.riskLevel === 'LOW' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
              'bg-slate-500/10 text-slate-500 border-slate-500/20'
            }`}>
              <span className={`h-2 w-2 rounded-full animate-ping ${
                areaRisk?.riskLevel === 'CRITICAL' ? 'bg-red-500' :
                areaRisk?.riskLevel === 'HIGH' ? 'bg-orange-500' :
                areaRisk?.riskLevel === 'MODERATE' ? 'bg-yellow-500' :
                areaRisk?.riskLevel === 'LOW' ? 'bg-green-500' :
                'bg-slate-500'
              }`} /> 
              {areaRisk?.riskLevel ? `${areaRisk.riskLevel} RISK` : "UNKNOWN"}
            </div>
          </div>

          <div className="mt-2">
            <div className="flex items-end justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Predicted Dengue Risk</span>
              <span className={`text-3xl md:text-4xl font-bold ${
                areaRisk?.riskLevel === 'CRITICAL' ? 'text-red-500' :
                areaRisk?.riskLevel === 'HIGH' ? 'text-orange-500' :
                areaRisk?.riskLevel === 'MODERATE' ? 'text-yellow-500' :
                areaRisk?.riskLevel === 'LOW' ? 'text-green-500' :
                'text-slate-500'
              }`}>{areaRisk?.riskScore ?? 0}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-secondary/50 dark:bg-secondary">
              <div 
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{ 
                  width: `${areaRisk?.riskScore ?? 0}%`,
                  background: areaRisk?.riskLevel === 'CRITICAL' ? 'linear-gradient(to right, #f97316, #ef4444)' :
                              areaRisk?.riskLevel === 'HIGH' ? 'linear-gradient(to right, #eab308, #f97316)' :
                              areaRisk?.riskLevel === 'MODERATE' ? 'linear-gradient(to right, #22c55e, #eab308)' :
                              areaRisk?.riskLevel === 'LOW' ? 'linear-gradient(to right, #94a3b8, #22c55e)' :
                              '#94a3b8',
                  boxShadow: areaRisk?.riskLevel === 'CRITICAL' ? '0 0 10px rgba(239,68,68,0.5)' :
                             areaRisk?.riskLevel === 'HIGH' ? '0 0 10px rgba(249,115,22,0.5)' :
                             areaRisk?.riskLevel === 'MODERATE' ? '0 0 10px rgba(234,179,8,0.5)' :
                             areaRisk?.riskLevel === 'LOW' ? '0 0 10px rgba(34,197,94,0.5)' :
                             'none'
                }} 
              />
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-secondary/30 dark:bg-secondary/10 p-4 border border-border/50 transition-colors hover:bg-secondary/50">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Temp</div>
              <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                <ThermometerSun className="h-4 w-4 text-amber-500" /> {weather.temp}°C
              </div>
            </div>
            <div className="rounded-xl bg-secondary/30 dark:bg-secondary/10 p-4 border border-border/50 transition-colors hover:bg-secondary/50">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Humidity</div>
              <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                <Droplets className="h-4 w-4 text-blue-500" /> {weather.humidity}%
              </div>
            </div>
            <div className="rounded-xl bg-secondary/30 dark:bg-secondary/10 p-4 border border-border/50 transition-colors hover:bg-secondary/50">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Rainfall</div>
              <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                <CloudRain className="h-4 w-4 text-cyan-400" /> {weather.rain}mm
              </div>
            </div>
          </div>

          <Button as={Link} to="/citizen/map" variant="outline" className="w-full mt-6 border-cyan-500/30 text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 text-sm font-medium">
            View Dengue Risk Map
          </Button>
        </Card>
      </div>

      {/* Prevention Tips */}
      <Card className="mt-8 slide-up delay-400" title="Prevention Tips">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PREVENTION_TIPS.map((tip, index) => (
            <li key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/30 transition-colors group">
              <div className="flex-shrink-0 mt-0.5 h-2 w-2 rounded-full bg-cyan-400 group-hover:scale-150 transition-transform duration-300" />
              <span className="text-sm font-normal text-muted-foreground group-hover:text-foreground transition-colors">{tip}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
