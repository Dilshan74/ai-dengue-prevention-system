import mongoose from "mongoose";

const historySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },

    date: {
      type: Date,
      default: Date.now,
    },

    comments: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const commentSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      default: null,
    },

    userName: {
      type: String,
      default: "",
    },

    comment: {
      type: String,
      default: "",
    },

    date: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const reportSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    citizenId: {
      type: String,
      required: true,
      index: true,
    },

    citizenName: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      default: "",
    },

    lat: {
      type: Number,
      default: null,
    },

    lng: {
      type: Number,
      default: null,
    },

    image: {
      type: String,
      default: "",
    },

    images: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Under Review",
        "Accepted",
        "Rejected",
        "Inspection Completed",
        "Resolved",
      ],
      default: "Pending",
      index: true,
    },

    risk: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
      index: true,
    },

    riskScore: {
      type: Number,
      default: 50,
      index: true,
    },

    priority: {
      type: String,
      default: "Moderate",
    },

    category: {
      type: String,
      default: "container",
    },

    predictions: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
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

    date: {
      type: Date,
      default: Date.now,
      index: true,
    },

    updated: {
      type: Date,
      default: Date.now,
    },

    comments: {
      type: [commentSchema],
      default: [],
    },

    history: {
      type: [historySchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default mongoose.model("Report", reportSchema);