'use client';

import { useEffect, useState } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { RefreshCw, Plus, Trash2, Eraser } from 'lucide-react';

interface Volume {
  name: string;
  driver: string;
  mountpoint: string;
  scope: string;
}

export default function VolumesPage() {
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleteName, setDeleteName] = useState<string | null>(null);

  const fetchVolumes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/volumes');
      const data = await res.json();
      if (data.volumes) {
        setVolumes(data.volumes);
      }
    } catch {
      toast.error('获取卷列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolumes();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error('请输入卷名称');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/volumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setCreateOpen(false);
        setNewName('');
        fetchVolumes();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('创建失败');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (name: string) => {
    try {
      const res = await fetch(`/api/volumes/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        fetchVolumes();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('删除失败');
    } finally {
      setDeleteName(null);
    }
  };

  const handlePrune = async () => {
    if (!confirm('确定要清理所有未使用的卷吗？')) return;

    try {
      const res = await fetch('/api/volumes/prune', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast.success(`清理完成，删除 ${data.deleted} 个卷`);
        fetchVolumes();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('清理失败');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">卷管理</h1>
        <div className="flex items-center gap-2">
          <Button onClick={handlePrune} variant="outline" size="sm">
            <Eraser className="mr-2 h-4 w-4" />
            清理未使用
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                创建卷
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>创建卷</DialogTitle>
                <DialogDescription>创建一个新的 Docker 卷</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">卷名称</Label>
                  <Input
                    id="name"
                    placeholder="my-volume"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating ? '创建中...' : '创建'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={fetchVolumes} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>驱动</TableHead>
              <TableHead>挂载点</TableHead>
              <TableHead className="w-[80px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  加载中...
                </TableCell>
              </TableRow>
            ) : volumes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  没有卷
                </TableCell>
              </TableRow>
            ) : (
              volumes.map((volume) => (
                <TableRow key={volume.name}>
                  <TableCell className="font-medium">{volume.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{volume.driver}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground max-w-[300px] truncate">
                    {volume.mountpoint}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => setDeleteName(volume.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!deleteName} onOpenChange={() => setDeleteName(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除卷 "{deleteName}" 吗？如果有容器正在使用，删除将失败。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteName(null)}>
              取消
            </Button>
            <Button variant="destructive" onClick={() => deleteName && handleDelete(deleteName)}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
