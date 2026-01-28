import { NextRequest, NextResponse } from 'next/server';
import docker from '@/lib/docker';
import { requireAdmin } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { name } = await params;

    // Find all containers for this compose project
    const containers = await docker.listContainers({
      all: true,
      filters: { label: [`com.docker.compose.project=${name}`] },
    });

    if (containers.length === 0) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    // Start all containers
    for (const containerInfo of containers) {
      if (containerInfo.State !== 'running') {
        const container = docker.getContainer(containerInfo.Id);
        await container.start();
      }
    }

    return NextResponse.json({ success: true, message: `项目 ${name} 已启动` });
  } catch (error) {
    console.error('Failed to start compose project:', error);
    return NextResponse.json({ error: '启动项目失败' }, { status: 500 });
  }
}
