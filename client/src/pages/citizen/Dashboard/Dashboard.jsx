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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    citizenService
      .dashboard()
      .then((data) => {
        if (data?.stats) setStats(data.stats);
      })
      .catch(() => {}) // silently fail — user still sees zeros
      .finally(() => setLoading(false));
  }, []);

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
              <div className="text-sm font-medium text-muted-foreground mt-1">{WEATHER.city}</div>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive border border-destructive/20 animate-pulse-glow">
              <span className="h-2 w-2 rounded-full bg-destructive animate-ping" /> HIGH RISK
            </div>
          </div>

          <div className="mt-2">
            <div className="flex items-end justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Predicted Dengue Risk</span>
              <span className="text-3xl md:text-4xl font-bold text-destructive">87%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-secondary/50 dark:bg-secondary">
              <div className="h-full w-[87%] rounded-full bg-gradient-to-r from-orange-400 to-destructive shadow-[0_0_10px_rgba(239,68,68,0.5)] transition-all duration-1000 ease-out" />
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-secondary/30 dark:bg-secondary/10 p-4 border border-border/50 transition-colors hover:bg-secondary/50">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Temp</div>
              <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                <ThermometerSun className="h-4 w-4 text-amber-500" /> {WEATHER.temp}°C
              </div>
            </div>
            <div className="rounded-xl bg-secondary/30 dark:bg-secondary/10 p-4 border border-border/50 transition-colors hover:bg-secondary/50">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Humidity</div>
              <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                <Droplets className="h-4 w-4 text-blue-500" /> {WEATHER.humidity}%
              </div>
            </div>
            <div className="rounded-xl bg-secondary/30 dark:bg-secondary/10 p-4 border border-border/50 transition-colors hover:bg-secondary/50">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Rainfall</div>
              <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                <CloudRain className="h-4 w-4 text-cyan-400" /> {WEATHER.rain}%
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
