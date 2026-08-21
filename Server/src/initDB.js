import mongoose from "mongoose";
import connectDB from "./config/db.js";

import User from "./models/user.js";
import Report from "./models/report.js";
import Visit from "./models/visit.js";
import Area from "./models/area.js";
import Notification from "./models/notification.js";
import Prediction from "./models/prediction.js";
import Setting from "./models/settings.js";
import Phi from "./models/phi.js";

const createCollections = async () => {
  await connectDB();

  await User.createCollection();
  await Report.createCollection();
  await Visit.createCollection();
  await Area.createCollection();
  await Notification.createCollection();
  await Prediction.createCollection();
  await Setting.createCollection();
  await Phi.createCollection();

  console.log("Database created successfully");

  await mongoose.connection.close();
};

createCollections();
