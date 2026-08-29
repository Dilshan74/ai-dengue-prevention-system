import axios from 'axios';
import * as cheerio from 'cheerio';
import { PDFParse } from 'pdf-parse';

import DengueRisk from '../models/dengueRisk.js';
import DengueReport from '../models/dengueReport.js';
import { calculateRisk } from './riskCalculationService.js';

// Base NDCU URL. Consider moving this to .env later
const NDCU_BASE_URL = process.env.NDCU_DAILY_REPORT_URL || 'https://www.dengue.health.gov.lk/daily-reports/';

/**
 * 1. Fetch the NDCU public page and find the latest report PDF link.
 */
export const getLatestNDCUReport = async () => {
  try {
    console.log('[NDCU] Checking latest report on:', NDCU_BASE_URL);
    // Note: Due to lack of real internet access to NDCU in this simulated environment,
    // this scraping logic is built based on typical structure. 
    // If it fails to fetch, we'll throw an error gracefully.
    
    const response = await axios.get(NDCU_BASE_URL, { timeout: 10000 });
    const $ = cheerio.load(response.data);
    
    // Find the first link that ends with .pdf
    let reportUrl = null;
    let reportDateStr = null;

    $('a').each((i, element) => {
      const href = $(element).attr('href');
      if (href && href.toLowerCase().endsWith('.pdf')) {
        reportUrl = href;
        // Try to extract a date from the text or href if possible
        // For simplicity, we just use current date if we can't parse it
        reportDateStr = $(element).text().trim();
        return false; // break loop
      }
    });

    if (!reportUrl) {
      throw new Error('No PDF report link found on the NDCU page.');
    }

    // Ensure URL is absolute
    if (!reportUrl.startsWith('http')) {
      // Very basic relative URL resolution
      if (reportUrl.startsWith('/')) {
        const urlObj = new URL(NDCU_BASE_URL);
        reportUrl = `${urlObj.protocol}//${urlObj.host}${reportUrl}`;
      } else {
        reportUrl = `${NDCU_BASE_URL}${reportUrl}`;
      }
    }

    // Fallback date
    let reportDate = new Date();
    
    return {
      reportUrl,
      reportDate
    };
  } catch (error) {
    console.error('[NDCU] Failed to fetch latest report info:', error.message);
    throw error;
  }
};

/**
 * 2. Download and extract text from the PDF.
 */
export const downloadAndParseReport = async (reportUrl) => {
  try {
    console.log('[NDCU] Downloading report from:', reportUrl);
    const response = await axios.get(reportUrl, {
      responseType: 'arraybuffer',
      timeout: 15000
    });
    
    console.log('[NDCU] Parsing report...');
    const parser = new PDFParse({ data: Buffer.from(response.data) });
    const data = await parser.getText();
    await parser.destroy();
    return data.text;
  } catch (error) {
    console.error('[NDCU] PDF download or parsing failed:', error.message);
    throw error;
  }
};

/**
 * 3. Extract district case numbers from the raw text.
 * Based on the typical table structure: District/Unit | No of Cases | %
 */
