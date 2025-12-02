import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import * as XLSX from "xlsx";
import { randomUUID } from "crypto";

// Configure multer for file uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.originalname.endsWith(".xlsx") ||
      file.originalname.endsWith(".xls")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel files (.xlsx, .xls) are allowed"));
    }
  },
});

interface TradeRow {
  person1: string;
  date: string;
  hours: number;
  person2: string;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Paste data endpoint - parse pasted text from Excel/spreadsheet
  app.post("/api/parse-paste", (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text || typeof text !== "string" || text.trim().length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: "No data provided. Please paste your Excel data." 
        });
      }

      // Parse the pasted text - Excel copies as tab-separated values
      const lines = text.trim().split(/\r?\n/);
      
      if (lines.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: "No data rows found in pasted text." 
        });
      }

      // Detect delimiter (tab or comma)
      const firstLine = lines[0];
      const delimiter = firstLine.includes("\t") ? "\t" : ",";
      
      // Fixed column indices (0-based):
      // Column E (index 4): Person 1
      // Column F (index 5): Trade Date
      // Column G (index 6): Trade Start Time
      // Column H (index 7): Trade End Time
      // Column K (index 10): Person 2
      const PERSON1_COL = 4;  // Column E
      const DATE_COL = 5;     // Column F
      const START_TIME_COL = 6; // Column G
      const END_TIME_COL = 7;   // Column H
      const PERSON2_COL = 10;   // Column K

      const trades: TradeRow[] = [];
      
      // Process all rows - skip header row if detected (date column contains non-date text)
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const cells = line.split(delimiter);
        
        const person1 = cells[PERSON1_COL]?.trim() || "";
        const date = cells[DATE_COL]?.trim() || "";
        const startTime = cells[START_TIME_COL]?.trim() || "";
        const endTime = cells[END_TIME_COL]?.trim() || "";
        const person2 = cells[PERSON2_COL]?.trim() || "";

        // Skip if this looks like a header row (date is text like "Trade Date" or "Date")
        if (/^[a-zA-Z\s]+$/.test(date)) {
          continue;
        }

        if (person1 && person2 && date) {
          const hoursNum = calculateHoursFromTimes(startTime, endTime);
          
          if (!isNaN(hoursNum) && hoursNum > 0) {
            trades.push({
              person1: String(person1).trim().toUpperCase(),
              person2: String(person2).trim().toUpperCase(),
              date: parseDate(date),
              hours: Math.round(hoursNum * 100) / 100,
            });
          }
        }
      }

      if (trades.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: "No valid trade data found. Please ensure you paste data with columns E (Person 1), F (Date), G (Start Time), H (End Time), and K (Person 2)" 
        });
      }

      // Add IDs to trades
      const tradesWithIds = trades.map((trade) => ({
        id: randomUUID(),
        ...trade,
      }));

      res.json({ 
        success: true, 
        trades: tradesWithIds,
        message: `Successfully loaded ${tradesWithIds.length} trades` 
      });
    } catch (error) {
      console.error("Error parsing pasted data:", error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to parse pasted data" 
      });
    }
  });

  // File upload endpoint
  app.post("/api/upload", upload.single("file"), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: "No file uploaded" 
        });
      }

      // Parse the Excel file
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      
      // Get the first sheet
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        return res.status(400).json({ 
          success: false, 
          message: "Excel file is empty" 
        });
      }

      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to array of arrays (no headers) to use fixed column positions
      // Column indices: E=4, F=5, G=6, H=7, K=10 (0-based)
      const rawData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, // Return array of arrays
        raw: true,
        defval: ""
      }) as any[][];

      if (rawData.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: "No data found in Excel file" 
        });
      }

      // Fixed column indices (0-based):
      // Column E (index 4): Person 1
      // Column F (index 5): Trade Date
      // Column G (index 6): Trade Start Time
      // Column H (index 7): Trade End Time
      // Column K (index 10): Person 2
      const PERSON1_COL = 4;  // Column E
      const DATE_COL = 5;     // Column F
      const START_TIME_COL = 6; // Column G
      const END_TIME_COL = 7;   // Column H
      const PERSON2_COL = 10;   // Column K

      const trades: TradeRow[] = [];
      
      // Process all rows - skip header row if detected (date column contains non-date text)
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.length === 0) continue;
        
        const person1 = row[PERSON1_COL];
        const date = row[DATE_COL];
        const startTime = row[START_TIME_COL];
        const endTime = row[END_TIME_COL];
        const person2 = row[PERSON2_COL];

        // Skip if this looks like a header row (date is text like "Trade Date" or "Date")
        if (typeof date === "string" && /^[a-zA-Z\s]+$/.test(date.trim())) {
          continue;
        }

        if (person1 && person2 && date) {
          const hoursNum = calculateHoursFromTimes(startTime, endTime);
          
          if (!isNaN(hoursNum) && hoursNum > 0) {
            trades.push({
              person1: String(person1).trim().toUpperCase(),
              person2: String(person2).trim().toUpperCase(),
              date: parseDate(date),
              hours: Math.round(hoursNum * 100) / 100,
            });
          }
        }
      }

      if (trades.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: "No valid trade data found. Please ensure your Excel file has data in columns E (Person 1), F (Date), G (Start Time), H (End Time), and K (Person 2)" 
        });
      }

      // Add IDs to trades
      const tradesWithIds = trades.map((trade) => ({
        id: randomUUID(),
        ...trade,
      }));

      res.json({ 
        success: true, 
        trades: tradesWithIds,
        message: `Successfully loaded ${tradesWithIds.length} trades` 
      });
    } catch (error) {
      console.error("Error processing file:", error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to process file" 
      });
    }
  });

  return httpServer;
}

