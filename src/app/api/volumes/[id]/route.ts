import { NextRequest, NextResponse } from 'next/server';
import docker from '@/lib/docker';
import { requireAdmin } from '@/lib/auth';

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
    const volume = docker.getVolume(id);
    await volume.remove();

    return NextResponse.json({ success: true, message: '卷已删除' });
  } catch (error: unknown) {
    const err = error as { statusCode?: number };
    if (err.statusCode === 404) {
      return NextResponse.json({ error: '卷不存在' }, { status: 404 });
    }
    if (err.statusCode === 409) {
      return NextResponse.json({ error: '卷正在使用中' }, { status: 409 });
    }
    return NextResponse.json({ error: '删除卷失败' }, { status: 500 });
  }
}
