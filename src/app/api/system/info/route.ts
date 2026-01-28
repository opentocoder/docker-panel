import { NextResponse } from 'next/server';
import docker from '@/lib/docker';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const info = await docker.info();

    return NextResponse.json({
      dockerVersion: info.ServerVersion,
      apiVersion: info.ApiVersion,
      os: info.OperatingSystem,
      arch: info.Architecture,
      kernelVersion: info.KernelVersion,
      cpus: info.NCPU,
      memory: info.MemTotal,
      memoryFormatted: formatBytes(info.MemTotal),
      containers: info.Containers,
      containersRunning: info.ContainersRunning,
      containersPaused: info.ContainersPaused,
      containersStopped: info.ContainersStopped,
      images: info.Images,
    });
  } catch (error) {
    console.error('Failed to get system info:', error);
    return NextResponse.json({ error: '获取系统信息失败' }, { status: 500 });
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
