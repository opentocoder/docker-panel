import { NextRequest, NextResponse } from 'next/server';
import docker from '@/lib/docker';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const networks = await docker.listNetworks();

    const result = networks.map((network) => ({
      id: network.Id,
      name: network.Name,
      driver: network.Driver,
      scope: network.Scope,
      internal: network.Internal,
      containers: Object.keys(network.Containers || {}).length,
      created: network.Created,
    }));

    return NextResponse.json({ networks: result, total: networks.length });
  } catch (error) {
    console.error('Failed to list networks:', error);
    return NextResponse.json({ error: '获取网络列表失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { name, driver = 'bridge' } = await req.json();

    if (!name) {
      return NextResponse.json({ error: '网络名称不能为空' }, { status: 400 });
    }

    await docker.createNetwork({ Name: name, Driver: driver });

    return NextResponse.json({ success: true, message: `网络 ${name} 创建成功` });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Failed to create network:', error);
    return NextResponse.json({ error: err.message || '创建网络失败' }, { status: 500 });
  }
}
