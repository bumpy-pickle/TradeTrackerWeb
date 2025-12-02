import { z } from "zod";

// Trade record schema - represents a single trade between two people
export const tradeSchema = z.object({
  id: z.string(),
  person1: z.string(),
  date: z.string(),
  hours: z.number(),
  person2: z.string(),
});

export type Trade = z.infer<typeof tradeSchema>;

// Summary for each person
export const personSummarySchema = z.object({
  name: z.string(),
  youWorked: z.number(), // Hours this person worked for others
  theyWorked: z.number(), // Hours others worked for this person
  total: z.number(), // Net balance (youWorked - theyWorked)
});

export type PersonSummary = z.infer<typeof personSummarySchema>;

// Chart data for the Worked Hours visualization
export const workedHoursChartDataSchema = z.object({
  name: z.string(),
  theyWorked: z.number(),
  youWorked: z.number(),
  total: z.number(),
});

export type WorkedHoursChartData = z.infer<typeof workedHoursChartDataSchema>;

// Response from the upload API
export const uploadResponseSchema = z.object({
  success: z.boolean(),
  trades: z.array(tradeSchema),
  message: z.string().optional(),
});

export type UploadResponse = z.infer<typeof uploadResponseSchema>;
