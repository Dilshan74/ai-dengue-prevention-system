import mongoose from "mongoose";

const areaSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    risk: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
      index: true,
    },

    phi: {
      type: String,
      default: "—",
    },

    phiId: {
      type: String,
      default: null,
      index: true,
    },

    reports: {
      type: Number,
      default: 0,
    },

    x: {
      type: Number,
      default: 50,
    },

    y: {
      type: Number,
      default: 50,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default mongoose.model("Area", areaSchema);