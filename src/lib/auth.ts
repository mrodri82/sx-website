/**
 * Nova Auth — authenticates against WordPress via custom REST endpoint.
 * Uses regular WP credentials (no Application Passwords needed for login).
 * Sessions stored in-memory (server-side only).
 */

import { randomUUID } from 'node:crypto';

interface Session {
  userId: number;
  username: string;
  displayName: string;
  role: string;
  createdAt: number;
  expiresAt: number;
}

const SESSION_TTL = 8 * 60 * 60 * 1000; // 8 hours
const sessions = new Map<string, Session>();

import { site } from '@/config/site';
const WP_CMS_URL = site.cmsUrl;

/**
 * Authenticate against WordPress using regular credentials via Nova endpoint.
 */
export async function authenticateWithWP(
  username: string,
  password: string
): Promise<{ id: number; name: string; username: string; role: string } | null> {
  try {
    const url = `${WP_CMS_URL}/index.php/?rest_route=/nova/v1/auth`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Host: new URL(WP_CMS_URL).host,
      },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!data.ok) return null;

    return data.user;
  } catch {
    return null;
  }
}

/**
 * Create a new session after successful authentication.
 */
export function createSession(user: {
  id: number;
  name: string;
  username: string;
  role: string;
}): string {
  const token = randomUUID();
  const now = Date.now();

  sessions.set(token, {
    userId: user.id,
    username: user.username,
    displayName: user.name,
    role: user.role,
    createdAt: now,
    expiresAt: now + SESSION_TTL,
  });

  return token;
}

/**
 * Validate a session token and return the session if valid.
 */
export function getSession(token: string): Session | null {
  const session = sessions.get(token);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }

  return session;
}

/**
 * Destroy a session (logout).
 */
export function destroySession(token: string): void {
  sessions.delete(token);
}

/**
 * Get session token from cookie header.
 */
export function getTokenFromCookies(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/nova_session=([^;]+)/);
  return match?.[1] || null;
}

/**
 * Create Set-Cookie header value for session.
 */
export function sessionCookie(token: string): string {
  return `nova_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL / 1000}`;
}

/**
 * Create Set-Cookie header to clear session.
 */
export function clearSessionCookie(): string {
  return 'nova_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
}
