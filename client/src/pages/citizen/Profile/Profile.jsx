import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Pencil } from "lucide-react";
import Avatar from "../../../components/common/Avatar";
import Button from "../../../components/common/Button";
import PageHeader from "../../../components/common/PageHeader";
import useAuth from "../../../hooks/useAuth";
import citizenService from "../../../services/citizenService";

export default function Profile() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalReports: 0, pending: 0, resolved: 0 });
  const [profileData, setProfileData] = useState(null);

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
    { label: "Resolved", value: stats.resolved, className: "text-success" },
    { label: "Pending", value: stats.pending, className: "text-warning" },
  ];

  const displayName = profileData?.name || user?.name;
  const displayEmail = profileData?.email || user?.email;

  return (
    <>
      <PageHeader
        title="My Profile"
        description="Your personal information and reporting history"
        action={
          <Button as={Link} to="/citizen/profile/edit">
            <Pencil className="h-4 w-4" /> Edit profile
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="soft-shadow rounded-2xl border border-border bg-card p-6 text-center">
          <Avatar name={displayName} className="mx-auto h-24 w-24 border-4" textClassName="text-2xl" />
          <h3 className="mt-4 text-lg font-semibold">{displayName}</h3>
          <p className="text-sm text-muted-foreground">{displayEmail}</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <div className={`text-lg font-bold ${stat.className}`}>{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="soft-shadow rounded-2xl border border-border bg-card p-6">
          <h3 className="mb-4 font-semibold">Personal details</h3>
          <dl className="grid gap-4 sm:grid-cols-2">
            {[
              ["Full Name", displayName],
              ["Email", displayEmail],
              ["Mobile", profileData?.mobile || "Not Provided"],
              ["NIC", profileData?.nic || "Not Provided"],
              ["Address", profileData?.address || profileData?.area || "Not Provided"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-muted/30 p-3">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-0.5 text-sm font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </>
  );
}
