import mongoose from 'mongoose';

const dengueReportSchema = new mongoose.Schema(
  {
    reportDate: { type: Date, required: true },
    reportUrl: { type: String, required: true },
    source: { type: String, default: 'NDCU' },
    processedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED'],
      default: 'SUCCESS'
    },
    errorMessage: { type: String }
  },
  {
    timestamps: true
  }
);

// Ensure we don't process the same report twice from the same URL/Date
dengueReportSchema.index({ reportUrl: 1 }, { unique: true });

const DengueReport = mongoose.model('DengueReport', dengueReportSchema);

export default DengueReport;
