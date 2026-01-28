import { NextRequest, NextResponse } from 'next/server';
import { findUserByUsername, createUser, getUserCount } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, password, confirmPassword } = await req.json();
    const userCount = getUserCount();

    // 如果已有用户，则需要管理员权限才能创建新用户
    if (userCount > 0) {
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: '注册已关闭，请联系管理员' }, { status: 403 });
      }
      if (session.role !== 'admin') {
        return NextResponse.json({ error: '只有管理员可以创建用户' }, { status: 403 });
      }
    }

    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: '两次密码不一致' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: '密码至少8位' }, { status: 400 });
    }

    if (findUserByUsername(username)) {
      return NextResponse.json({ error: '用户名已存在' }, { status: 400 });
    }

    // 第一个用户自动成为管理员
    const role = userCount === 0 ? 'admin' : 'user';
    createUser(username, password, role);

    return NextResponse.json({
      success: true,
      message: userCount === 0 ? '管理员账户创建成功' : '用户创建成功'
    });
  } catch (error) {
    return NextResponse.json({ error: '注册失败' }, { status: 500 });
  }
}
