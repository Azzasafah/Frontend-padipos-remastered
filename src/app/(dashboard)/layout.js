'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import Sidebar from '../components/Sidebar';
import { Toaster, toast } from 'react-hot-toast';

export default function DashboardLayout({ children }) {
    const { token, user } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Sync theme with localStorage
        const savedTheme = localStorage.getItem('pos_theme') || 'light';
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        if (!token) {
            router.push('/login');
            return;
        }

        // Role-based protection: cashier cannot access /admin or /expense routes
        if (user?.role === 'cashier') {
            const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/expense');
            if (isAdminRoute) {
                toast.error('Akses Terbatas: Halaman ini khusus untuk akun Administrator');
                router.replace('/cashier');
            }
        }
    }, [mounted, token, user, pathname, router]);

    if (!mounted || !token) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
                <div className="text-center">
                    <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Memuat sistem...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
            {/* Sidebar */}
            <Sidebar
                isCollapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            {/* Main Content Area */}
            <div
                className={`flex-1 min-w-0 transition-all duration-300 ${
                    sidebarCollapsed ? 'ml-20' : 'ml-64'
                }`}
            >
                <main className="p-6 md:p-8">
                    {children}
                </main>
            </div>

            <Toaster position="top-right" />
        </div>
    );
}
