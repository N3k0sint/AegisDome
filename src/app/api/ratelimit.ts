import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const useRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

const redisClient = useRedis
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Upstash sliding window rate limiter: allows 15 requests per 1 minute per IP
const ratelimit = redisClient
  ? new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(15, "1 m"),
      analytics: true,
      prefix: "@aegisdome/ratelimit",
    })
  : null;

// Local in-memory sliding window rate limiter fallback (allows 30 requests per minute for local dev)
const localLimits = new Map<string, number[]>();

export async function isRateLimited(ip: string): Promise<boolean> {
  if (useRedis && ratelimit) {
    try {
      const { success } = await ratelimit.limit(ip);
      return !success;
    } catch (error) {
      console.error("Upstash rate limit check failed, bypassing to avoid blocking user:", error);
      return false; // Fail open to avoid blocking legitimate users on service issues
    }
  }

  // Local fallback implementation
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 30;

  if (!localLimits.has(ip)) {
    localLimits.set(ip, [now]);
    return false;
  }

  const timestamps = localLimits.get(ip) || [];
  const activeTimestamps = timestamps.filter((time) => now - time < windowMs);

  if (activeTimestamps.length >= maxRequests) {
    localLimits.set(ip, activeTimestamps);
    return true;
  }

  activeTimestamps.push(now);
  localLimits.set(ip, activeTimestamps);
  return false;
}
