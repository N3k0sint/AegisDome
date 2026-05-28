import Database from 'better-sqlite3';
import path from 'path';

// Initialize Database in the project root (or /tmp/ if on Vercel Serverless)
const isVercel = process.env.VERCEL === '1';
const dbPath = isVercel ? '/tmp/aegisdome_cache.db' : path.join(process.cwd(), 'aegisdome_cache.db');
const db = new Database(dbPath);

// Initialize table
db.exec(`
  CREATE TABLE IF NOT EXISTS scans (
    id TEXT PRIMARY KEY,
    data TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export function getCachedResult(id: string) {
  try {
    const row = db.prepare('SELECT data, timestamp FROM scans WHERE id = ?').get(id) as { data: string, timestamp: string } | undefined;
    if (!row) return null;

    // Check if within 24 hours (CURRENT_TIMESTAMP is UTC in SQLite)
    const scanTime = new Date(row.timestamp + 'Z').getTime(); 
    const now = Date.now();
    const isFresh = now - scanTime < 24 * 60 * 60 * 1000;

    if (isFresh) {
      return JSON.parse(row.data);
    }
    return null;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

export function setCachedResult(id: string, data: any) {
  try {
    const stringifiedData = JSON.stringify(data);
    db.prepare('INSERT OR REPLACE INTO scans (id, data, timestamp) VALUES (?, ?, CURRENT_TIMESTAMP)').run(id, stringifiedData);
  } catch (error) {
    console.error('Cache write error:', error);
  }
}
