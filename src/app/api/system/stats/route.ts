import { NextResponse } from 'next/server';
import docker from '@/lib/docker';
import { getSession } from '@/lib/auth';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const [containers, images, networks, volumesData] = await Promise.all([
      docker.listContainers({ all: true }),
      docker.listImages(),
      docker.listNetworks(),
      docker.listVolumes(),
    ]);

    const runningContainers = containers.filter((c) => c.State === 'running').length;
    const totalImageSize = images.reduce((acc, img) => acc + img.Size, 0);
    const volumes = volumesData.Volumes || [];

    return NextResponse.json({
      containers: {
        total: containers.length,
        running: runningContainers,
        stopped: containers.length - runningContainers,
      },
      images: {
        total: images.length,
        totalSize: formatBytes(totalImageSize),
      },
      networks: {
        total: networks.length,
      },
      volumes: {
        total: volumes.length,
      },
    });
  } catch (error) {
    console.error('Failed to get system stats:', error);
    return NextResponse.json({ error: '获取统计信息失败' }, { status: 500 });
  }
}
