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
      
      // Convert to JSON with header row - use raw values for time calculations
      const rawData = XLSX.utils.sheet_to_json(worksheet, { 
        raw: true,
        defval: ""
      });

      if (rawData.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: "No data found in Excel file" 
        });
      }

      // Map column names (case-insensitive matching)
      // Expected columns: E = Person 1, F = Trade Date, G = Trade Start Time, H = Trade End Time, K = Person 2
      const trades: TradeRow[] = [];
      
      for (const row of rawData as Record<string, any>[]) {
        // Find columns by various possible names
        // Person 1 (Column E)
        const person1 = findColumnValue(row, ["person 1", "person1", "name1", "employee1", "from", "employee"]);
        // Person 2 (Column K)
        const person2 = findColumnValue(row, ["person 2", "person2", "name2", "employee2", "to", "partner"]);
        // Trade Date (Column F)
        const date = findColumnValue(row, ["trade date", "date", "shift date"]);
        // Trade Start Time (Column G)
        const startTime = findColumnValue(row, ["trade start time", "start time", "start", "time start"]);
        // Trade End Time (Column H)
        const endTime = findColumnValue(row, ["trade end time", "end time", "end", "time end"]);
        // Also try direct hours column as fallback
        const directHours = findColumnValue(row, ["hours", "hour", "duration"]);

        if (person1 && person2 && date) {
          let hoursNum = 0;
          
          // Calculate hours from start and end time (preferred method)
          if (startTime !== null && endTime !== null) {
            hoursNum = calculateHoursFromTimes(startTime, endTime);
          } else if (directHours !== null) {
            // Fallback to direct hours column if available
            hoursNum = parseFloat(String(directHours).replace(/[^\d.-]/g, ""));
          }
          
          if (!isNaN(hoursNum) && hoursNum > 0) {
            trades.push({
              person1: String(person1).trim().toUpperCase(),
              person2: String(person2).trim().toUpperCase(),
              date: parseDate(date),
              hours: Math.round(hoursNum * 100) / 100, // Round to 2 decimal places
            });
          }
        }
      }

      if (trades.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: "No valid trade data found. Please ensure your Excel file has columns: Person 1, Trade Date, Trade Start Time, Trade End Time, Person 2" 
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

// Helper function to find column value by various possible names
function findColumnValue(row: Record<string, any>, possibleNames: string[]): any {
  for (const key of Object.keys(row)) {
    const normalizedKey = key.toLowerCase().trim();
    for (const name of possibleNames) {
      if (normalizedKey === name || normalizedKey.includes(name)) {
        return row[key];
      }
    }
  }
  return null;
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

// Helper function to parse time strings like "9:00 AM", "14:30", etc.
// Returns -1 for invalid/unparseable times
function parseTimeString(timeStr: string): number {
  if (!timeStr || String(timeStr).trim() === "") {
    return -1;
  }
  
  const str = String(timeStr).trim().toUpperCase();
  
  // Try to match HH:MM:SS AM/PM or HH:MM AM/PM format
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
