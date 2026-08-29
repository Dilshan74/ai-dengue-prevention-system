import { useState, useEffect } from "react";
import { toast } from "sonner";
import Button from "../../../components/common/Button";
import PageHeader from "../../../components/common/PageHeader";
import { Label, Switch } from "../../../components/common/Field";
import useTheme from "../../../hooks/useTheme";
import citizenService from "../../../services/citizenService";

const GROUPS = [
  {
    title: "Notifications",
    items: ["Push notifications", "Email alerts", "SMS updates", "Weekly digest"],
  },
  {
    title: "Privacy",
    items: ["Share location with PHIs", "Show my reports publicly", "Allow analytics"],
  },
  { title: "Display", items: ["Dark mode", "Reduce motion", "High contrast"] },
];

export default function Settings() {
  const { isDark, toggleTheme } = useTheme();
  const [toggles, setToggles] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    citizenService
      .profile()
      .then((data) => {
        const userSettings = data.settings || {};
        setToggles(userSettings);
        applyDisplaySettings(userSettings);
      })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const applyDisplaySettings = (settings) => {
    document.documentElement.classList.toggle("reduce-motion", !!settings["Reduce motion"]);
    document.documentElement.classList.toggle("high-contrast", !!settings["High contrast"]);
  };

  const isChecked = (item) => (item === "Dark mode" ? isDark : !!toggles[item]);

  const setToggle = (item) => (checked) => {
    if (item === "Dark mode") {
      toggleTheme();
      return;
    }
    const newToggles = { ...toggles, [item]: checked };
    setToggles(newToggles);
    applyDisplaySettings(newToggles);
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      await citizenService.updateSettings(toggles);
      toast.success("Preferences saved successfully!");
    } catch (err) {
      toast.error("Failed to save preferences.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Settings" description="Manage your account preferences" />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {GROUPS.map((group) => (
          <div key={group.title} className="soft-shadow rounded-2xl border border-border bg-card p-6">
            <h3 className="mb-4 font-semibold">{group.title}</h3>
            <div className="space-y-4">
              {group.items.map((item) => (
                <div key={item} className="flex items-center justify-between gap-3">
                  <Label className="font-normal text-muted-foreground">{item}</Label>
                  <Switch label={item} checked={isChecked(item)} onChange={setToggle(item)} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-end">
        <Button onClick={savePreferences} disabled={saving}>
          {saving ? "Saving..." : "Save preferences"}
        </Button>
      </div>
    </>
  );
}
