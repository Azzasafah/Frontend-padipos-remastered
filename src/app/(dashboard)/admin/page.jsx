'use client';

import { useState, useEffect } from 'react';
import api from '../../lib/axios';
import Header from '../../components/Header';
import toast from 'react-hot-toast';
import {
    ShoppingCart,
    DollarSign,
    Package,
    TrendingUp,
    BarChart3,
    X,
    Eye
} from 'lucide-react';
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

export default function DashboardPage() {
    const [dashboardData, setDashboardData] = useState(null);
    const [categoriesList, setCategoriesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategoryName, setSelectedCategoryName] = useState(null);
    const [categoryDetail, setCategoryDetail] = useState([]);
    const [loadingDetail, setLoadingDetail] = useState(false);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        setLoading(true);
        try {
            const [dashRes, catRes] = await Promise.all([
                api.get('/api/reports/dashboard'),
                api.get('/api/categories?limit=50')
            ]);
            setDashboardData(dashRes.data?.data || null);
            setCategoriesList(catRes.data?.data || []);
        } catch (error) {
            console.error('Error fetching dashboard:', error);
            toast.error('Gagal memuat data laporan');
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryClick = async (categoryName) => {
        const cat = categoriesList.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
        if (!cat) return;

        setSelectedCategoryName(cat.name);
        setLoadingDetail(true);
        setCategoryDetail([]);

        try {
            const { data } = await api.get(`/api/reports/category/${cat.id}`);
            setCategoryDetail(data.data || []);
        } catch (error) {
            toast.error('Gagal memuat rincian kategori');
        } finally {
            setLoadingDetail(false);
        }
    };

    const categoryChartData = Object.entries(dashboardData?.categories || {}).map(
        ([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            sales: Number(value) || 0,
        })
    );

    const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#1d4ed8', '#1e40af'];

    return (
        <div className="space-y-6">
            <Header title="Laporan & Statistik" subtitle="Ringkasan performa dan penjualan toko" />

            {/* Quick Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {/* Total Orders */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <ShoppingCart size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-400">Total Transaksi</p>
                        <p className="text-2xl font-black text-slate-800 mt-0.5">
                            {dashboardData?.totalOrders || 0}
                        </p>
                    </div>
                </div>

                {/* Total Omzet */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <DollarSign size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-400">Total Omzet</p>
                        <p className="text-2xl font-black text-[#1d4ed8] mt-0.5">
                            {dashboardData?.totalOmzet || 'Rp 0'}
                        </p>
                    </div>
                </div>

                {/* Total Items */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Package size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-400">Item Terjual</p>
                        <p className="text-2xl font-black text-slate-800 mt-0.5">
                            {dashboardData?.totalItems || 0}
                        </p>
                    </div>
                </div>
            </div>

            {/* Charts & Category Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart: Penjualan per Kategori */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <BarChart3 size={16} className="text-blue-600" /> Penjualan Berdasarkan Kategori
                    </h3>

                    {categoryChartData.length === 0 ? (
                        <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                            Belum ada data penjualan kategori
                        </div>
                    ) : (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={categoryChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                                    <YAxis stroke="#94a3b8" fontSize={11} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#ffffff',
                                            borderRadius: '12px',
                                            border: '1px solid #e2e8f0',
                                            fontSize: '12px'
                                        }}
                                    />
                                    <Bar dataKey="sales" fill="#2563eb" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Categories List Breakdown with Drilldown */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <TrendingUp size={16} className="text-blue-600" /> Rincian Item Terjual per Kategori
                        </h3>

                        {categoryChartData.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-12">Belum ada data transaksi</p>
                        ) : (
                            <div className="space-y-3">
                                {categoryChartData.map((item, idx) => (
                                    <div
                                        key={item.name}
                                        onClick={() => handleCategoryClick(item.name)}
                                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50/60 cursor-pointer transition border border-slate-100"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                                            <span className="text-xs font-bold text-slate-700">{item.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-blue-600">{item.sales} pcs</span>
                                            <Eye size={14} className="text-slate-400 hover:text-blue-600" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <p className="text-[11px] text-slate-400 mt-4 text-center">
                        Klik kategori untuk melihat rincian menu yang terjual
                    </p>
                </div>
            </div>

            {/* Modal Detail Kategori Drilldown */}
            {selectedCategoryName && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <h3 className="text-base font-bold text-slate-900">
                                Rincian Penjualan: {selectedCategoryName}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setSelectedCategoryName(null)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {loadingDetail ? (
                            <p className="text-center py-8 text-xs text-slate-400">Memuat rincian...</p>
                        ) : categoryDetail.length === 0 ? (
                            <p className="text-center py-8 text-xs text-slate-400">Belum ada item terjual di kategori ini</p>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                {categoryDetail.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl text-xs">
                                        <span className="font-semibold text-slate-800">{item.menuName}</span>
                                        <span className="font-bold text-blue-600">{item.totalSales} terjual</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="pt-4 mt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setSelectedCategoryName(null)}
                                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2 rounded-xl text-xs"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
