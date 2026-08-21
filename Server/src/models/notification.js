import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    userId: {
      type: String,
      default: null,
      index: true,
    },

    role: {
      type: String,
      enum: ["citizen", "phi", "admin"],
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "info",
        "success",
        "warning",
        "error",
      ],
      default: "info",
    },

    title: {
      type: String,
      required: true,
    },

    body: {
      type: String,
      required: true,
    },

    read: {
      type: Boolean,
      default: false,
      index: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default mongoose.model(
  "Notification",
  notificationSchema
);