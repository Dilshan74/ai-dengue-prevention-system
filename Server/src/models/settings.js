import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "main",
    },

    siteName: {
      type: String,
      default: "DengueGuard AI",
    },

    supportEmail: {
      type: String,
      default: "support@dengueguard.lk",
    },

    notifyOnNewReport: {
      type: Boolean,
      default: true,
    },

    notifyOnHighRisk: {
      type: Boolean,
      default: true,
    },

    autoAssignPhi: {
      type: Boolean,
      default: true,
    },

    maintenanceMode: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default mongoose.model("Setting", settingSchema);