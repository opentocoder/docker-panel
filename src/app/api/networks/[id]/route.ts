import { NextRequest, NextResponse } from 'next/server';
import docker from '@/lib/docker';
import { requireAdmin } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const network = docker.getNetwork(id);
    const info = await network.inspect();

    return NextResponse.json({
      id: info.Id,
      name: info.Name,
      driver: info.Driver,
      scope: info.Scope,
      internal: info.Internal,
      ipam: info.IPAM,
      containers: info.Containers,
      created: info.Created,
    });
  } catch (error: unknown) {
    const err = error as { statusCode?: number };
    if (err.statusCode === 404) {
      return NextResponse.json({ error: '网络不存在' }, { status: 404 });
    }
    return NextResponse.json({ error: '获取网络信息失败' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const network = docker.getNetwork(id);
    await network.remove();

    return NextResponse.json({ success: true, message: '网络已删除' });
  } catch (error: unknown) {
    const err = error as { statusCode?: number };
    if (err.statusCode === 404) {
      return NextResponse.json({ error: '网络不存在' }, { status: 404 });
    }
    if (err.statusCode === 403) {
      return NextResponse.json({ error: '无法删除预定义网络' }, { status: 403 });
    }
    return NextResponse.json({ error: '删除网络失败' }, { status: 500 });
  }
}
