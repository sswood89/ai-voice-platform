/**
 * Widget Security Utilities
 * Origin validation, rate limiting, session management
 */

/**
 * Validate that the origin is allowed for this embed
 */
export function validateOrigin(origin: string, allowedOrigins: string[]): boolean {
  // If no origins specified, allow all (for testing)
  if (allowedOrigins.length === 0) return true;

  // Normalize origin
  const normalizedOrigin = origin.toLowerCase().replace(/\/$/, '');

  for (const allowed of allowedOrigins) {
    const normalizedAllowed = allowed.toLowerCase().replace(/\/$/, '');

    // Exact match
    if (normalizedOrigin === normalizedAllowed) return true;

    // Wildcard subdomain match (e.g., *.example.com)
    if (normalizedAllowed.startsWith('*.')) {
      const baseDomain = normalizedAllowed.slice(2);
      const originHost = new URL(normalizedOrigin).host;
      if (originHost === baseDomain || originHost.endsWith('.' + baseDomain)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Generate a session ID for widget visitors
 */
export function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `ws_${timestamp}_${random}`;
}

/**
 * Simple in-memory rate limiter for widget requests
 * In production, use Redis or similar
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  // Clean up old entries periodically
  if (Math.random() < 0.01) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetAt < now) rateLimitStore.delete(k);
    }
  }

  if (!record || record.resetAt < now) {
    // New window
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count++;
  return { allowed: true, remaining: limit - record.count, resetAt: record.resetAt };
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .trim()
    .slice(0, 2000); // Max message length
}