export const parseDengueReport = (text) => {
  const extractedData = [];
  
  // List of known districts in Sri Lanka to look for in the text
  const districts = [
    'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwaraeliya', 
    'Galle', 'Hambantota', 'Matara', 'Jaffna', 'Kilinochchi', 'Mannar', 
    'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee', 
    'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla', 
    'Monaragala', 'Ratnapura', 'Kegalle', 'Kalmunai', 'CMC'
  ];

  const districtCoordinates = {
    'Colombo': { lat: 6.9271, lng: 79.8612 },
    'Gampaha': { lat: 7.0873, lng: 79.9925 },
    'Kalutara': { lat: 6.5854, lng: 79.9607 },
    'Kandy': { lat: 7.2906, lng: 80.6337 },
    'Galle': { lat: 6.0535, lng: 80.2210 },
    'Matara': { lat: 5.9549, lng: 80.5469 },
    'Ratnapura': { lat: 6.7056, lng: 80.3847 },
    'Kegalle': { lat: 7.2513, lng: 80.3464 },
    'Kurunegala': { lat: 7.4818, lng: 80.3609 },
    'Puttalam': { lat: 8.0362, lng: 79.8283 },
    'Anuradhapura': { lat: 8.3114, lng: 80.4037 },
    'Badulla': { lat: 6.9934, lng: 81.0550 },
    // Add default center for others just so they don't break
  };

  // A very basic text parsing logic. 
  // Real world PDF text extraction often scrambles tables. 
  // We'll use Regex to try to find "DistrictName Number"
  
  // Normalize text somewhat
  const normalizedText = text.replace(/,/g, ''); 

  districts.forEach(district => {
    // Regex looking for the district name followed by some whitespace and then digits
    // e.g. "Colombo 18794"
    const regex = new RegExp(`\\b${district}\\b\\s+(\\d+)`, 'i');
    const match = normalizedText.match(regex);
    
    if (match && match[1]) {
      const cases = parseInt(match[1], 10);
      if (!isNaN(cases) && cases >= 0) {
        extractedData.push({
          district: district,
          cases: cases,
          // Add default coordinates for major districts to render on map
          lat: districtCoordinates[district]?.lat || 7.8731, // Default SL center
          lng: districtCoordinates[district]?.lng || 80.7718
        });
      }
    }
  });

  return extractedData;
};

/**
 * Main coordinator function to update the database.
 */
export const updateNDCUDengueData = async () => {
  try {
    console.log('[NDCU] Starting NDCU Dengue Data Update...');
    
    // 1. Get latest report URL
    const { reportUrl, reportDate } = await getLatestNDCUReport();
    
    // 2. Check if already processed
    const existingReport = await DengueReport.findOne({ reportUrl });
    if (existingReport && existingReport.status === 'SUCCESS') {
      console.log('[NDCU] Report already processed. Skipping.', reportUrl);
      return { success: true, newReport: false, message: 'Report already processed.' };
    }

    // Create or update tracking entry
    const reportLog = await DengueReport.findOneAndUpdate(
      { reportUrl },
      { reportUrl, reportDate, status: 'FAILED', errorMessage: '' },
      { upsert: true, new: true }
    );

    // 3. Download & Parse PDF
    const text = await downloadAndParseReport(reportUrl);
    
    // 4. Extract cases
    const casesByDistrict = parseDengueReport(text);
    console.log(`[NDCU] Districts extracted: ${casesByDistrict.length}`);

    if (casesByDistrict.length === 0) {
      reportLog.errorMessage = 'No valid district data extracted from PDF';
      await reportLog.save();
      throw new Error('No valid district data extracted');
    }

    // 5. Update MongoDB
    for (const data of casesByDistrict) {
      const district = data.district;
      const currentCases = data.cases;
      
      // Find existing record to compare previous cases
      let existingRisk = await DengueRisk.findOne({ locationName: district });
      
      let previousCases = 0;
      if (existingRisk) {
        previousCases = existingRisk.currentCases || 0;
      }
      
      // Calculate risk score
      const { riskScore, riskLevel, trend } = calculateRisk(currentCases, previousCases);
      
      // Upsert
      await DengueRisk.findOneAndUpdate(
        { locationName: district },
        {
          locationName: district,
          district: district,
          latitude: data.lat,
          longitude: data.lng,
          currentCases: currentCases,
          previousCases: previousCases,
          trend: trend,
          riskScore: riskScore,
          riskLevel: riskLevel,
          reportDate: reportDate,
          reportUrl: reportUrl,
          source: 'NDCU',
          lastUpdated: Date.now()
        },
        { upsert: true, new: true }
      );
    }

    console.log('[NDCU] Update completed successfully');
    
    // Mark report log as success
    reportLog.status = 'SUCCESS';
    await reportLog.save();

    return { success: true, newReport: true, message: 'NDCU data updated successfully' };

  } catch (error) {
    console.error('[NDCU] Update process failed:', error.message);
    return { success: false, newReport: false, message: error.message };
  }
};
