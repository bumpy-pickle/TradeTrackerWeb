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
      
      // Convert to JSON with header row
      const rawData = XLSX.utils.sheet_to_json(worksheet, { 
        raw: false,
        defval: ""
      });

      if (rawData.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: "No data found in Excel file" 
        });
      }

      // Map column names (case-insensitive matching)
      const trades: TradeRow[] = [];
      
      for (const row of rawData as Record<string, any>[]) {
        // Find columns by various possible names
        const person1 = findColumnValue(row, ["person 1", "person1", "name1", "employee1", "from"]);
        const person2 = findColumnValue(row, ["person 2", "person2", "name2", "employee2", "to"]);
        const date = findColumnValue(row, ["date", "trade date", "shift date"]);
        const hours = findColumnValue(row, ["hours", "hour", "time", "duration"]);

        if (person1 && person2 && date && hours) {
          // Parse hours as number
          const hoursNum = parseFloat(String(hours).replace(/[^\d.-]/g, ""));
          
          if (!isNaN(hoursNum) && hoursNum > 0) {
            trades.push({
              person1: String(person1).trim().toUpperCase(),
              person2: String(person2).trim().toUpperCase(),
              date: parseDate(date),
              hours: hoursNum,
            });
          }
        }
      }

      if (trades.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: "No valid trade data found. Please ensure your Excel file has columns: Person 1, Date, Hours, Person 2" 
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
function findColumnValue(row: Record<string, any>, possibleNames: string[]): string | null {
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
