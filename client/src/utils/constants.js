export const APP_NAME = "DengueGuard AI";

export const ROLES = {
  CITIZEN: "citizen",
  PHI: "phi",
  ADMIN: "admin",
};

export const ROLE_HOME = {
  [ROLES.CITIZEN]: "/citizen",
  [ROLES.PHI]: "/phi",
  [ROLES.ADMIN]: "/admin",
};

export const REPORT_STATUSES = [
  "Pending",
  "Under Review",
  "Accepted",
  "Inspection Scheduled",
  "Inspection Completed",
  "Resolved",
  "Rejected",
  "Escalated",
];

export const STATUS_TINT = {
  Pending: "bg-muted text-muted-foreground",
  "Under Review": "bg-info/15 text-info",
  Accepted: "bg-success/15 text-success",
  "Inspection Scheduled": "bg-primary/15 text-primary",
  "Inspection Completed": "bg-primary/15 text-primary",
  Resolved: "bg-success/15 text-success",
  Rejected: "bg-destructive/15 text-destructive",
  Escalated: "bg-warning/15 text-warning",
  Reviewed: "bg-info/15 text-info",
};

export const RISK_TINT = {
  High: "bg-destructive/15 text-destructive",
  Medium: "bg-warning/15 text-warning",
  Low: "bg-success/15 text-success",
};

export const RISK_MARKER = {
  High: "bg-destructive text-destructive-foreground",
  Medium: "bg-warning text-warning-foreground",
  Low: "bg-success text-success-foreground",
};

export const PREVENTION_TIPS = [
  "Empty water containers, buckets, and flower pots weekly.",
  "Cover water storage tanks and wells tightly.",
  "Clean roof gutters and drains regularly.",
  "Use mosquito repellents and wear long sleeves at dusk.",
  "Report stagnant water in your neighborhood immediately.",
];

export const WEATHER = {
  city: "Colombo",
  temp: 29,
  condition: "Thunderstorms",
  humidity: 82,
  rain: 68,
};

export const CITIZEN_REPORTS = [];

export const PHI_REPORTS = [];

export const NOTIFICATIONS = [];

export const PHI_NOTIFICATIONS = [];

export const MONTHLY = [
  { name: "Jan", reports: 120, resolved: 96 },
  { name: "Feb", reports: 140, resolved: 118 },
  { name: "Mar", reports: 180, resolved: 155 },
  { name: "Apr", reports: 220, resolved: 190 },
  { name: "May", reports: 260, resolved: 224 },
  { name: "Jun", reports: 310, resolved: 268 },
  { name: "Jul", reports: 355, resolved: 302 },
];

export const RISK_DISTRIBUTION = [
  { name: "High", value: 32, color: "var(--destructive)" },
  { name: "Medium", value: 41, color: "var(--warning)" },
  { name: "Low", value: 27, color: "var(--success)" },
];

export const REPORT_STATUS_SPLIT = [
  { name: "Resolved", value: 62, color: "var(--success)" },
  { name: "In progress", value: 24, color: "var(--warning)" },
  { name: "Rejected", value: 14, color: "var(--destructive)" },
];

export const AREA_REPORTS = [
  { name: "Colombo", value: 320 },
  { name: "Gampaha", value: 240 },
  { name: "Kalutara", value: 180 },
  { name: "Kandy", value: 140 },
  { name: "Galle", value: 110 },
  { name: "Matara", value: 90 },
];

export const WEEKLY_INSPECTIONS = [
  { day: "Mon", visits: 12 },
  { day: "Tue", visits: 18 },
  { day: "Wed", visits: 15 },
  { day: "Thu", visits: 22 },
  { day: "Fri", visits: 19 },
  { day: "Sat", visits: 9 },
  { day: "Sun", visits: 4 },
];

export const AI_ACCURACY_TREND = [
  { m: "Jan", acc: 88.2 },
  { m: "Feb", acc: 89.1 },
  { m: "Mar", acc: 90.6 },
  { m: "Apr", acc: 91.3 },
  { m: "May", acc: 92.0 },
  { m: "Jun", acc: 92.8 },
  { m: "Jul", acc: 93.4 },
];

export const AI_CONFIDENCE_DISTRIBUTION = [
  { r: "0-20%", n: 3 },
  { r: "20-40%", n: 8 },
  { r: "40-60%", n: 22 },
  { r: "60-80%", n: 41 },
  { r: "80-100%", n: 126 },
];

export const USERS = [
  { id: "U-1001", name: "Nimal Perera", email: "nimal@example.lk", role: "Citizen", area: "Nugegoda", status: "Active", joined: "2025-11-02" },
  { id: "U-1002", name: "Anusha Silva", email: "anusha@example.lk", role: "Citizen", area: "Kotte", status: "Active", joined: "2026-01-14" },
  { id: "U-1003", name: "Kasun Fernando", email: "kasun@example.lk", role: "Citizen", area: "Dehiwala", status: "Inactive", joined: "2025-08-22" },
  { id: "U-1004", name: "Ishara Jayasuriya", email: "ishara@example.lk", role: "Citizen", area: "Maharagama", status: "Active", joined: "2026-03-11" },
  { id: "U-1005", name: "Ruwan Bandara", email: "ruwan@example.lk", role: "Citizen", area: "Battaramulla", status: "Active", joined: "2026-05-30" },
];

export const PHIS = [
  { id: "PHI-201", name: "I. Perera", email: "i.perera@moh.lk", area: "Nugegoda", inspections: 128, rating: 4.8, status: "Active" },
  { id: "PHI-202", name: "S. Fernando", email: "s.fernando@moh.lk", area: "Rajagiriya", inspections: 96, rating: 4.6, status: "Active" },
  { id: "PHI-203", name: "K. Silva", email: "k.silva@moh.lk", area: "Maharagama", inspections: 141, rating: 4.9, status: "Active" },
  { id: "PHI-204", name: "N. Jayasuriya", email: "n.jaya@moh.lk", area: "Dehiwala", inspections: 78, rating: 4.4, status: "On Leave" },
  { id: "PHI-205", name: "R. Wickrama", email: "r.wick@moh.lk", area: "Kotte", inspections: 63, rating: 4.2, status: "Active" },
];

export const AREAS = [
  { id: "A-01", name: "Nugegoda", risk: "High", phi: "I. Perera", reports: 82, x: 32, y: 45 },
  { id: "A-02", name: "Rajagiriya", risk: "Medium", phi: "S. Fernando", reports: 47, x: 55, y: 30 },
  { id: "A-03", name: "Maharagama", risk: "High", phi: "K. Silva", reports: 91, x: 22, y: 68 },
  { id: "A-04", name: "Dehiwala", risk: "Low", phi: "N. Jayasuriya", reports: 24, x: 68, y: 60 },
  { id: "A-05", name: "Kotte", risk: "Medium", phi: "R. Wickrama", reports: 39, x: 78, y: 42 },
  { id: "A-06", name: "Battaramulla", risk: "Low", phi: "R. Wickrama", reports: 18, x: 45, y: 75 },
  { id: "A-07", name: "Kaduwela", risk: "High", phi: "K. Silva", reports: 74, x: 88, y: 22 },
];

export const DETECTED_OBJECTS = [
  { label: "Stagnant water", conf: 96 },
  { label: "Discarded container", conf: 88 },
  { label: "Larvae indicators", conf: 71 },
  { label: "Vegetation debris", conf: 54 },
];

export const VISIT_CHECKLIST = [
  "Water Present",
  "Larvae Found",
  "Area Cleaned",
  "Chemical Applied",
  "Public Educated",
];
