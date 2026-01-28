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
    const force = req.nextUrl.searchParams.get('force') === 'true';
    const image = docker.getImage(id);
    await image.remove({ force });

    return NextResponse.json({ success: true, message: '镜像已删除' });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    if (err.statusCode === 404) {
      return NextResponse.json({ error: '镜像不存在' }, { status: 404 });
    }
    if (err.statusCode === 409) {
      return NextResponse.json({ error: '镜像正在使用中，无法删除' }, { status: 409 });
    }
    return NextResponse.json({ error: '删除镜像失败' }, { status: 500 });
  }
}
