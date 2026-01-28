import { NextRequest, NextResponse } from 'next/server';
import docker from '@/lib/docker';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const data = await docker.listVolumes();
    const volumes = data.Volumes || [];

    const result = volumes.map((volume) => ({
      name: volume.Name,
      driver: volume.Driver,
      mountpoint: volume.Mountpoint,
      scope: volume.Scope,
    }));

    return NextResponse.json({ volumes: result, total: volumes.length });
  } catch (error) {
    console.error('Failed to list volumes:', error);
    return NextResponse.json({ error: '获取卷列表失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json({ error: '卷名称不能为空' }, { status: 400 });
    }

    await docker.createVolume({ Name: name });

    return NextResponse.json({ success: true, message: `卷 ${name} 创建成功` });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Failed to create volume:', error);
    return NextResponse.json({ error: err.message || '创建卷失败' }, { status: 500 });
  }
}
