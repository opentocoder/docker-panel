// Simple in-memory rate limiter for login attempts

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const loginAttempts = new Map<string, RateLimitEntry>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export function checkRateLimit(ip: string): { allowed: boolean; remainingAttempts: number; retryAfter?: number } {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    cleanupExpired();
  }

  if (!entry || now > entry.resetTime) {
    // First attempt or window expired
    loginAttempts.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - 1 };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfter };
  }

  entry.count++;
  return { allowed: true, remainingAttempts: MAX_ATTEMPTS - entry.count };
}

export function resetRateLimit(ip: string): void {
  loginAttempts.delete(ip);
}

function cleanupExpired(): void {
  const now = Date.now();
  for (const [ip, entry] of loginAttempts.entries()) {
    if (now > entry.resetTime) {
      loginAttempts.delete(ip);
    }
  }
}
