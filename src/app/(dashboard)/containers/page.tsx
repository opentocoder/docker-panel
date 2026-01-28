'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  RefreshCw,
  MoreHorizontal,
  Play,
  Square,
  RotateCw,
  Trash2,
  Eye,
} from 'lucide-react';

interface Container {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
  ports: { private: number; public?: number; type: string }[];
  created: number;
}

export default function ContainersPage() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; container?: Container }>({
    open: false,
  });

  const fetchContainers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/containers?all=${showAll}`);
      const data = await res.json();
      if (data.containers) {
        setContainers(data.containers);
      }
    } catch {
      toast.error('获取容器列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContainers();
  }, [showAll]);

  const handleAction = async (id: string, action: 'start' | 'stop' | 'restart') => {
    try {
      const res = await fetch(`/api/containers/${id}/${action}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        fetchContainers();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('操作失败');
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.container) return;
    try {
      const res = await fetch(`/api/containers/${deleteDialog.container.id}?force=true`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        fetchContainers();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('删除失败');
    } finally {
      setDeleteDialog({ open: false });
    }
  };

  const filteredContainers = containers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.image.toLowerCase().includes(search.toLowerCase())
  );

  const getStateBadge = (state: string) => {
    switch (state) {
      case 'running':
        return <Badge className="bg-green-500">运行中</Badge>;
      case 'exited':
        return <Badge variant="secondary">已停止</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500">已暂停</Badge>;
      default:
        return <Badge variant="outline">{state}</Badge>;
    }
  };

  const formatPorts = (ports: Container['ports']) => {
    return ports
      .filter((p) => p.public)
      .map((p) => `${p.public}:${p.private}`)
      .join(', ') || '-';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">容器管理</h1>
        <Button onClick={fetchContainers} variant="outline" size="sm">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="搜索容器名或镜像..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button
          variant={showAll ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? '显示全部' : '仅运行中'}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>镜像</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>端口</TableHead>
              <TableHead className="w-[100px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  加载中...
                </TableCell>
              </TableRow>
            ) : filteredContainers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  没有容器
                </TableCell>
              </TableRow>
            ) : (
              filteredContainers.map((container) => (
                <TableRow key={container.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/containers/${container.id}`}
                      className="hover:underline"
                    >
                      {container.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">
                    {container.image}
                  </TableCell>
                  <TableCell>{getStateBadge(container.state)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatPorts(container.ports)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/containers/${container.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            详情
                          </Link>
                        </DropdownMenuItem>
                        {container.state !== 'running' && (
                          <DropdownMenuItem onClick={() => handleAction(container.id, 'start')}>
                            <Play className="mr-2 h-4 w-4" />
                            启动
                          </DropdownMenuItem>
                        )}
                        {container.state === 'running' && (
                          <DropdownMenuItem onClick={() => handleAction(container.id, 'stop')}>
                            <Square className="mr-2 h-4 w-4" />
                            停止
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleAction(container.id, 'restart')}>
                          <RotateCw className="mr-2 h-4 w-4" />
                          重启
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => setDeleteDialog({ open: true, container })}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除容器 "{deleteDialog.container?.name}" 吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false })}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
