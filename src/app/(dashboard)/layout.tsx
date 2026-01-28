import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import { Sidebar } from '@/components/shared/sidebar';
import { Header } from '@/components/shared/header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  const session = await verifyToken(token);
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto bg-muted/20 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
