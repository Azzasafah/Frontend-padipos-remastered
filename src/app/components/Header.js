'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Info, AlertTriangle, CheckCircle, Trash2, Shield, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Header({ title, subtitle }) {
    const { user } = useAuthStore();
    const [currentTime, setCurrentTime] = useState('');
    const [showNotifications, setShowNotifications] = useState(false);
    const dropdownRef = useRef(null);

    const isAdmin = user?.role === 'admin';

    const [notifications, setNotifications] = useState([
        {
            id: 1,
            title: 'Peringatan Stok',
            message: 'Terdapat beberapa barang dengan persediaan mendekati stok minimum.',
            time: '10 mnt lalu',
            unread: true,
            type: 'warning'
        },
        {
            id: 2,
            title: 'Sistem POS Siap',
            message: 'Database berhasil terhubung ke server backend lokal.',
            time: '30 mnt lalu',
            unread: true,
            type: 'success'
        },
        {
            id: 3,
            title: 'Sinkronisasi Kasir',
            message: 'Koneksi printer thermal dan barcode reader aktif.',
            time: '1 jam lalu',
            unread: false,
            type: 'info'
        }
    ]);

    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            setCurrentTime(`${timeString} WIB`);
        };

        updateClock();
        const timer = setInterval(updateClock, 1000);
        return () => clearInterval(timer);
    }, []);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        if (showNotifications) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showNotifications]);

    const unreadCount = notifications.filter(n => n.unread).length;

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    };

    const clearAllNotifications = () => {
        setNotifications([]);
    };

    return (
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
                <div className="flex items-center gap-2.5">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h1>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                        isAdmin
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                    }`}>
                        {isAdmin ? 'Mode Admin' : 'Mode Kasir'}
                    </span>
                </div>
                {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
                {/* Notification Bell with Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => setShowNotifications(!showNotifications)}
                        className={`w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors shadow-xs relative ${
                            showNotifications ? 'ring-2 ring-blue-500/30' : ''
                        }`}
                        title="Notifikasi"
                    >
                        <Bell size={18} />
                        {unreadCount > 0 && (
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 absolute top-2 right-2 ring-2 ring-white dark:ring-slate-900 animate-pulse"></span>
                        )}
                    </button>

                    {/* Popover Card */}
                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                            {/* Popover Header */}
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Notifikasi</h3>
                                    {unreadCount > 0 && (
                                        <span className="text-[11px] font-semibold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                                            {unreadCount} baru
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    {unreadCount > 0 && (
                                        <button
                                            type="button"
                                            onClick={markAllAsRead}
                                            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                                        >
                                            <Check size={13} />
                                            Tandai dibaca
                                        </button>
                                    )}
                                    {notifications.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={clearAllNotifications}
                                            className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors p-1"
                                            title="Hapus semua"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Notifications List */}
                            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                {notifications.length > 0 ? (
                                    notifications.map((item) => (
                                        <div
                                            key={item.id}
                                            className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex gap-3 ${
                                                item.unread ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''
                                            }`}
                                        >
                                            <div className="mt-0.5 shrink-0">
                                                {item.type === 'warning' ? (
                                                    <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                                        <AlertTriangle size={15} />
                                                    </div>
                                                ) : item.type === 'success' ? (
                                                    <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                                        <CheckCircle size={15} />
                                                    </div>
                                                ) : (
                                                    <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                                        <Info size={15} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-1 mb-0.5">
                                                    <p className={`text-xs ${item.unread ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                                                        {item.title}
                                                    </p>
                                                    <span className="text-[10px] text-slate-400 shrink-0">{item.time}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                                                    {item.message}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 text-center text-slate-400 text-xs">
                                        Tidak ada notifikasi baru
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Live Clock Pill */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl px-4 py-1.5 shadow-xs flex flex-col justify-center min-w-[110px]">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 leading-none">Waktu</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 font-mono mt-0.5 leading-tight">
                        {currentTime || '--:--:-- WIB'}
                    </span>
                </div>

                {/* User Profile Pill with Role Distinction */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl pl-1.5 pr-4 py-1 shadow-xs flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs shadow-xs ${
                        isAdmin ? 'bg-blue-600' : 'bg-emerald-600'
                    }`}>
                        {user?.username?.charAt(0).toUpperCase() || (isAdmin ? 'A' : 'K')}
                    </div>
                    <div className="text-left">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                            {user?.username || (isAdmin ? 'Admin' : 'Kasir')}
                        </p>
                        <p className={`text-[10px] font-semibold capitalize leading-none mt-0.5 ${
                            isAdmin ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                            {user?.role === 'admin' ? 'Administrator' : 'Kasir Toko'}
                        </p>
                    </div>
                </div>
            </div>
        </header>
    );
}
