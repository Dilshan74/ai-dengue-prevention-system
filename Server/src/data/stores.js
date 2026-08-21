import { collection, singleton } from "../utils/jsonStore.js";

export const usersStore = collection("users");
export const reportsStore = collection("reports");
export const visitsStore = collection("visits");
export const areasStore = collection("areas");
export const notificationsStore = collection("notifications");
export const predictionsStore = collection("predictions");
export const settingsStore = singleton("settings", {
  siteName: "DengueGuard AI",
  supportEmail: "support@dengueguard.lk",
  notifyOnNewReport: true,
  notifyOnHighRisk: true,
  autoAssignPhi: true,
  maintenanceMode: false,
});
