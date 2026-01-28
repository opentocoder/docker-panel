import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-in-production');

export async function signToken(payload: { userId: number; username: string; role: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(secret);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { userId: number; username: string; role: string };
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session) return { error: '未登录', status: 401 };
  if (session.role !== 'admin') return { error: '需要管理员权限', status: 403 };
  return { session };
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) return { error: '未登录', status: 401 };
  return { session };
}
