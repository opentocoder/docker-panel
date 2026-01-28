'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { RefreshCw, Play, Square, Layers } from 'lucide-react';

interface ComposeProject {
  name: string;
  status: string;
  services: number;
  containers: Array<{
    id: string;
    name: string;
    state: string;
    service: string;
  }>;
}

export default function ComposePage() {
  const [projects, setProjects] = useState<ComposeProject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/compose');
      const data = await res.json();
      if (data.projects) {
        setProjects(data.projects);
      }
    } catch {
      toast.error('获取 Compose 项目失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleAction = async (name: string, action: 'start' | 'stop') => {
    try {
      const res = await fetch(`/api/compose/${encodeURIComponent(name)}/${action}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        fetchProjects();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('操作失败');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Compose 管理</h1>
        <Button onClick={fetchProjects} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">加载中...</div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>没有检测到 Compose 项目</p>
            <p className="text-sm mt-2">使用 docker-compose up 启动的项目会显示在这里</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">{project.name}</CardTitle>
                <Badge className={project.status === 'running' ? 'bg-green-500' : ''}>
                  {project.status === 'running' ? '运行中' : '已停止'}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  {project.services} 个服务
                </div>
                <div className="space-y-2 mb-4">
                  {project.containers.map((container) => (
                    <div
                      key={container.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="font-mono">{container.service}</span>
                      <Badge variant="outline" className="text-xs">
                        {container.state}
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  {project.status !== 'running' ? (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleAction(project.name, 'start')}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      启动
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1"
                      onClick={() => handleAction(project.name, 'stop')}
                    >
                      <Square className="mr-2 h-4 w-4" />
                      停止
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
