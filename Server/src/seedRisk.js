import mongoose from "mongoose";
import { env } from "./config/env.js";
import connectDB from "./config/db.js";
import DengueRisk from "./models/dengueRisk.js";

const districtData = [
  { locationName: "Colombo", currentCases: 6709, latitude: 6.9271, longitude: 79.8612 },
  { locationName: "Gampaha", currentCases: 5284, latitude: 7.0873, longitude: 79.9925 },
  { locationName: "Ratnapura", currentCases: 2286, latitude: 6.7056, longitude: 80.3847 },
  { locationName: "Matara", currentCases: 2205, latitude: 5.9549, longitude: 80.5469 },
  { locationName: "Galle", currentCases: 2066, latitude: 6.0535, longitude: 80.2210 },
  { locationName: "Kalutara", currentCases: 1906, latitude: 6.5854, longitude: 79.9607 },
  { locationName: "CMC", currentCases: 1712, latitude: 6.9147, longitude: 79.8732 },
  { locationName: "Kandy", currentCases: 1434, latitude: 7.2906, longitude: 80.6337 },
  { locationName: "Hambantota", currentCases: 943, latitude: 6.1246, longitude: 81.1185 },
  { locationName: "Batticaloa", currentCases: 918, latitude: 7.7102, longitude: 81.6924 },
  { locationName: "Kegalle", currentCases: 895, latitude: 7.2513, longitude: 80.3464 },
  { locationName: "Kurunegala", currentCases: 822, latitude: 7.4818, longitude: 80.3609 },
  { locationName: "Kalmunai", currentCases: 595, latitude: 7.4144, longitude: 81.8313 },
  { locationName: "Jaffna", currentCases: 553, latitude: 9.6615, longitude: 80.0255 },
  { locationName: "Puttalam", currentCases: 552, latitude: 8.0362, longitude: 79.8283 },
  { locationName: "Monaragala", currentCases: 419, latitude: 6.8741, longitude: 81.3411 },
  { locationName: "Trincomalee", currentCases: 394, latitude: 8.5874, longitude: 81.2152 },
  { locationName: "Matale", currentCases: 391, latitude: 7.4728, longitude: 80.6225 },
  { locationName: "Badulla", currentCases: 386, latitude: 6.9934, longitude: 81.0550 },
  { locationName: "NIHS", currentCases: 283, latitude: 6.5900, longitude: 79.9650 },
  { locationName: "Anuradhapura", currentCases: 244, latitude: 8.3114, longitude: 80.4037 },
  { locationName: "Polonnaruwa", currentCases: 240, latitude: 7.9403, longitude: 81.0188 },
  { locationName: "Ampara", currentCases: 215, latitude: 7.3018, longitude: 81.6747 },
  { locationName: "Nuwaraeliya", currentCases: 127, latitude: 6.9497, longitude: 80.7828 },
  { locationName: "Vavuniya", currentCases: 58, latitude: 8.7542, longitude: 80.4982 },
  { locationName: "Kilinochchi", currentCases: 41, latitude: 9.3803, longitude: 80.3770 },
  { locationName: "Mannar", currentCases: 40, latitude: 8.9810, longitude: 79.9044 },
  { locationName: "Mullaitivu", currentCases: 23, latitude: 9.2671, longitude: 80.8142 }
];

const totalCases = 31737;

function getRiskLevel(score) {
  if (score > 80) return "CRITICAL";
  if (score > 60) return "HIGH";
  if (score > 40) return "MODERATE";
  if (score > 20) return "LOW";
  return "MINIMAL";
}

async function seedRisk() {
  await connectDB();

  console.log("Clearing old risk data...");
  await DengueRisk.deleteMany({});

  console.log("Seeding exact risk data from provided source...");
  
  const riskRecords = districtData.map((data) => {
    // Calculate percentage exactly as shown in the photo
    const riskScore = parseFloat(((data.currentCases / totalCases) * 100).toFixed(2));
    const riskLevel = getRiskLevel(riskScore);
    
    return {
      locationName: data.locationName,
      district: data.locationName, // Treat unit/district as same
      latitude: data.latitude,
      longitude: data.longitude,
      currentCases: data.currentCases,
      previousCases: data.currentCases, // Mock previous cases to be same for neutral trend
      trend: "STABLE",
      riskScore: riskScore,
      riskLevel: riskLevel,
      reportDate: new Date(),
      source: "Provided Photo Data",
      lastUpdated: new Date()
    };
  });

  await DengueRisk.insertMany(riskRecords);

  console.log(`✅ Inserted ${riskRecords.length} risk records.`);
  
  await mongoose.connection.close();
}

seedRisk().catch((err) => {
  console.error("Seed risk failed:", err);
  process.exit(1);
});
