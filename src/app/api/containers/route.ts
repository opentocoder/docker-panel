import { NextRequest, NextResponse } from 'next/server';
import docker from '@/lib/docker';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const all = searchParams.get('all') === 'true';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const containers = await docker.listContainers({ all, limit: limit + offset });

    const result = containers.slice(offset, offset + limit).map((container) => ({
      id: container.Id,
      name: container.Names[0]?.replace(/^\//, '') || '',
      image: container.Image,
      state: container.State,
      status: container.Status,
      ports: container.Ports.map((p) => ({
        private: p.PrivatePort,
        public: p.PublicPort,
        type: p.Type,
      })),
      created: container.Created,
    }));

    return NextResponse.json({
      containers: result,
      total: containers.length,
    });
  } catch (error) {
    console.error('Failed to list containers:', error);
    return NextResponse.json({ error: '获取容器列表失败' }, { status: 500 });
  }
}
