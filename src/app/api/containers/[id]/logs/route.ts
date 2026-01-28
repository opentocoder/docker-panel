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
    const tail = parseInt(req.nextUrl.searchParams.get('tail') || '100');
    const timestamps = req.nextUrl.searchParams.get('timestamps') === 'true';

    const container = docker.getContainer(id);
    const logs = await container.logs({
      stdout: true,
      stderr: true,
      tail,
      timestamps,
    });

    // Docker logs come as a Buffer with header bytes, clean them up
    const logText = logs
      .toString('utf8')
      .split('\n')
      .map((line: string) => {
        // Remove Docker log header (8 bytes)
        if (line.length > 8) {
          return line.slice(8);
        }
        return line;
      })
      .join('\n');

    return NextResponse.json({ logs: logText });
  } catch (error: unknown) {
    const err = error as { statusCode?: number };
    if (err.statusCode === 404) {
      return NextResponse.json({ error: '容器不存在' }, { status: 404 });
    }
    return NextResponse.json({ error: '获取日志失败' }, { status: 500 });
  }
}
