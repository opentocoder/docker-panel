import { NextResponse } from 'next/server';
import docker from '@/lib/docker';
import { getSession } from '@/lib/auth';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const images = await docker.listImages();

    const result = images.map((image) => ({
      id: image.Id,
      repoTags: image.RepoTags || ['<none>:<none>'],
      size: image.Size,
      sizeFormatted: formatBytes(image.Size),
      created: image.Created,
    }));

    const totalSize = images.reduce((acc, img) => acc + img.Size, 0);

    return NextResponse.json({
      images: result,
      total: images.length,
      totalSize: formatBytes(totalSize),
    });
  } catch (error) {
    console.error('Failed to list images:', error);
    return NextResponse.json({ error: '获取镜像列表失败' }, { status: 500 });
  }
}
