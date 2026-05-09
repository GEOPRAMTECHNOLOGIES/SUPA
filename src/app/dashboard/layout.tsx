'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, ShoppingBag, Users, LogOut,
  Leaf, Menu, X, Bell, TrendingUp
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const session = sessionStorage.getItem('gm_admin');
    if (session === 'authenticated') {
      setAuthed(true);
    } else if (pathname !== '/dashboard/login') {
      router.push('/dashboard/login');
    }
    setChecking(false);
  }, [pathname, router]);

  const handleLogout = () => {
    sessionStorage.removeItem('gm_admin');
    router.push('/dashboard/login');
  };

  if (checking) return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (pathname === '/dashboard/login' || !authed) return <>{children}</>;

  const navItems = [
    { href: '/dashboard', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: '/dashboard/sales', label: 'Sales', icon: <ShoppingBag className="w-4 h-4" /> },
    { href: '/dashboard/customers', label: 'Customers', icon: <Users className="w-4 h-4" /> },
    { href: '/dashboard/analytics', label: 'Analytics', icon: <TrendingUp className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-green-950 text-white flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex`}>
        <div className="p-6 border-b border-green-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-white">GreenMart</p>
              <p className="text-xs text-green-400">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                pathname === item.href
                  ? 'bg-green-600 text-white shadow-md'
                  : 'text-green-300 hover:bg-green-800 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-green-800">
          <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-green-900 rounded-xl">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-xs font-bold">KJ</div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">Kimathi Joram</p>
              <p className="text-xs text-green-400 truncate">Admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-green-400 hover:text-red-400 text-sm px-4 py-2 w-full transition-colors rounded-xl hover:bg-green-900"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 h-16 flex items-center justify-between sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-xl">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1 text-sm text-gray-500 hidden lg:flex">
            <Link href="/" className="hover:text-green-600 transition-colors">GreenMart</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-xl relative">
              <Bell className="w-5 h-5 text-gray-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-500 rounded-full" />
            </button>
            <Link href="/" target="_blank" className="text-xs text-green-600 hover:text-green-800 font-medium px-3 py-1.5 bg-green-50 rounded-lg transition-colors">
              View Store →
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
