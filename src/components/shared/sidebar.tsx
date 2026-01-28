'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Box,
  Image,
  Network,
  HardDrive,
  Layers,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: '仪表盘', icon: LayoutDashboard },
  { href: '/containers', label: '容器', icon: Box },
  { href: '/images', label: '镜像', icon: Image },
  { href: '/networks', label: '网络', icon: Network },
  { href: '/volumes', label: '卷', icon: HardDrive },
  { href: '/compose', label: 'Compose', icon: Layers },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/40">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Box className="h-6 w-6" />
          <span>Docker Panel</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
