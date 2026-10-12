'use client';

import { useState, useEffect, useRef } from 'react';
import api from '../../lib/axios';
import { useCartStore } from '../../store/cartStore';
import Header from '../../components/Header';
import toast from 'react-hot-toast';
import {
    Search,
    Plus,
    Minus,
    Trash2,
    ShoppingCart,
    Banknote,
    QrCode,
    CreditCard,
    CheckCircle2,
    Printer,
    X
} from 'lucide-react';

export default function CashierPage() {
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    // Payment & checkout state
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paymentSubMethod, setPaymentSubMethod] = useState('tunai');
    const [paidAmount, setPaidAmount] = useState('');
    const [discountType, setDiscountType] = useState('%');
    const [discountValue, setDiscountValue] = useState(0);
    const [taxEnabled, setTaxEnabled] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Success Modal
    const [completedTransaction, setCompletedTransaction] = useState(null);
    const printRef = useRef(null);
    const searchInputRef = useRef(null);
    const discountInputRef = useRef(null);

    const {
        items,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        getTotal: getSubTotal
    } = useCartStore();

    useEffect(() => {
        loadData();
    }, []);

    // Keyboard Shortcuts (F2, F7, F9)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'F2') {
                e.preventDefault();
                searchInputRef.current?.focus();
            } else if (e.key === 'F7') {
                e.preventDefault();
                discountInputRef.current?.focus();
            } else if (e.key === 'F9') {
                e.preventDefault();
                if (items.length > 0 && !isSubmitting) {
                    handleCheckout();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const [catRes, prodRes] = await Promise.all([
                api.get('/api/categories?limit=30'),
                api.get('/api/products?limit=50')
            ]);

            setCategories(catRes.data?.data || []);
            setProducts(prodRes.data?.data || []);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Gagal memuat data produk & kategori');
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter((p) => {
        const matchCategory = selectedCategory === 'ALL' || p.categoryId === Number(selectedCategory);
        const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchSearch;
    });

    const subtotal = getSubTotal();

    const discountAmount = discountType === '%'
        ? (subtotal * (Number(discountValue) || 0)) / 100
        : Number(discountValue) || 0;

    const afterDiscount = Math.max(0, subtotal - discountAmount);
    const taxAmount = taxEnabled ? afterDiscount * 0.11 : 0;
    const finalTotal = Math.round(afterDiscount + taxAmount);

    const numericPaid = Number(paidAmount) || 0;
    const changeAmount = paymentSubMethod === 'tunai' ? Math.max(0, numericPaid - finalTotal) : 0;

    const handleSelectPaymentMethod = (type) => {
        setPaymentSubMethod(type);
        if (type === 'qris') {
            setPaymentMethod('midtrans');
        } else {
            setPaymentMethod('cash');
        }
    };

    const handleCheckout = async () => {
        if (items.length === 0) {
            toast.error('Keranjang belanja masih kosong!');
            return;
        }

        if (paymentSubMethod === 'tunai' && numericPaid < finalTotal) {
            toast.error('Nominal pembayaran tunai kurang dari total!');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                orderType: 'dine_in',
                paymentMethod: paymentMethod,
                customerName: 'Customer',
                paid: paymentMethod === 'cash' ? (paymentSubMethod === 'tunai' ? numericPaid : finalTotal) : undefined,
                items: items.map(item => ({
                    productId: Number(item.productId),
                    qty: Number(item.qty)
                }))
            };

            const { data } = await api.post('/api/transactions', payload);

            if (paymentMethod === 'midtrans' && data.snapId) {
                if (typeof window !== 'undefined' && window.snap) {
                    window.snap.pay(data.snapId, {
                        onSuccess: () => {
                            toast.success('Pembayaran QRIS berhasil!');
                            finishTransaction(data.transactionId);
                        },
                        onPending: () => toast('Menunggu pembayaran QRIS'),
                        onError: () => toast.error('Pembayaran QRIS gagal'),
                        onClose: () => toast('Jendela QRIS ditutup')
                    });
                } else {
                    toast.success('Transaksi dibuat via Midtrans!');
                    finishTransaction(data.transactionId);
                }
            } else {
                toast.success('Transaksi cash berhasil diselesaikan!');
                finishTransaction(data.transactionId);
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Gagal memproses transaksi';
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const finishTransaction = async (transactionId) => {
        try {
            const { data } = await api.get(`/api/transactions/${transactionId}`);
            setCompletedTransaction(data.data);
        } catch {
            setCompletedTransaction({
                id: transactionId,
                totalAmount: finalTotal,
                paidAmount: numericPaid,
                changeAmount
            });
        }
        clearCart();
        setPaidAmount('');
        loadData();
    };

    const handlePrint = () => {
        if (!printRef.current) return;
        const printContent = printRef.current.innerHTML;
        const win = window.open('', '', 'width=420,height=600');
        win.document.write(`
            <html>
            <head>
                <title>Struk Pembayaran</title>
                <style>
                    body { font-family: monospace; padding: 20px; font-size: 12px; }
                    .center { text-align: center; }
                    .dashed { border-bottom: 1px dashed #000; margin: 10px 0; }
                    .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
                    .total { font-weight: bold; font-size: 14px; }
                </style>
            </head>
            <body>
                <h3 class="center" style="margin:0;">TOKO SUMBER REZEKI</h3>
                <p class="center" style="margin:2px 0;">Jl. Raya Merdeka No. 88</p>
                <div class="dashed"></div>
                ${printContent}
                <div class="dashed"></div>
                <p class="center">Terima kasih atas kunjungan Anda!</p>
            </body>
            </html>
        `);
        win.document.close();
        win.focus();
        win.print();
        win.close();
    };

    return (
        <div className="space-y-4">
            <Header title="Kasir" subtitle="Toko Sumber Rezeki" />

            <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* LEFT / CENTER: Products Grid & Search */}
                <div className="flex-1 min-w-0 space-y-4 w-full">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari produk (F2)"
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition"
                        />
                    </div>

                    {/* Category Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                        <button
                            type="button"
                            onClick={() => setSelectedCategory('ALL')}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                                selectedCategory === 'ALL'
                                    ? 'bg-[#1d4ed8] text-white shadow-xs'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            Semua produk
                        </button>

                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                                    selectedCategory === cat.id
                                        ? 'bg-[#1d4ed8] text-white shadow-xs'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    {/* Products Grid */}
                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 pt-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                                <div key={n} className="bg-white rounded-2xl border border-slate-100 p-3 h-52 animate-pulse flex flex-col justify-between">
                                    <div className="bg-slate-100 h-28 rounded-xl w-full"></div>
                                    <div className="space-y-1.5 mt-2">
                                        <div className="bg-slate-100 h-3.5 rounded w-3/4"></div>
                                        <div className="bg-slate-100 h-3 rounded w-1/2"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
                            <ShoppingCart size={40} className="mx-auto mb-2 text-slate-300" />
                            <p className="text-sm font-medium">Tidak ada produk ditemukan</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 pt-1">
                            {filteredProducts.map((p) => {
                                const isLowStock = p.stock <= 5;
                                const rawPrice = Number(p.rawPrice) || Number(p.price) || 0;

                                return (
                                    <div
                                        key={p.id}
                                        className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
                                    >
                                        {/* Image Box */}
                                        <div className="relative w-full h-32 bg-slate-100 overflow-hidden">
                                            {p.imageUrl ? (
                                                <img
                                                    src={p.imageUrl}
                                                    alt={p.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-slate-300">
                                                    <ShoppingCart size={32} />
                                                </div>
                                            )}
                                            {p.category?.name && (
                                                <span className="absolute top-2 right-2 bg-blue-600/90 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                                                    {p.category.name}
                                                </span>
                                            )}
                                        </div>

                                        {/* Info Box */}
                                        <div className="p-3.5 flex flex-col justify-between flex-1">
                                            <div>
                                                <h3 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-1 leading-snug">
                                                    {p.name}
                                                </h3>
                                                <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                                                    BRG-{String(p.id).padStart(3, '0')}
                                                </p>
                                            </div>

                                            <div className="flex items-end justify-between mt-3 pt-2 border-t border-slate-100/80">
                                                <div>
                                                    <p className="text-xs sm:text-sm font-black text-[#1d4ed8]">
                                                        Rp {rawPrice.toLocaleString('id-ID')}
                                                    </p>
                                                    <p className={`text-[10px] font-medium mt-0.5 ${
                                                        isLowStock ? 'text-rose-500 font-bold' : 'text-slate-400'
                                                    }`}>
                                                        Stok: {p.stock}
                                                    </p>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => addItem({ product: { id: p.id, name: p.name, price: rawPrice } })}
                                                    disabled={p.stock <= 0}
                                                    className="w-8 h-8 rounded-lg bg-[#1d4ed8] hover:bg-blue-700 active:scale-95 disabled:bg-slate-200 disabled:cursor-not-allowed text-white flex items-center justify-center shadow-xs transition"
                                                    title="Tambah ke keranjang"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* RIGHT: Ringkasan Pembayaran */}
                <div className="w-full lg:w-[370px] xl:w-[390px] shrink-0 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col">
                    <h2 className="text-base font-bold text-slate-900 mb-3">Ringkasan Pembayaran</h2>

                    <p className="text-xs font-semibold text-slate-700 mb-2">Item Dipilih</p>

                    {/* Cart Items List */}
                    <div className="min-h-[160px] max-h-[220px] overflow-y-auto mb-4 pr-1 space-y-2">
                        {items.length === 0 ? (
                            <div className="border border-dashed border-slate-200 bg-slate-50/70 rounded-xl p-8 text-center flex flex-col items-center justify-center">
                                <ShoppingCart size={28} className="text-slate-300 mb-1.5" />
                                <p className="text-xs font-medium text-slate-400">Keranjang masih kosong</p>
                            </div>
                        ) : (
                            items.map((item) => (
                                <div key={item.productId} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs">
                                    <div className="flex-1 min-w-0 pr-2">
                                        <p className="font-bold text-slate-800 truncate">{item.name}</p>
                                        <p className="text-[11px] text-blue-600 font-semibold mt-0.5">
                                            Rp {Number(item.price).toLocaleString('id-ID')}
                                        </p>
                                    </div>

                                    {/* Qty Controls */}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => updateQty(item.productId, item.note, item.qty - 1)}
                                            className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-100"
                                        >
                                            <Minus size={12} />
                                        </button>
                                        <span className="w-6 text-center font-bold text-slate-800 text-xs">
                                            {item.qty}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => updateQty(item.productId, item.note, item.qty + 1)}
                                            className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-100"
                                        >
                                            <Plus size={12} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => removeItem(item.productId, item.note)}
                                            className="p-1 text-slate-400 hover:text-rose-500 ml-1"
                                            title="Hapus item"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Breakdown & Calculation */}
                    <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-600">
                            <span>Sub total</span>
                            <span className="font-semibold text-slate-800">Rp {subtotal.toLocaleString('id-ID')}</span>
                        </div>

                        {/* Diskon (F7) */}
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-600 whitespace-nowrap">Diskon (F7)</span>
                            <div className="flex items-center gap-1.5">
                                <select
                                    value={discountType}
                                    onChange={(e) => setDiscountType(e.target.value)}
                                    className="border border-slate-200 rounded-lg px-1.5 py-1 text-xs bg-slate-50 text-slate-700"
                                >
                                    <option value="%">%</option>
                                    <option value="Rp">Rp</option>
                                </select>
                                <input
                                    ref={discountInputRef}
                                    type="number"
                                    min="0"
                                    value={discountValue}
                                    onChange={(e) => setDiscountValue(e.target.value)}
                                    className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-xs text-right bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* PPN 11% Toggle */}
                        <div className="flex items-center justify-between text-slate-600">
                            <span>PPN 11%</span>
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] text-slate-400">
                                    Rp {taxAmount.toLocaleString('id-ID')}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setTaxEnabled(!taxEnabled)}
                                    className={`w-9 h-5 rounded-full transition-colors relative ${
                                        taxEnabled ? 'bg-[#1d4ed8]' : 'bg-slate-300'
                                    }`}
                                >
                                    <span
                                        className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                                            taxEnabled ? 'right-0.5' : 'left-0.5'
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>

                        {/* Total Pembayaran */}
                        <div className="border-t border-dashed border-slate-200 pt-3 flex items-baseline justify-between">
                            <span className="text-xs font-semibold text-slate-600">Total pembayaran</span>
                            <span className="text-2xl font-black text-[#1d4ed8]">
                                Rp {finalTotal.toLocaleString('id-ID')}
                            </span>
                        </div>

                        {/* Metode Pembayaran */}
                        <div className="pt-2">
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                                Metode pembayaran:
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleSelectPaymentMethod('tunai')}
                                    className={`py-2 px-1 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                                        paymentSubMethod === 'tunai'
                                            ? 'bg-blue-50 border-blue-600 text-blue-600 shadow-2xs'
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    <Banknote size={14} /> Tunai
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSelectPaymentMethod('qris')}
                                    className={`py-2 px-1 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                                        paymentSubMethod === 'qris'
                                            ? 'bg-blue-50 border-blue-600 text-blue-600 shadow-2xs'
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    <QrCode size={14} /> QRIS
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSelectPaymentMethod('debit')}
                                    className={`py-2 px-1 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                                        paymentSubMethod === 'debit'
                                            ? 'bg-blue-50 border-blue-600 text-blue-600 shadow-2xs'
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    <CreditCard size={14} /> Debit
                                </button>
                            </div>
                        </div>

                        {/* Input Nominal Tunai jika Tunai */}
                        {paymentSubMethod === 'tunai' && (
                            <div className="pt-2 space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-semibold text-slate-600">Nominal Diterima:</span>
                                    <input
                                        type="number"
                                        placeholder="Rp 0"
                                        value={paidAmount}
                                        onChange={(e) => setPaidAmount(e.target.value)}
                                        className="w-32 border border-slate-200 bg-white rounded-lg px-2 py-1 text-right font-bold text-xs"
                                    />
                                </div>
                                <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                                    <span>Kembalian:</span>
                                    <span className="font-bold text-emerald-600">Rp {changeAmount.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex gap-1 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setPaidAmount(String(finalTotal))}
                                        className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-600 hover:bg-slate-100"
                                    >
                                        Uang Pas
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaidAmount('50000')}
                                        className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-600 hover:bg-slate-100"
                                    >
                                        50k
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaidAmount('100000')}
                                        className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-600 hover:bg-slate-100"
                                    >
                                        100k
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 space-y-2 mt-auto">
                        <button
                            type="button"
                            onClick={handleCheckout}
                            disabled={items.length === 0 || isSubmitting}
                            className="w-full bg-[#1d4ed8] hover:bg-blue-700 active:scale-98 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-xs transition text-sm flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? 'Memproses...' : 'Bayar (F9)'}
                        </button>

                        <button
                            type="button"
                            onClick={clearCart}
                            disabled={items.length === 0}
                            className="w-full border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-500 font-medium py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-500"
                        >
                            <Trash2 size={13} /> Hapus keranjang
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal Sukses Transaksi & Cetak Struk */}
            {completedTransaction && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
                        <div className="text-center">
                            <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-2" />
                            <h3 className="text-lg font-bold text-slate-900">Transaksi Berhasil!</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Order ID #{completedTransaction.id}</p>
                        </div>

                        {/* Struk Content */}
                        <div ref={printRef} className="my-4 p-3 bg-slate-50 rounded-xl text-xs space-y-1.5 font-mono">
                            <div className="flex justify-between">
                                <span>No. Order:</span>
                                <span>#{completedTransaction.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Total:</span>
                                <span className="font-bold">Rp {Number(completedTransaction.totalAmount || 0).toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Bayar:</span>
                                <span>Rp {Number(completedTransaction.paidAmount || 0).toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between text-emerald-600 font-bold">
                                <span>Kembalian:</span>
                                <span>Rp {Number(completedTransaction.changeAmount || 0).toLocaleString('id-ID')}</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handlePrint}
                                className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5"
                            >
                                <Printer size={14} /> Cetak Struk
                            </button>
                            <button
                                type="button"
                                onClick={() => setCompletedTransaction(null)}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-xl text-xs"
                            >
                                Selesai
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
