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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { RefreshCw, Plus, Trash2 } from 'lucide-react';

interface Network {
  id: string;
  name: string;
  driver: string;
  scope: string;
  internal: boolean;
  containers: number;
}

export default function NetworksPage() {
  const [networks, setNetworks] = useState<Network[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDriver, setNewDriver] = useState('bridge');
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchNetworks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/networks');
      const data = await res.json();
      if (data.networks) {
        setNetworks(data.networks);
      }
    } catch {
      toast.error('获取网络列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworks();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error('请输入网络名称');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/networks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, driver: newDriver }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setCreateOpen(false);
        setNewName('');
        fetchNetworks();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('创建失败');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/networks/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        fetchNetworks();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('删除失败');
    } finally {
      setDeleteId(null);
    }
  };

  const isSystemNetwork = (name: string) => {
    return ['bridge', 'host', 'none'].includes(name);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">网络管理</h1>
        <div className="flex items-center gap-2">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                创建网络
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>创建网络</DialogTitle>
                <DialogDescription>创建一个新的 Docker 网络</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">网络名称</Label>
                  <Input
                    id="name"
                    placeholder="my-network"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driver">驱动</Label>
                  <Select value={newDriver} onValueChange={setNewDriver}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bridge">bridge</SelectItem>
                      <SelectItem value="overlay">overlay</SelectItem>
                      <SelectItem value="macvlan">macvlan</SelectItem>
                    </SelectContent>
                  </Select>
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
          <Button onClick={fetchNetworks} variant="outline" size="sm">
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
              <TableHead>范围</TableHead>
              <TableHead>容器数</TableHead>
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
            ) : networks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  没有网络
                </TableCell>
              </TableRow>
            ) : (
              networks.map((network) => (
                <TableRow key={network.id}>
                  <TableCell className="font-medium">
                    {network.name}
                    {isSystemNetwork(network.name) && (
                      <Badge variant="secondary" className="ml-2">系统</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{network.driver}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{network.scope}</TableCell>
                  <TableCell>{network.containers}</TableCell>
                  <TableCell>
                    {!isSystemNetwork(network.name) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => setDeleteId(network.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
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
            <DialogDescription>确定要删除此网络吗？</DialogDescription>
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
