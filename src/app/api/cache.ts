import { Redis } from '@upstash/redis';
import path from 'path';

// 1. Initialize Upstash Redis if environment variables are present
const useRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const redis = useRedis
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// 2. Initialize SQLite fallback dynamically to avoid native binary issues on Serverless builds
let db: any = null;
if (!useRedis) {
  try {
    const Database = require('better-sqlite3');
    const isVercel = process.env.VERCEL === '1';
    const dbPath = isVercel ? '/tmp/aegisdome_cache.db' : path.join(process.cwd(), 'aegisdome_cache.db');
    db = new Database(dbPath);
    db.exec(`
      CREATE TABLE IF NOT EXISTS scans (
        id TEXT PRIMARY KEY,
        data TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (error) {
    console.error('Failed to initialize SQLite fallback:', error);
  }
}

// 3. Cache Getter (works with both)
export async function getCachedResult(id: string) {
  if (useRedis && redis) {
    try {
      const cached = await redis.get(id);
      return cached ? cached : null;
    } catch (e) {
      console.error('Redis cache read error:', e);
      return null;
    }
  }

  // SQLite Fallback
  if (!db) return null;
  try {
    const row = db.prepare('SELECT data, timestamp FROM scans WHERE id = ?').get(id) as { data: string, timestamp: string } | undefined;
    if (!row) return null;

    const scanTime = new Date(row.timestamp + 'Z').getTime();
    const isFresh = Date.now() - scanTime < 24 * 60 * 60 * 1000;
    return isFresh ? JSON.parse(row.data) : null;
  } catch (error) {
    console.error('SQLite cache read error:', error);
    return null;
  }
}

// 4. Cache Setter (works with both)
export async function setCachedResult(id: string, data: any) {
  if (useRedis && redis) {
    try {
      // Redis sets expiration automatically (86400 seconds = 24 hours)
      await redis.set(id, data, { ex: 86400 });
      return;
    } catch (e) {
      console.error('Redis cache write error:', e);
    }
  }

  // SQLite Fallback
  if (!db) return;
  try {
    db.prepare('INSERT OR REPLACE INTO scans (id, data, timestamp) VALUES (?, ?, CURRENT_TIMESTAMP)').run(id, JSON.stringify(data));
  } catch (error) {
    console.error('SQLite cache write error:', error);
  }
}
