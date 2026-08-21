import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema(
  {
    workingDays: {
      type: [String],
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    },

    shiftStart: {
      type: String,
      default: "08:00",
    },

    shiftEnd: {
      type: String,
      default: "17:00",
    },

    offDays: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const performanceSchema = new mongoose.Schema(
  {
    totalInspections: {
      type: Number,
      default: 0,
    },

    resolvedCases: {
      type: Number,
      default: 0,
    },

    pendingCases: {
      type: Number,
      default: 0,
    },

    monthlyTarget: {
      type: Number,
      default: 0,
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
  { _id: false }
);

const phiSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Link to the User account
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Professional details
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    designation: {
      type: String,
      default: "Public Health Inspector",
      trim: true,
    },

    qualifications: {
      type: [String],
      default: [],
    },

    // Location details
    district: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    division: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    assignedArea: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    // Current assignments (array of report IDs)
    currentAssignments: {
      type: [String],
      default: [],
    },

    // Schedule / availability
    schedule: {
      type: scheduleSchema,
      default: () => ({}),
    },

    // Performance statistics
    performance: {
      type: performanceSchema,
      default: () => ({}),
    },

    status: {
      type: String,
      enum: ["Active", "Inactive", "On Leave", "Suspended"],
      default: "Active",
      index: true,
    },

    joinedDate: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10),
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default mongoose.model("Phi", phiSchema);
