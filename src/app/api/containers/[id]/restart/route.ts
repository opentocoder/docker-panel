import { NextRequest, NextResponse } from 'next/server';
import docker from '@/lib/docker';
import { requireAdmin } from '@/lib/auth';

export async function POST(
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
    await container.restart();

    return NextResponse.json({ success: true, message: '容器已重启' });
  } catch (error: unknown) {
    const err = error as { statusCode?: number };
    if (err.statusCode === 404) {
      return NextResponse.json({ error: '容器不存在' }, { status: 404 });
    }
    return NextResponse.json({ error: '重启容器失败' }, { status: 500 });
  }
}
