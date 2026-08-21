import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    correct: {
      type: Boolean,
      default: null,
    },

    actualRisk: {
      type: String,
      enum: ["Low", "Medium", "High", null],
      default: null,
    },

    comment: {
      type: String,
      default: "",
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const predictionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    reportId: {
      type: String,
      default: null,
      index: true,
    },

    image: {
      type: String,
      default: "",
    },

    risk: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
      index: true,
    },

    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    label: {
      type: String,
      default: "",
    },

    prediction: {
      type: String,
      default: "",
    },

    modelVersion: {
      type: String,
      default: "1.0",
    },

    feedback: {
      type: feedbackSchema,
      default: null,
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
  "Prediction",
  predictionSchema
);