import { randomUUID } from "crypto";

// This application uses client-side state management for trade data
// The storage interface is kept minimal as data is uploaded via Excel files
// and processed in-memory on each upload

export interface IStorage {
  // Placeholder for future persistence needs
}

export class MemStorage implements IStorage {
  constructor() {}
}

export const storage = new MemStorage();