// Helper function to calculate hours from start and end times
function calculateHoursFromTimes(startTime: any, endTime: any): number {
  // Handle missing or empty values
  if (startTime === null || startTime === undefined || startTime === "" ||
      endTime === null || endTime === undefined || endTime === "") {
    return 0;
  }
  
  // Excel stores times as decimal fractions of a day (0.0 to 1.0)
  // e.g., 0.5 = 12:00 PM, 0.25 = 6:00 AM
  
  let startDecimal: number;
  let endDecimal: number;
  
  // Parse start time
  if (typeof startTime === "number") {
    // Excel decimal time format - handle values > 1 (date+time)
    startDecimal = startTime % 1; // Get just the time portion
  } else if (typeof startTime === "string") {
    const parsed = parseTimeString(startTime);
    if (parsed === -1) return 0; // Invalid time string
    startDecimal = parsed;
  } else {
    return 0;
  }
  
  // Parse end time
  if (typeof endTime === "number") {
    // Excel decimal time format - handle values > 1 (date+time)
    endDecimal = endTime % 1; // Get just the time portion
  } else if (typeof endTime === "string") {
    const parsed = parseTimeString(endTime);
    if (parsed === -1) return 0; // Invalid time string
    endDecimal = parsed;
  } else {
    return 0;
  }
  
  // Calculate difference in hours (1 day = 24 hours)
  let hoursDiff = (endDecimal - startDecimal) * 24;
  
  // Handle overnight shifts (end time is before start time)
  if (hoursDiff < 0) {
    hoursDiff += 24;
  }
  
  // Cap at reasonable maximum (24 hours)
  if (hoursDiff > 24) {
    hoursDiff = 24;
  }
  
  return hoursDiff;
}

// Helper function to parse time strings like "9:00 AM", "14:30", or datetime like "11/5/2025 6:00 PM"
// Returns -1 for invalid/unparseable times
function parseTimeString(timeStr: string): number {
  if (!timeStr || String(timeStr).trim() === "") {
    return -1;
  }
  
  const str = String(timeStr).trim().toUpperCase();
  
  // Try to extract time from datetime format like "11/5/2025 6:00 PM" or "2025-01-15 14:30"
  // Match date followed by time
  const dateTimeMatch = str.match(/\d+[\/\-]\d+[\/\-]\d+\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (dateTimeMatch) {
    let hours = parseInt(dateTimeMatch[1], 10);
    const minutes = parseInt(dateTimeMatch[2], 10);
    const seconds = dateTimeMatch[3] ? parseInt(dateTimeMatch[3], 10) : 0;
    const period = dateTimeMatch[4];
    
    if (period === "PM" && hours !== 12) {
      hours += 12;
    } else if (period === "AM" && hours === 12) {
      hours = 0;
    }
    
    return (hours + minutes / 60 + seconds / 3600) / 24;
  }
  
  // Try to match just time: HH:MM:SS AM/PM or HH:MM AM/PM format
  const ampmMatch = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2], 10);
    const seconds = ampmMatch[3] ? parseInt(ampmMatch[3], 10) : 0;
    const period = ampmMatch[4];
    
    // Validate ranges
    if (hours > 23 || minutes > 59 || seconds > 59) {
      return -1;
    }
    
    if (period === "PM" && hours !== 12) {
      hours += 12;
    } else if (period === "AM" && hours === 12) {
      hours = 0;
    }
    
    return (hours + minutes / 60 + seconds / 3600) / 24;
  }
  
  // Try to parse as a number (already decimal)
  const num = parseFloat(str);
  if (!isNaN(num) && num >= 0 && num <= 1) {
    return num;
  }
  
  return -1; // Invalid time
}

// Helper function to parse various date formats
function parseDate(dateValue: any): string {
  if (!dateValue) return "";
  
  // If it's already a string in a reasonable format
  if (typeof dateValue === "string") {
    // Try to parse it
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0];
    }
    return dateValue;
  }
  
  // If it's a number (Excel serial date)
  if (typeof dateValue === "number") {
    // Excel serial date conversion
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + dateValue * 86400000);
    return date.toISOString().split("T")[0];
  }
  
  return String(dateValue);
}
