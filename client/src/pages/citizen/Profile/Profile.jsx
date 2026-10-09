import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Pencil,
  UserCheck,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import Avatar from "../../../components/common/Avatar";
import Button from "../../../components/common/Button";
import PageHeader from "../../../components/common/PageHeader";
import useAuth from "../../../hooks/useAuth";
import citizenService from "../../../services/citizenService";
import { ROLE_HOME } from "../../../utils/constants";

export default function Profile() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalReports: 0, pending: 0, resolved: 0 });
  const [profileData, setProfileData] = useState(null);

  // If active session is not a citizen, immediately route to their appropriate portal
  const activeRole = (user?.role || "").toLowerCase();
  if (activeRole && activeRole !== "citizen") {
    return <Navigate to={ROLE_HOME[activeRole] || "/login"} replace />;
  }

  useEffect(() => {
    // Fetch stats
    citizenService
      .dashboard()
      .then((data) => {
        if (data?.stats) setStats(data.stats);
      })
      .catch(() => {});

    // Fetch full profile details
    citizenService
      .profile()
      .then((data) => {
        setProfileData(data);
      })
      .catch(() => {});
  }, []);

  const STATS = [
    { label: "Reports", value: stats.totalReports, className: "" },
    { label: "Resolved", value: stats.resolved, className: "text-emerald-600" },
    { label: "Pending", value: stats.pending, className: "text-amber-500" },
  ];

  const displayName = profileData?.name || user?.name || "Citizen";
  const displayEmail = profileData?.email || user?.email || "";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="My Profile"
        description="Your personal information, community reporting history, and assigned area."
        action={
          <Button as={Link} to="/citizen/profile/edit" size="sm" className="text-xs">
            <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit Profile
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr] items-start">
        {/* Left Profile Card */}
        <div className="soft-shadow rounded-3xl border border-border bg-card p-6 text-center space-y-4">
          <div className="relative inline-block">
            <Avatar
              name={displayName}
              className="mx-auto h-24 w-24 border-4 border-primary/20 shadow-md"
              textClassName="text-2xl font-bold"
            />
            <span className="absolute bottom-1 right-1 rounded-full bg-emerald-500 p-1 border-2 border-card text-white">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-foreground">{displayName}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{displayEmail}</p>
            <span className="inline-block mt-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-0.5 text-[11px] font-semibold text-primary uppercase tracking-wider">
              Citizen Member
            </span>
          </div>

          <div className="border-t border-border pt-4 grid grid-cols-3 gap-2 text-center">
            {STATS.map((stat) => (
              <div key={stat.label} className="rounded-xl bg-muted/30 p-2 border border-border/40">
                <div className={`text-base font-extrabold ${stat.className}`}>{stat.value}</div>
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <div>
            <Button
              as={Link}
              to="/citizen/profile/edit"
              variant="outline"
              className="w-full text-xs rounded-xl"
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit Personal Information
            </Button>
          </div>
        </div>

        {/* Right Details Grid */}
        <div className="soft-shadow rounded-3xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="font-bold text-sm text-foreground">Personal Information</h3>
              <p className="text-xs text-muted-foreground">Registered contact and residential details</p>
            </div>
            <Link
              to="/citizen/profile/edit"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <Pencil className="h-3 w-3" /> Edit
            </Link>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 flex items-start gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                <UserCheck className="h-4 w-4" />
              </div>
              <div>
                <dt className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Full Name
                </dt>
                <dd className="mt-0.5 text-sm font-semibold text-foreground">{displayName}</dd>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 flex items-start gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <dt className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Email Address
                </dt>
                <dd className="mt-0.5 text-sm font-semibold text-foreground truncate max-w-[200px]">
                  {displayEmail}
                </dd>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 flex items-start gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <dt className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Mobile Number
                </dt>
                <dd className="mt-0.5 text-sm font-semibold text-foreground">
                  {profileData?.mobile || "Not Provided"}
                </dd>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 flex items-start gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <dt className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  National ID (NIC)
                </dt>
                <dd className="mt-0.5 text-sm font-semibold text-foreground">
                  {profileData?.nic || "Not Provided"}
                </dd>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 flex items-start gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <dt className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  District / Area
                </dt>
                <dd className="mt-0.5 text-sm font-semibold text-foreground">
                  {profileData?.area || user?.area || "Not Provided"}
                </dd>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 flex items-start gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <dt className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Residential Address
                </dt>
                <dd className="mt-0.5 text-sm font-semibold text-foreground">
                  {profileData?.address || "Not Provided"}
                </dd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
