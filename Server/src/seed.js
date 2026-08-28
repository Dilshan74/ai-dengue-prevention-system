import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { env } from "./config/env.js";
import connectDB from "./config/db.js";
import User from "./models/user.js";
import Report from "./models/report.js";
import Visit from "./models/visit.js";
import Area from "./models/area.js";
import Notification from "./models/notification.js";
import Prediction from "./models/prediction.js";
import Setting from "./models/settings.js";
import { nextId } from "./utils/helpers.js";

async function hash(pw) {
  return bcrypt.hash(pw, 10);
}

async function seed() {
  await connectDB();

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Report.deleteMany({}),
    Visit.deleteMany({}),
    Area.deleteMany({}),
    Notification.deleteMany({}),
    Prediction.deleteMany({}),
    Setting.deleteMany({}),
  ]);

  const pw = await hash(env.seedPassword);

  // --- Users (one demo account per role, matching Login.jsx's email pattern) ---
  const users = await User.insertMany([
    {
      id: nextId("U"),
      name: "Citizen Demo",
      email: "citizen@dengueguard.lk",
      mobile: "0771234567",
      address: "Nugegoda, Ward 12",
      passwordHash: pw,
      role: "citizen",
      area: "Nugegoda",
      status: "Active",
      joined: "2025-11-02",
    },
    {
      id: nextId("U"),
      name: "I. Perera",
      email: "phi@dengueguard.lk",
      mobile: "0779876543",
      passwordHash: pw,
      role: "phi",
      area: "Nugegoda",
      inspections: 128,
      rating: 4.8,
      status: "Active",
    },
    {
      id: nextId("U"),
      name: "Admin User",
      email: "admin@dengueguard.lk",
      mobile: "0775551234",
      passwordHash: pw,
      role: "admin",
      status: "Active",
    },
    {
      id: nextId("U"),
      name: "Nimal Perera",
      email: "nimal@example.lk",
      mobile: "0712223333",
      address: "Nugegoda",
      passwordHash: pw,
      role: "citizen",
      area: "Nugegoda",
      status: "Active",
      joined: "2025-11-02",
    },
    {
      id: nextId("U"),
      name: "S. Fernando",
      email: "s.fernando@moh.lk",
      passwordHash: pw,
      role: "phi",
      area: "Rajagiriya",
      inspections: 96,
      rating: 4.6,
      status: "Active",
    },
  ]);

  const phi1 = users.find((u) => u.email === "phi@dengueguard.lk");
  const phi2 = users.find((u) => u.email === "s.fernando@moh.lk");
  const citizen1 = users.find((u) => u.email === "citizen@dengueguard.lk");

  // --- Areas ---
  await Area.insertMany([
    { id: "A-01", name: "Nugegoda", risk: "High", phi: phi1.name, phiId: phi1.id, reports: 82, x: 32, y: 45 },
    { id: "A-02", name: "Rajagiriya", risk: "Medium", phi: phi2.name, phiId: phi2.id, reports: 47, x: 55, y: 30 },
    { id: "A-03", name: "Maharagama", risk: "High", phi: phi1.name, phiId: phi1.id, reports: 91, x: 22, y: 68 },
    { id: "A-04", name: "Dehiwala", risk: "Low", phi: phi2.name, phiId: phi2.id, reports: 24, x: 68, y: 60 },
    { id: "A-05", name: "Kotte", risk: "Medium", phi: phi1.name, phiId: phi1.id, reports: 39, x: 78, y: 42 },
  ]);

  // --- Reports ---
  const report1 = await Report.create({
    id: "DG-1042",
    citizenId: citizen1.id,
    citizenName: citizen1.name,
    description: "Stagnant water in a discarded bucket near the drain.",
    location: "Nugegoda, Ward 12",
    address: "Nugegoda, Ward 12",
    lat: 6.8721,
    lng: 79.889,
    image: "🪣",
    images: [],
    status: "Under Review",
    risk: "High",
    phi: phi1.name,
    phiId: phi1.id,
    date: new Date("2026-07-24"),
    updated: new Date(),
    comments: [],
    history: [{ status: "Pending", date: new Date("2026-07-24"), comments: "Report submitted" }],
  });

  await Report.create({
    id: "DG-1039",
    citizenId: citizen1.id,
    citizenName: citizen1.name,
    description: "Overgrown vegetation trapping rainwater in a flower pot.",
    location: "Rajagiriya, Ward 7",
    address: "Rajagiriya, Ward 7",
    lat: 6.9091,
    lng: 79.8952,
    image: "🌱",
    images: [],
    status: "Accepted",
    risk: "Medium",
    phi: phi2.name,
    phiId: phi2.id,
    date: new Date("2026-07-22"),
    updated: new Date(),
    comments: [],
    history: [{ status: "Pending", date: new Date("2026-07-22"), comments: "Report submitted" }],
  });

  // --- Visits ---
  const visit1 = await Visit.create({
    id: nextId("V"),
    reportId: report1.id,
    phiId: phi1.id,
    location: "Nugegoda, Ward 12",
    scheduledDate: new Date("2026-08-25"),
    status: "Scheduled",
    checklist: {
      waterPresent: false,
      larvaeFound: false,
      areaCleaned: false,
      chemicalApplied: false,
      publicEducated: false,
    },
    photos: [],
    notes: "",
  });

  // --- Notifications ---
  await Notification.insertMany([
    {
      id: nextId("N"),
      userId: citizen1.id,
      role: "citizen",
      type: "info",
      title: "Inspection Scheduled",
      body: `PHI ${phi1.name} will visit ${report1.id} on Aug 25.`,
      read: false,
      createdAt: new Date(),
    },
    {
      id: nextId("N"),
      userId: phi1.id,
      role: "phi",
      type: "warning",
      title: "Overdue inspection",
      body: "DG-1031 inspection is overdue by 1 day.",
      read: false,
      createdAt: new Date(),
    },
  ]);

  // --- Settings ---
  await Setting.create({
    key: "main",
    siteName: "DengueGuard AI",
    supportEmail: "support@dengueguard.lk",
    notifyOnNewReport: true,
    notifyOnHighRisk: true,
    autoAssignPhi: true,
    maintenanceMode: false,
  });

  console.log("✅ Seed complete.");
  console.log("Demo logins (password: %s):", env.seedPassword);
  console.log("  citizen@dengueguard.lk");
  console.log("  phi@dengueguard.lk");
  console.log("  admin@dengueguard.lk");

  await mongoose.connection.close();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
