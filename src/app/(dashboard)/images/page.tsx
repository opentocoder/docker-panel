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
import { RefreshCw, Download, Trash2, Eraser } from 'lucide-react';

interface Image {
  id: string;
  repoTags: string[];
  size: number;
  sizeFormatted: string;
  created: number;
}

export default function ImagesPage() {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSize, setTotalSize] = useState('');
  const [pullDialogOpen, setPullDialogOpen] = useState(false);
  const [pullImage, setPullImage] = useState('');
  const [pulling, setPulling] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/images');
      const data = await res.json();
      if (data.images) {
        setImages(data.images);
        setTotalSize(data.totalSize);
      }
    } catch {
      toast.error('获取镜像列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handlePull = async () => {
    if (!pullImage.trim()) {
      toast.error('请输入镜像名称');
      return;
    }

    setPulling(true);
    try {
      const res = await fetch('/api/images/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: pullImage }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setPullDialogOpen(false);
        setPullImage('');
        fetchImages();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('拉取失败');
    } finally {
      setPulling(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/images/${encodeURIComponent(id)}?force=true`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        fetchImages();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('删除失败');
    } finally {
      setDeleteId(null);
    }
  };

  const handlePrune = async () => {
    if (!confirm('确定要清理所有未使用的镜像吗？')) return;

    try {
      const res = await fetch('/api/images/prune', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast.success(`清理完成，删除 ${data.deleted} 个镜像，释放 ${data.spaceReclaimed}`);
        fetchImages();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('清理失败');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">镜像管理</h1>
          <p className="text-sm text-muted-foreground">
            共 {images.length} 个镜像，总大小 {totalSize}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handlePrune} variant="outline" size="sm">
            <Eraser className="mr-2 h-4 w-4" />
            清理未使用
          </Button>
          <Dialog open={pullDialogOpen} onOpenChange={setPullDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Download className="mr-2 h-4 w-4" />
                拉取镜像
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>拉取镜像</DialogTitle>
                <DialogDescription>
                  输入要拉取的镜像名称，例如 nginx:latest 或 ubuntu:22.04
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="image">镜像名称</Label>
                  <Input
                    id="image"
                    placeholder="nginx:latest"
                    value={pullImage}
                    onChange={(e) => setPullImage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePull()}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPullDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handlePull} disabled={pulling}>
                  {pulling ? '拉取中...' : '拉取'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={fetchImages} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>仓库:标签</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>大小</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="w-[80px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  加载中...
                </TableCell>
              </TableRow>
            ) : images.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  没有镜像
                </TableCell>
              </TableRow>
            ) : (
              images.map((image) => (
                <TableRow key={image.id}>
                  <TableCell>
                    <div className="space-y-1">
                      {image.repoTags.map((tag, i) => (
                        <Badge key={i} variant="outline" className="mr-1">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {image.id.replace('sha256:', '').slice(0, 12)}
                  </TableCell>
                  <TableCell>{image.sizeFormatted}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(image.created)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => setDeleteId(image.id)}
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

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除此镜像吗？如果有容器正在使用该镜像，删除将失败。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              取消
            </Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
