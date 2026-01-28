import { NextRequest, NextResponse } from 'next/server';
import docker from '@/lib/docker';
import { requireAdmin } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: '镜像名称不能为空' }, { status: 400 });
    }

    // Pull the image
    const stream = await docker.pull(image);

    // Wait for pull to complete
    await new Promise((resolve, reject) => {
      docker.modem.followProgress(stream, (err: Error | null) => {
        if (err) reject(err);
        else resolve(null);
      });
    });

    return NextResponse.json({ success: true, message: `镜像 ${image} 拉取成功` });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Failed to pull image:', error);
    return NextResponse.json(
      { error: err.message || '拉取镜像失败' },
      { status: 500 }
    );
  }
}
