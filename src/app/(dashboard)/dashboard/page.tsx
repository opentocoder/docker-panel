'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Box, Image, Network, HardDrive, Server, RefreshCw } from 'lucide-react';

interface Stats {
  containers: { total: number; running: number; stopped: number };
  images: { total: number; totalSize: string };
  networks: { total: number };
  volumes: { total: number };
}

interface SystemInfo {
  dockerVersion: string;
  os: string;
  arch: string;
  cpus: number;
  memoryFormatted: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, infoRes] = await Promise.all([
        fetch('/api/system/stats'),
        fetch('/api/system/info'),
      ]);

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      if (infoRes.ok) {
        setInfo(await infoRes.json());
      }
    } catch {
      setError('无法连接到 Docker');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">仪表盘</h1>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {error && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="py-4">
            <p className="text-yellow-700 dark:text-yellow-300">{error}</p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
              请确保 Docker 正在运行并且可以访问
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/containers">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">容器</CardTitle>
              <Box className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '-' : stats ? `${stats.containers.running}/${stats.containers.total}` : '-'}
              </div>
              <p className="text-xs text-muted-foreground">运行中 / 总数</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/images">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">镜像</CardTitle>
              <Image className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '-' : stats?.images.total ?? '-'}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.images.totalSize || '本地镜像'}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/networks">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">网络</CardTitle>
              <Network className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '-' : stats?.networks.total ?? '-'}
              </div>
              <p className="text-xs text-muted-foreground">Docker 网络</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/volumes">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">卷</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '-' : stats?.volumes.total ?? '-'}
              </div>
              <p className="text-xs text-muted-foreground">存储卷</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            系统信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">加载中...</p>
          ) : info ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Docker 版本</p>
                <p className="font-medium">{info.dockerVersion}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">操作系统</p>
                <p className="font-medium">{info.os}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CPU</p>
                <p className="font-medium">{info.cpus} 核</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">内存</p>
                <p className="font-medium">{info.memoryFormatted}</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">无法获取 Docker 系统信息</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
