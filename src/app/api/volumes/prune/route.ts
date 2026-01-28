import { NextResponse } from 'next/server';
import docker from '@/lib/docker';
import { requireAdmin } from '@/lib/auth';

export async function POST() {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const result = await docker.pruneVolumes();

    return NextResponse.json({
      success: true,
      message: '清理完成',
      deleted: result.VolumesDeleted?.length || 0,
    });
  } catch (error) {
    console.error('Failed to prune volumes:', error);
    return NextResponse.json({ error: '清理卷失败' }, { status: 500 });
  }
}
