import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Avatar from "../../../components/common/Avatar";
import Button from "../../../components/common/Button";
import PageHeader from "../../../components/common/PageHeader";
import { FormField, Input } from "../../../components/common/Field";
import useAuth from "../../../hooks/useAuth";
import phiService from "../../../services/phiService";

export default function Profile() {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [values, setValues] = useState({
    name: user?.name || "",
    email: user?.email || "",
    mobile: "",
    area: "",
    employeeId: user?.id || "PHI-001",
    region: "Health Region",
  });

  const [stats, setStats] = useState({
    visits: 0,
    resolved: "100%",
    rating: "5.0",
  });

  useEffect(() => {
    let mounted = true;
    phiService
      .profile()
      .then((data) => {
        if (!mounted || !data) return;
        setValues({
          name: data.name || user?.name || "",
          email: data.email || user?.email || "",
          mobile: data.mobile || "",
          area: data.area || data.assignedArea || "",
          employeeId: data.employeeId || data.id || user?.id || "PHI-001",
          region: data.region || data.district || (data.area ? `${data.area} Division` : "National MOH"),
        });
        setStats({
          visits: data.visitsCount ?? data.inspections ?? 0,
          resolved: data.resolvedRate ?? "100%",
          rating: data.rating ? Number(data.rating).toFixed(1) : "5.0",
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
    event.preventDefault();
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
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to save profile:", err);
      toast.error(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const statItems = [
    { label: "Visits", value: stats.visits, className: "" },
    { label: "Resolved", value: stats.resolved, className: "text-success" },
    { label: "Rating", value: stats.rating, className: "" },
  ];

  const primaryArea = values.area ? values.area.split(",")[0] : "Area Pending Assignment";

  return (
    <>
      <PageHeader title="PHI Profile" description="Your inspector credentials and area assignment" />
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="soft-shadow rounded-2xl border border-border bg-card p-6 text-center">
          <Avatar name={values.name || "PHI"} className="mx-auto h-24 w-24 border-4" textClassName="text-2xl" />
          <h3 className="mt-4 text-lg font-semibold">Inspector {values.name || "PHI Officer"}</h3>
          <p className="text-sm text-muted-foreground">
            {values.employeeId} · {primaryArea}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            {statItems.map((stat) => (
              <div key={stat.label}>
                <div className={`text-lg font-bold ${stat.className}`}>{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={submit} className="soft-shadow rounded-2xl border border-border bg-card p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Name" htmlFor="name">
              <Input id="name" value={values.name} onChange={onChange("name")} placeholder="Full Name" required />
            </FormField>
            <FormField label="Email (Login Username)" htmlFor="email">
              <Input
                id="email"
                type="email"
                value={values.email}
                disabled
                className="bg-muted/50 cursor-not-allowed opacity-80"
              />
            </FormField>
            <FormField label="Mobile Contact" htmlFor="mobile">
              <Input id="mobile" value={values.mobile} onChange={onChange("mobile")} placeholder="+94 7X XXX XXXX" />
            </FormField>
            <FormField label="Assigned Area" htmlFor="area">
              <Input id="area" value={values.area} onChange={onChange("area")} placeholder="e.g. Galle or Nugegoda, Ward 12" />
            </FormField>
            <FormField label="Employee ID / Officer Code" htmlFor="employeeId">
              <Input
                id="employeeId"
                value={values.employeeId}
                disabled
                className="bg-muted/50 cursor-not-allowed opacity-80 font-mono"
              />
            </FormField>
            <FormField label="Region" htmlFor="region">
              <Input id="region" value={values.region} onChange={onChange("region")} placeholder="e.g. Southern Province" />
            </FormField>
          </div>
          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={saving || loading}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
