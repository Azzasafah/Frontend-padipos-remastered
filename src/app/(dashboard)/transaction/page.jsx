'use client';

import React, { useState, useEffect } from 'react';
import api from '../../lib/axios';
import Header from '../../components/Header';
import toast from 'react-hot-toast';
import {
    Search,
    Download,
    Eye,
    RotateCcw,
    X,
    Calendar,
    ChevronDown
} from 'lucide-react';

export default function TransactionPage() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [orderTypeFilter, setOrderTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Detail Modal
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const params = {};
            if (orderTypeFilter) params.orderType = orderTypeFilter;
            if (statusFilter) params.paymentStatus = statusFilter;

            const { data } = await api.get('/api/transactions', { params });
            setTransactions(data.data || []);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            toast.error('Gagal memuat riwayat transaksi');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetail = async (id) => {
        setLoadingDetail(true);
        try {
            const { data } = await api.get(`/api/transactions/${id}`);
            setSelectedDetail(data.data);
        } catch (error) {
            toast.error('Gagal memuat rincian transaksi');
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleExportExcel = async () => {
        try {
            toast('Menyiapkan file Excel...');
            const response = await api.get('/api/reports/export', {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `laporan-transaksi-${new Date().toISOString().slice(0, 10)}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            toast.success('Laporan Excel berhasil diunduh!');
        } catch (error) {
            toast.error('Gagal mengekspor laporan Excel');
        }
    };

    const filteredTransactions = transactions.filter(t => {
        const matchSearch = (t.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            `#${t.id}`.includes(searchQuery);
        const matchOrderType = !orderTypeFilter || t.orderType === orderTypeFilter;
        const matchStatus = !statusFilter || t.paymentStatus === statusFilter;
        return matchSearch && matchOrderType && matchStatus;
    });

    return (
        <div className="space-y-5">
            <Header title="Riwayat Transaksi" subtitle="Catatan seluruh transaksi kasir & pembayaran" />

            {/* Action Bar: Export Excel & Refresh */}
            <div className="flex justify-end gap-2.5">
                <button
                    type="button"
                    onClick={fetchTransactions}
                    className="bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-2xs transition"
                >
                    <RotateCcw size={14} /> Refresh
                </button>
                <button
                    type="button"
                    onClick={handleExportExcel}
                    className="bg-[#1d4ed8] hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-xs transition"
                >
                    <Download size={14} /> Ekspor Excel
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="flex-1 relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari nama customer atau No. Order..."
                        className="w-full bg-white border border-slate-200/90 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                    />
                </div>

                {/* Filter Tipe Order */}
                <div className="relative min-w-[150px]">
                    <select
                        value={orderTypeFilter}
                        onChange={(e) => setOrderTypeFilter(e.target.value)}
                        className="w-full bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs appearance-none pr-8 cursor-pointer"
                    >
                        <option value="">Semua Tipe Order</option>
                        <option value="dine_in">Dine In</option>
                        <option value="take_away">Take Away</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                {/* Filter Status */}
                <div className="relative min-w-[150px]">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs appearance-none pr-8 cursor-pointer"
                    >
                        <option value="">Semua Status</option>
                        <option value="paid">Paid (Lunas)</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                <th className="py-3.5 px-4">No. Order</th>
                                <th className="py-3.5 px-4">Waktu</th>
                                <th className="py-3.5 px-4">Customer</th>
                                <th className="py-3.5 px-4">Tipe Order</th>
                                <th className="py-3.5 px-4">Metode</th>
                                <th className="py-3.5 px-4">Total</th>
                                <th className="py-3.5 px-4 text-center">Status</th>
                                <th className="py-3.5 px-4 text-center">Aksi</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                                        Memuat riwayat transaksi...
                                    </td>
                                </tr>
                            ) : filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                                        Belum ada data transaksi
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map((t) => {
                                    const dateStr = new Date(t.createdAt).toLocaleString('id-ID', {
                                        dateStyle: 'medium',
                                        timeStyle: 'short'
                                    });

                                    const isPaid = t.paymentStatus === 'paid';
                                    const isPending = t.paymentStatus === 'pending';

                                    return (
                                        <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                                                #{t.id}
                                            </td>
                                            <td className="py-3.5 px-4 text-slate-500 font-medium">
                                                {dateStr}
                                            </td>
                                            <td className="py-3.5 px-4 font-semibold text-slate-800">
                                                {t.customerName || 'Customer'}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                                    t.orderType === 'dine_in'
                                                        ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                                                }`}>
                                                    {t.orderType === 'dine_in' ? 'Dine In' : 'Take Away'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 font-semibold text-slate-700 uppercase text-[11px]">
                                                {t.paymentMethod}
                                            </td>
                                            <td className="py-3.5 px-4 font-black text-[#1d4ed8]">
                                                Rp {Number(t.totalAmount || 0).toLocaleString('id-ID')}
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                                                    isPaid
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : isPending
                                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                }`}>
                                                    {isPaid ? 'Lunas' : isPending ? 'Pending' : 'Gagal'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleViewDetail(t.id)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                                                >
                                                    <Eye size={13} /> Detail
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <p>
                        Total {filteredTransactions.length} transaksi ditampilkan
                    </p>
                </div>
            </div>

            {/* Modal Detail Transaksi */}
            {selectedDetail && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    Detail Transaksi #{selectedDetail.id}
                                </h3>
                                <p className="text-[11px] text-slate-400">
                                    {new Date(selectedDetail.createdAt).toLocaleString('id-ID')}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedDetail(null)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Items */}
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1 mb-4">
                            {(selectedDetail.transactionDetails || []).map((d) => (
                                <div key={d.id} className="flex justify-between items-center text-xs p-2.5 bg-slate-50 rounded-xl">
                                    <div>
                                        <p className="font-bold text-slate-800">{d.productName}</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            {d.quantity} x Rp {Number(d.price).toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                    <span className="font-bold text-blue-600">
                                        Rp {Number(d.subtotal).toLocaleString('id-ID')}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Calculation summary */}
                        <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs font-mono">
                            <div className="flex justify-between text-slate-600">
                                <span>Metode Pembayaran:</span>
                                <span className="font-bold text-slate-800 uppercase">{selectedDetail.paymentMethod}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Total Pembayaran:</span>
                                <span className="font-bold text-[#1d4ed8]">Rp {Number(selectedDetail.totalAmount).toLocaleString('id-ID')}</span>
                            </div>
                            {selectedDetail.paidAmount && (
                                <div className="flex justify-between text-slate-600">
                                    <span>Nominal Diterima:</span>
                                    <span>Rp {Number(selectedDetail.paidAmount).toLocaleString('id-ID')}</span>
                                </div>
                            )}
                            {selectedDetail.changeAmount && (
                                <div className="flex justify-between text-emerald-600 font-bold">
                                    <span>Kembalian:</span>
                                    <span>Rp {Number(selectedDetail.changeAmount).toLocaleString('id-ID')}</span>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 mt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setSelectedDetail(null)}
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
