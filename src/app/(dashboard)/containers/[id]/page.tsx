'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { ArrowLeft, Play, Square, RotateCw, Trash2, RefreshCw } from 'lucide-react';

interface ContainerDetail {
  id: string;
  name: string;
  image: string;
  state: {
    Status: string;
    Running: boolean;
    Paused: boolean;
    StartedAt: string;
    FinishedAt: string;
  };
  config: {
    env: string[];
    cmd: string[];
    workdir: string;
  };
  networkSettings: {
    Ports: Record<string, Array<{ HostIp: string; HostPort: string }> | null>;
  };
  mounts: Array<{
    Type: string;
    Source: string;
    Destination: string;
    Mode: string;
  }>;
  created: string;
}

export default function ContainerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [container, setContainer] = useState<ContainerDetail | null>(null);
  const [logs, setLogs] = useState('');
  const [tailLines, setTailLines] = useState('100');
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchContainer = async () => {
    try {
      const res = await fetch(`/api/containers/${id}`);
      if (!res.ok) {
        toast.error('容器不存在');
        router.push('/containers');
        return;
      }
      const data = await res.json();
      setContainer(data);
    } catch {
      toast.error('获取容器信息失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await fetch(`/api/containers/${id}/logs?tail=${tailLines}`);
      const data = await res.json();
      setLogs(data.logs || '');
    } catch {
      toast.error('获取日志失败');
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchContainer();
  }, [id]);

  useEffect(() => {
    if (container) {
      fetchLogs();
    }
  }, [container, tailLines]);

  const handleAction = async (action: 'start' | 'stop' | 'restart') => {
    try {
      const res = await fetch(`/api/containers/${id}/${action}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        fetchContainer();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('操作失败');
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除此容器吗？')) return;
    try {
      const res = await fetch(`/api/containers/${id}?force=true`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        router.push('/containers');
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('删除失败');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">加载中...</div>;
  }

  if (!container) {
    return null;
  }

  const isRunning = container.state.Running;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{container.name}</h1>
          <p className="text-sm text-muted-foreground">{container.id.slice(0, 12)}</p>
        </div>
        <div className="flex items-center gap-2">
          {!isRunning && (
            <Button size="sm" onClick={() => handleAction('start')}>
              <Play className="mr-2 h-4 w-4" />
              启动
            </Button>
          )}
          {isRunning && (
            <Button size="sm" variant="secondary" onClick={() => handleAction('stop')}>
              <Square className="mr-2 h-4 w-4" />
              停止
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => handleAction('restart')}>
            <RotateCw className="mr-2 h-4 w-4" />
            重启
          </Button>
          <Button size="sm" variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            删除
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">状态</span>
              <Badge className={isRunning ? 'bg-green-500' : ''}>
                {container.state.Status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">镜像</span>
              <span className="text-sm">{container.image}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">创建时间</span>
              <span className="text-sm">{new Date(container.created).toLocaleString()}</span>
            </div>
            {container.config.workdir && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">工作目录</span>
                <span className="text-sm font-mono">{container.config.workdir}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>端口映射</CardTitle>
          </CardHeader>
          <CardContent>
            {container.networkSettings.Ports &&
            Object.keys(container.networkSettings.Ports).length > 0 ? (
              <div className="space-y-1">
                {Object.entries(container.networkSettings.Ports).map(([port, bindings]) => (
                  <div key={port} className="flex justify-between text-sm">
                    <span className="font-mono">{port}</span>
                    <span className="text-muted-foreground">
                      {bindings
                        ? bindings.map((b) => `${b.HostIp || '0.0.0.0'}:${b.HostPort}`).join(', ')
                        : '-'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">无端口映射</p>
            )}
          </CardContent>
        </Card>

        {container.mounts.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>挂载卷</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {container.mounts.map((mount, i) => (
                  <div key={i} className="flex gap-4 text-sm">
                    <Badge variant="outline">{mount.Type}</Badge>
                    <span className="font-mono text-muted-foreground">{mount.Source}</span>
                    <span>→</span>
                    <span className="font-mono">{mount.Destination}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>日志</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={tailLines} onValueChange={setTailLines}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">最后 50 行</SelectItem>
                  <SelectItem value="100">最后 100 行</SelectItem>
                  <SelectItem value="500">最后 500 行</SelectItem>
                  <SelectItem value="1000">最后 1000 行</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={fetchLogs}>
                <RefreshCw className={`h-4 w-4 ${logsLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] rounded-md border bg-muted/50 p-4">
              <pre className="text-xs font-mono whitespace-pre-wrap">
                {logs || '无日志'}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
