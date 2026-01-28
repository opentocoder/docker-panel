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
    const container = docker.getContainer(id);
    const info = await container.inspect();

    return NextResponse.json({
      id: info.Id,
      name: info.Name.replace(/^\//, ''),
      image: info.Config.Image,
      state: info.State,
      config: {
        env: info.Config.Env,
        cmd: info.Config.Cmd,
        workdir: info.Config.WorkingDir,
      },
      networkSettings: info.NetworkSettings,
      mounts: info.Mounts,
      created: info.Created,
    });
  } catch (error: unknown) {
    const err = error as { statusCode?: number };
    if (err.statusCode === 404) {
      return NextResponse.json({ error: '容器不存在' }, { status: 404 });
    }
    return NextResponse.json({ error: '获取容器信息失败' }, { status: 500 });
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
    const force = req.nextUrl.searchParams.get('force') === 'true';
    const container = docker.getContainer(id);
    await container.remove({ force });

    return NextResponse.json({ success: true, message: '容器已删除' });
  } catch (error: unknown) {
    const err = error as { statusCode?: number };
    if (err.statusCode === 404) {
      return NextResponse.json({ error: '容器不存在' }, { status: 404 });
    }
    return NextResponse.json({ error: '删除容器失败' }, { status: 500 });
  }
}
