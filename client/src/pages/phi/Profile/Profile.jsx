import { useState, useEffect } from "react";
import {
  UserCheck,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Building2,
  CheckCircle2,
  ArrowRightLeft,
  Save,
  Loader2,
  BadgeCheck,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import Avatar from "../../../components/common/Avatar";
import Button from "../../../components/common/Button";
import PageHeader from "../../../components/common/PageHeader";
import useAuth from "../../../hooks/useAuth";
import phiService from "../../../services/phiService";
import authService from "../../../services/authService";

export default function Profile() {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [switching, setSwitching] = useState(false);

  const [values, setValues] = useState({
    name: user?.name || "I. Perera",
    email: user?.email || "phi@dengueguard.lk",
    mobile: "",
    area: "",
    employeeId: user?.id || "PHI-001",
    region: "Health Region",
  });

  const [stats, setStats] = useState({
    visits: 128,
    resolved: "100%",
    rating: "4.8",
  });

  useEffect(() => {
    let mounted = true;
    phiService
      .profile()
      .then((data) => {
        if (!mounted || !data) return;
        setValues({
          name: data.name || user?.name || "I. Perera",
          email: data.email || user?.email || "phi@dengueguard.lk",
          mobile: data.mobile || "0779876543",
          area: data.area || data.assignedArea || "Nugegoda",
          employeeId: data.employeeId || data.id || user?.id || "U-40b9d969",
          region: data.region || data.district || (data.area ? `${data.area} Division` : "Nugegoda Division"),
        });
        setStats({
          visits: data.visitsCount ?? data.inspections ?? 128,
          resolved: data.resolvedRate ?? "100%",
          rating: data.rating ? Number(data.rating).toFixed(1) : "4.8",
        });
      })
      .catch((err) => {
        console.error("Failed to load PHI profile:", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user]);

  const onChange = (field) => (event) =>
    setValues((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event) => {
    if (event?.preventDefault) event.preventDefault();
    try {
      setSaving(true);
      const updated = await phiService.updateProfile({
        name: values.name,
        mobile: values.mobile,
        area: values.area,
      });
      if (updated) {
        login({ ...user, name: updated.name || values.name });
      }
      toast.success("PHI Profile updated successfully!");
    } catch (err) {
      console.error("Failed to save profile:", err);
      toast.error(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchToCitizen = async () => {
    try {
      setSwitching(true);
      toast.info("Switching to Citizen Demo account...");
      const data = await authService.login({
        email: "citizen@dengueguard.lk",
        password: "demo1234",
        role: "citizen",
      });
      login({
        email: data.email,
        name: data.name,
        role: "citizen",
        token: data.token,
      });
      toast.success("Switched to Citizen Demo account!");
      window.location.href = "/citizen/profile";
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to switch account");
    } finally {
      setSwitching(false);
    }
  };

  const statItems = [
    { label: "Visits", value: stats.visits, className: "" },
    { label: "Resolved", value: stats.resolved, className: "text-emerald-600 dark:text-emerald-400" },
    { label: "Rating", value: `${stats.rating} ★`, className: "text-amber-500" },
  ];

  const primaryArea = values.area ? values.area.split(",")[0] : "Nugegoda";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="PHI Profile"
        description="Your inspector credentials, jurisdiction area assignment, and inspection metrics."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSwitchToCitizen}
              disabled={switching}
              className="text-xs rounded-xl"
            >
              <ArrowRightLeft className="mr-1.5 h-3.5 w-3.5" /> Switch to Citizen Account
            </Button>
            <Button
              size="sm"
              onClick={submit}
              disabled={saving || loading}
              className="text-xs rounded-xl"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="mr-1.5 h-3.5 w-3.5" /> Save Changes
                </>
              )}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr] items-start">
        {/* Left Profile Card */}
        <div className="soft-shadow rounded-3xl border border-border bg-card p-6 text-center space-y-4">
          <div className="relative inline-block">
            <Avatar
              name={values.name || "I. Perera"}
              className="mx-auto h-24 w-24 border-4 border-primary/20 shadow-md"
              textClassName="text-2xl font-bold"
            />
            <span className="absolute bottom-1 right-1 rounded-full bg-emerald-500 p-1 border-2 border-card text-white">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-foreground">Inspector {values.name || "I. Perera"}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              {values.employeeId} · {primaryArea}
            </p>
            <div className="inline-flex items-center gap-1.5 mt-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-0.5 text-[11px] font-semibold text-primary uppercase tracking-wider">
              <BadgeCheck className="h-3.5 w-3.5 text-primary" />
              <span>Public Health Inspector</span>
            </div>
          </div>

          {/* Metrics / Stats Row */}
          <div className="border-t border-border pt-4 grid grid-cols-3 gap-2 text-center">
            {statItems.map((stat) => (
              <div key={stat.label} className="rounded-xl bg-muted/30 p-2.5 border border-border/40">
                <div className={`text-base font-extrabold ${stat.className}`}>{stat.value}</div>
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Notice Badge */}
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 text-left">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Award className="h-4 w-4 text-primary shrink-0" />
              <span>MOH Colombo District Division</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
              Authorized officer under the Dengue Prevention &amp; Control Act for surveillance, mosquito breeding hazard inspections, and site notices.
            </p>
          </div>
        </div>

        {/* Right Details Grid Form */}
        <form onSubmit={submit} className="soft-shadow rounded-3xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="font-bold text-sm text-foreground">Inspector Credentials &amp; Area Assignment</h3>
              <p className="text-xs text-muted-foreground">Registered contact details and active jurisdictional assignment</p>
            </div>
            <span className="text-[11px] font-semibold text-primary uppercase tracking-wider bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
              Active Inspector
            </span>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            {/* Full Name */}
            <div className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 flex items-start gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
                <UserCheck className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <label htmlFor="phi-name" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Officer Name
                </label>
                <input
                  id="phi-name"
                  type="text"
                  value={values.name}
                  onChange={onChange("name")}
                  placeholder="Officer Full Name"
                  required
                  className="mt-1 w-full bg-background border border-border/60 rounded-lg px-2.5 py-1 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Email (Read Only Login Username) */}
            <div className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 flex items-start gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
                <Mail className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <label htmlFor="phi-email" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Email (Login ID)
                  </label>
                  <span className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Locked</span>
                </div>
                <input
                  id="phi-email"
                  type="email"
                  value={values.email}
                  disabled
                  className="mt-1 w-full bg-muted/50 border border-border/40 rounded-lg px-2.5 py-1 text-sm font-semibold text-muted-foreground cursor-not-allowed opacity-90"
                />
              </div>
            </div>

            {/* Mobile Contact */}
            <div className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 flex items-start gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
                <Phone className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <label htmlFor="phi-mobile" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Mobile Contact
                </label>
                <input
                  id="phi-mobile"
                  type="text"
                  value={values.mobile}
                  onChange={onChange("mobile")}
                  placeholder="07X XXX XXXX"
                  className="mt-1 w-full bg-background border border-border/60 rounded-lg px-2.5 py-1 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Employee ID */}
            <div className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 flex items-start gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <label htmlFor="phi-id" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Officer / Badge ID
                  </label>
                  <span className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">System</span>
                </div>
                <input
                  id="phi-id"
                  type="text"
                  value={values.employeeId}
                  disabled
                  className="mt-1 w-full bg-muted/50 border border-border/40 rounded-lg px-2.5 py-1 text-sm font-mono font-bold text-muted-foreground cursor-not-allowed opacity-90"
                />
              </div>
            </div>

            {/* Assigned Area */}
            <div className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 flex items-start gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <label htmlFor="phi-area" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Assigned Area / Ward
                </label>
                <input
                  id="phi-area"
                  type="text"
                  value={values.area}
                  onChange={onChange("area")}
                  placeholder="e.g. Nugegoda or Galle"
                  className="mt-1 w-full bg-background border border-border/60 rounded-lg px-2.5 py-1 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Region */}
            <div className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 flex items-start gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <label htmlFor="phi-region" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Administrative Region
                </label>
                <input
                  id="phi-region"
                  type="text"
                  value={values.region}
                  onChange={onChange("region")}
                  placeholder="e.g. Nugegoda Division"
                  className="mt-1 w-full bg-background border border-border/60 rounded-lg px-2.5 py-1 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Officer changes will update dispatched inspections and contact details across the MOH portal.
            </span>
            <Button
              type="submit"
              disabled={saving || loading}
              className="w-full sm:w-auto rounded-xl px-5 py-2 font-semibold shadow-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="mr-1.5 h-4 w-4" /> Save Profile Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
