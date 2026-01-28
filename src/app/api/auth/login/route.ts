import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { findUserByUsername } from '@/lib/db';
import { signToken } from '@/lib/auth';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
               req.headers.get('x-real-ip') ||
               'unknown';

    // Check rate limit
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `登录尝试次数过多，请 ${rateLimit.retryAfter} 秒后重试` },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
      );
    }

    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 });
    }

    const user = findUserByUsername(username) as any;
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return NextResponse.json(
        { error: '用户名或密码错误', remainingAttempts: rateLimit.remainingAttempts },
        { status: 401 }
      );
    }

    // Reset rate limit on successful login
    resetRateLimit(ip);

    const token = await signToken({ userId: user.id, username: user.username, role: user.role });

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username, role: user.role }
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: '登录失败' }, { status: 500 });
  }
}
