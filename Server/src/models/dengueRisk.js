import mongoose from 'mongoose';

const dengueRiskSchema = new mongoose.Schema(
  {
    locationName: { type: String, required: true }, // e.g. "Colombo"
    province: { type: String },
    district: { type: String },
    mohArea: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    
    currentCases: { type: Number, default: 0 },
    previousCases: { type: Number, default: 0 },
    casesPer100k: { type: Number },
    
    trend: {
      type: String,
      enum: ['INCREASING', 'DECREASING', 'STABLE'],
      default: 'STABLE'
    },
    
    riskScore: { type: Number, min: 0, max: 100, default: 0 },
    riskLevel: {
      type: String,
      enum: ['MINIMAL', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL'],
      default: 'MINIMAL'
    },
    
    // Official Risk given by NDCU for MOH areas
    officialRisk: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'NONE'],
      default: 'NONE'
    },

    source: { type: String, default: 'NDCU' },
    reportDate: { type: Date },
    reportUrl: { type: String },
    
    lastUpdated: { type: Date, default: Date.now }
  },
  {
    timestamps: true
  }
);

// Create an index to quickly find risk by location name or district
dengueRiskSchema.index({ locationName: 1, district: 1 });

const DengueRisk = mongoose.model('DengueRisk', dengueRiskSchema);

export default DengueRisk;
