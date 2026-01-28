import { NextResponse } from 'next/server';
import docker from '@/lib/docker';
import { requireAdmin } from '@/lib/auth';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export async function POST() {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const result = await docker.pruneImages();

    return NextResponse.json({
      success: true,
      message: '清理完成',
      deleted: result.ImagesDeleted?.length || 0,
      spaceReclaimed: formatBytes(result.SpaceReclaimed || 0),
    });
  } catch (error) {
    console.error('Failed to prune images:', error);
    return NextResponse.json({ error: '清理镜像失败' }, { status: 500 });
  }
}
