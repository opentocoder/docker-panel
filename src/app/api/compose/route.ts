import { NextResponse } from 'next/server';
import docker from '@/lib/docker';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    // Get all containers and group by compose project
    const containers = await docker.listContainers({ all: true });

    const projects = new Map<string, {
      name: string;
      containers: Array<{ id: string; name: string; state: string; service: string }>;
      status: string;
    }>();

    for (const container of containers) {
      const projectName = container.Labels?.['com.docker.compose.project'];
      if (!projectName) continue;

      const serviceName = container.Labels?.['com.docker.compose.service'] || '';

      if (!projects.has(projectName)) {
        projects.set(projectName, {
          name: projectName,
          containers: [],
          status: 'stopped',
        });
      }

      const project = projects.get(projectName)!;
      project.containers.push({
        id: container.Id,
        name: container.Names[0]?.replace(/^\//, '') || '',
        state: container.State,
        service: serviceName,
      });

      if (container.State === 'running') {
        project.status = 'running';
      }
    }

    const result = Array.from(projects.values()).map((p) => ({
      name: p.name,
      status: p.status,
      services: p.containers.length,
      containers: p.containers,
    }));

    return NextResponse.json({ projects: result, total: result.length });
  } catch (error) {
    console.error('Failed to list compose projects:', error);
    return NextResponse.json({ error: '获取 Compose 项目失败' }, { status: 500 });
  }
}
