'use client';

import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import {
    Wallet,
    Plus,
    Search,
    Trash2,
    Calendar,
    ArrowDownRight,
    TrendingDown,
    X,
    Receipt
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ExpensePage() {
    const [expenses, setExpenses] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Semua');
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        description: '',
        category: 'Operasional',
        amount: '',
        paymentMethod: 'Kas Tunai',
        date: new Date().toISOString().split('T')[0]
    });

    const categories = ['Semua', 'Operasional', 'Belanja Stok', 'Listrik & Air', 'Gaji & Upah', 'Lain-lain'];

    // Initial Load from localStorage or mock
    useEffect(() => {
        const saved = localStorage.getItem('pos_expenses');
        if (saved) {
            try {
                setExpenses(JSON.parse(saved));
            } catch {
                initDefaultExpenses();
            }
        } else {
            initDefaultExpenses();
        }
    }, []);

    const initDefaultExpenses = () => {
        const initial = [
            {
                id: 1,
                description: 'Beli kertas struk thermal 58mm (10 roll)',
                category: 'Operasional',
                amount: 75000,
                paymentMethod: 'Kas Tunai',
                date: new Date().toISOString().split('T')[0]
            },
            {
                id: 2,
                description: 'Pembayaran token listrik toko',
                category: 'Listrik & Air',
                amount: 200000,
                paymentMethod: 'Transfer',
                date: new Date().toISOString().split('T')[0]
            },
            {
                id: 3,
                description: 'Restock kantong plastik & packaging take-away',
                category: 'Operasional',
                amount: 120000,
                paymentMethod: 'Kas Tunai',
                date: new Date(Date.now() - 86400000).toISOString().split('T')[0]
            }
        ];
        setExpenses(initial);
        localStorage.setItem('pos_expenses', JSON.stringify(initial));
    };

    const saveExpensesToStorage = (updated) => {
        setExpenses(updated);
        localStorage.setItem('pos_expenses', JSON.stringify(updated));
    };

    const handleCreateExpense = (e) => {
        e.preventDefault();
        const numAmount = Number(formData.amount);
        if (!formData.description.trim()) {
            toast.error('Keterangan pengeluaran wajib diisi');
            return;
        }
        if (!numAmount || numAmount <= 0) {
            toast.error('Nominal harus lebih dari 0');
            return;
        }

        const newEntry = {
            id: Date.now(),
            description: formData.description.trim(),
            category: formData.category,
            amount: numAmount,
            paymentMethod: formData.paymentMethod,
            date: formData.date
        };

        const updated = [newEntry, ...expenses];
        saveExpensesToStorage(updated);
        toast.success('Pengeluaran berhasil dicatat');
        setShowModal(false);
        setFormData({
            description: '',
            category: 'Operasional',
            amount: '',
            paymentMethod: 'Kas Tunai',
            date: new Date().toISOString().split('T')[0]
        });
    };

    const handleDeleteExpense = (id) => {
        const updated = expenses.filter(item => item.id !== id);
        saveExpensesToStorage(updated);
        toast.success('Catatan pengeluaran dihapus');
    };

    // Filter Logic
    const filteredExpenses = expenses.filter(item => {
        const matchesCategory = selectedCategory === 'Semua' || item.category === selectedCategory;
        const matchesSearch = item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.category.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // Statistics Calculation
    const todayStr = new Date().toISOString().split('T')[0];
    const totalToday = expenses
        .filter(item => item.date === todayStr)
        .reduce((sum, item) => sum + item.amount, 0);

    const totalAll = expenses.reduce((sum, item) => sum + item.amount, 0);

    const formatRupiah = (val) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(val || 0);
    };

    return (
        <div className="space-y-6">
            <Header
                title="Catatan Pengeluaran"
                subtitle="Kelola arus kas keluar & biaya operasional toko"
            />

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pengeluaran Hari Ini</span>
                        <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                            <TrendingDown size={18} />
                        </div>
                    </div>
                    <div className="mt-3">
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {formatRupiah(totalToday)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">Dicatat pada tanggal {todayStr}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Akumulasi</span>
                        <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <Wallet size={18} />
                        </div>
                    </div>
                    <div className="mt-3">
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {formatRupiah(totalAll)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">Dari {expenses.length} transaksi kas keluar</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Jumlah Transaksi</span>
                        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <Receipt size={18} />
                        </div>
                    </div>
                    <div className="mt-3">
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {expenses.length} Catatan
                        </p>
                        <p className="text-xs text-slate-400 mt-1">Status aktif & tercatat</p>
                    </div>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                selectedCategory === cat
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari pengeluaran..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0"
                    >
                        <Plus size={16} />
                        Catat Pengeluaran
                    </button>
                </div>
            </div>

            {/* Expense Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                                <th className="p-4">Tanggal</th>
                                <th className="p-4">Keterangan</th>
                                <th className="p-4">Kategori</th>
                                <th className="p-4">Metode Bayar</th>
                                <th className="p-4 text-right">Nominal</th>
                                <th className="p-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredExpenses.length > 0 ? (
                                filteredExpenses.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                        <td className="p-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={13} className="text-slate-400" />
                                                <span>{item.date}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 font-medium text-slate-900 dark:text-white">
                                            {item.description}
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                            {item.paymentMethod}
                                        </td>
                                        <td className="p-4 text-right font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                                            - {formatRupiah(item.amount)}
                                        </td>
                                        <td className="p-4 text-center whitespace-nowrap">
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteExpense(item.id)}
                                                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                                                title="Hapus"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400">
                                        Tidak ada catatan pengeluaran ditemukan
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Tambah Pengeluaran */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                    <ArrowDownRight size={18} />
                                </div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                                    Catat Pengeluaran Baru
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateExpense} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Keterangan / Keperluan *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Beli sabun cuci tangan, token listrik..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Kategori *
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden"
                                    >
                                        {categories.filter(c => c !== 'Semua').map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Metode Bayar
                                    </label>
                                    <select
                                        value={formData.paymentMethod}
                                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden"
                                    >
                                        <option value="Kas Tunai">Kas Tunai</option>
                                        <option value="Transfer">Transfer Bank</option>
                                        <option value="E-Wallet">E-Wallet Toko</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Nominal (Rp) *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        placeholder="0"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Tanggal
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs"
                                >
                                    Simpan Pengeluaran
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
