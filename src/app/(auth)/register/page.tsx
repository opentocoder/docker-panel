'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '注册失败');
        return;
      }

      router.push('/login');
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Docker Panel</CardTitle>
          <CardDescription>创建新账号</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码 (至少8位)"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入密码"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '注册中...' : '注册'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-600">
            已有账号？ <Link href="/login" className="text-blue-600 hover:underline">登录</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
