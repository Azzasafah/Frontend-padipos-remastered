'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    ShoppingCart,
    Package,
    RotateCcw,
    BarChart3,
    Wallet,
    Settings,
    ChevronLeft,
    ChevronRight,
    Moon,
    Sun,
    LogOut,
    LayoutGrid,
    ShieldCheck,
    UserCheck
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Sidebar({ isCollapsed, onToggle }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('pos_theme');
        const isCurrentDark = savedTheme === 'dark' || document.documentElement.classList.contains('dark');
        setIsDark(isCurrentDark);
    }, []);

    const toggleTheme = () => {
        const nextDark = !isDark;
        setIsDark(nextDark);
        if (nextDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('pos_theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('pos_theme', 'light');
        }
    };

    // All possible menus
    const allMenuItems = [
        { name: 'Dashboard Laporan', href: '/admin', icon: BarChart3, roles: ['admin'] },
        { name: 'Kasir POS', href: '/cashier', icon: ShoppingCart, roles: ['admin', 'cashier'] },
        { name: 'Barang & Stok', href: '/admin/product', icon: Package, roles: ['admin'] },
        { name: 'Kategori Barang', href: '/admin/category', icon: LayoutGrid, roles: ['admin'] },
        { name: 'Riwayat Transaksi', href: '/transaction', icon: RotateCcw, roles: ['admin', 'cashier'] },
        { name: 'Pengeluaran', href: '/expense', icon: Wallet, roles: ['admin'] },
        { name: 'Pengaturan', href: '/setting', icon: Settings, roles: ['admin', 'cashier'] },
    ];

    // Filter by role (cashier sees only cashier relevant items)
    const currentRole = user?.role || 'cashier';
    const menuItems = allMenuItems.filter(item => item.roles.includes(currentRole));

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <aside
            className={`bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 h-screen fixed left-0 top-0 z-30 transition-all duration-300 flex flex-col justify-between ${
                isCollapsed ? 'w-20' : 'w-64'
            }`}
        >
            <div>
                {/* Header Brand with Official PadiPos Logo */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    {!isCollapsed ? (
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                                <img
                                    src="/logo.png"
                                    alt="PadiPos"
                                    className="h-8 w-auto object-contain dark:brightness-110"
                                />
                            </div>
                            <div>
                                {currentRole === 'admin' ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md uppercase tracking-wide">
                                        <ShieldCheck size={11} /> Admin Mode
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md uppercase tracking-wide">
                                        <UserCheck size={11} /> Kasir Mode
                                    </span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-extrabold text-lg mx-auto shadow-xs">
                            P
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={onToggle}
                        className="p-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        title={isCollapsed ? 'Perluas sidebar' : 'Perkecil sidebar'}
                    >
                        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                </div>

                {/* Nav Links */}
                <nav className="p-3 space-y-1 mt-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.href === '/admin'
                            ? pathname === '/admin'
                            : pathname === item.href || pathname.startsWith(item.href + '/');

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl transition-all duration-150 ${
                                    isActive
                                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white font-medium'
                                }`}
                                title={isCollapsed ? item.name : ''}
                            >
                                <Icon size={19} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'} />
                                {!isCollapsed && <span className="text-sm">{item.name}</span>}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom Actions */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
                {/* Mode Tampilan Toggle */}
                <button
                    type="button"
                    onClick={toggleTheme}
                    className={`w-full flex items-center ${
                        isCollapsed ? 'justify-center' : 'justify-between'
                    } px-3.5 py-2.5 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors`}
                    title={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
                >
                    {!isCollapsed && (
                        <span className="text-sm font-medium">
                            {isDark ? 'Mode Gelap' : 'Mode Terang'}
                        </span>
                    )}
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors">
                        {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
                    </div>
                </button>

                {/* Logout Button */}
                <button
                    type="button"
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium transition-colors ${
                        isCollapsed ? 'justify-center' : ''
                    }`}
                    title="Keluar"
                >
                    <LogOut size={19} className="text-rose-500" />
                    {!isCollapsed && <span className="text-sm">Keluar</span>}
                </button>
            </div>
        </aside>
    );
}
