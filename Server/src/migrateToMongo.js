import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import User from "./models/user.js";
import Report from "./models/report.js";
import Prediction from "./models/prediction.js";
import Area from "./models/area.js";
import Visit from "./models/visit.js";
import Notification from "./models/notification.js";

import { 
  usersStore, 
  reportsStore, 
  predictionsStore, 
  areasStore, 
  visitsStore, 
  notificationsStore 
} from "./data/stores.js";

async function migrate() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("No MONGO_URI specified in .env");
    process.exit(1);
  }

  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(uri);
  console.log("Connected successfully to MongoDB Atlas!");

  // 1. Migrate Users
  const users = usersStore.all();
  console.log(`Migrating ${users.length} users...`);
  for (const u of users) {
    await User.findOneAndUpdate({ id: u.id }, u, { upsert: true, new: true });
  }

  // 2. Migrate Reports
  const reports = reportsStore.all();
  console.log(`Migrating ${reports.length} reports...`);
  for (const r of reports) {
    await Report.findOneAndUpdate({ id: r.id }, r, { upsert: true, new: true });
  }

  // 3. Migrate Predictions
  const predictions = predictionsStore.all();
  console.log(`Migrating ${predictions.length} predictions...`);
  for (const p of predictions) {
    await Prediction.findOneAndUpdate({ id: p.id }, p, { upsert: true, new: true });
  }

  // 4. Migrate Areas
  const areas = areasStore.all();
  console.log(`Migrating ${areas.length} areas...`);
  for (const a of areas) {
    await Area.findOneAndUpdate({ id: a.id }, a, { upsert: true, new: true });
  }

  console.log("Migration to MongoDB Atlas completed successfully!");
  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
