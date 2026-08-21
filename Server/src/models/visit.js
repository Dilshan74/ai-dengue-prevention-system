import mongoose from "mongoose";

const checklistSchema = new mongoose.Schema(
  {
    waterPresent: {
      type: Boolean,
      default: false,
    },

    larvaeFound: {
      type: Boolean,
      default: false,
    },

    areaCleaned: {
      type: Boolean,
      default: false,
    },

    chemicalApplied: {
      type: Boolean,
      default: false,
    },

    publicEducated: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const visitSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    reportId: {
      type: String,
      required: true,
      index: true,
    },

    phiId: {
      type: String,
      required: true,
      index: true,
    },

    location: {
      type: String,
      required: true,
    },

    scheduledDate: {
      type: Date,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "Scheduled",
        "In Progress",
        "Completed",
        "Cancelled",
      ],
      default: "Scheduled",
      index: true,
    },

    checklist: {
      type: checklistSchema,
      default: () => ({}),
    },

    photos: {
      type: [String],
      default: [],
    },

    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default mongoose.model("Visit", visitSchema);