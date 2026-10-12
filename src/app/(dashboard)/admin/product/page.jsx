'use client';

import { useState, useEffect } from 'react';
import api from '../../../lib/axios';
import Header from '../../../components/Header';
import toast from 'react-hot-toast';
import {
    Plus,
    Download,
    Search,
    Edit2,
    Trash2,
    Package,
    AlertTriangle,
    X,
    Upload,
    ChevronDown
} from 'lucide-react';

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [selectedCategory, setSelectedCategory] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state (Create & Edit)
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form inputs
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        categoryId: '',
        stock: '',
        description: '',
        unit: 'Pcs'
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    // Delete modal
    const [deleteId, setDeleteId] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [catRes, prodRes] = await Promise.all([
                api.get('/api/categories?limit=50'),
                api.get('/api/products?limit=100')
            ]);
            setCategories(catRes.data?.data || []);
            setProducts(prodRes.data?.data || []);
        } catch (error) {
            console.error('Error loading products/categories:', error);
            toast.error('Gagal memuat data inventori');
        } finally {
            setLoading(false);
        }
    };

    // Low stock items count (below threshold e.g. 10 or minStock 20)
    const lowStockCount = products.filter(p => Number(p.stock) <= 5).length;

    // Filter products
    const filteredProducts = products.filter(p => {
        const matchCategory = !selectedCategory || p.categoryId === Number(selectedCategory);
        const matchSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            `BRG-${String(p.id).padStart(3, '0')}`.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchSearch;
    });

    const handleOpenCreateModal = () => {
        setEditingProduct(null);
        setFormData({
            name: '',
            price: '',
            categoryId: categories[0]?.id ? String(categories[0].id) : '',
            stock: '',
            description: '',
            unit: 'Pcs'
        });
        setImageFile(null);
        setImagePreview(null);
        setShowModal(true);
    };

    const handleOpenEditModal = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            price: String(product.rawPrice || product.price || ''),
            categoryId: String(product.categoryId || product.category?.id || ''),
            stock: String(product.stock || 0),
            description: product.description || '',
            unit: 'Pcs'
        });
        setImageFile(null);
        setImagePreview(product.imageUrl || null);
        setShowModal(true);
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmitForm = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Nama barang wajib diisi!');
            return;
        }
        if (!formData.price || Number(formData.price) <= 0) {
            toast.error('Harga jual harus lebih dari 0!');
            return;
        }
        if (!formData.categoryId) {
            toast.error('Kategori harus dipilih!');
            return;
        }
        if (formData.stock === '' || Number(formData.stock) < 0) {
            toast.error('Stok barang tidak valid!');
            return;
        }

        setIsSubmitting(true);
        try {
            const body = new FormData();
            body.append('name', formData.name.trim());
            body.append('price', String(formData.price));
            body.append('categoryId', String(formData.categoryId));
            body.append('stock', String(formData.stock));
            body.append('description', formData.description.trim() || '');
            if (imageFile) {
                body.append('image', imageFile);
            }

            if (editingProduct) {
                await api.put(`/api/products/${editingProduct.id}`, body, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Data barang berhasil diperbarui!');
            } else {
                if (!imageFile) {
                    toast.error('Foto barang wajib diunggah!');
                    setIsSubmitting(false);
                    return;
                }
                await api.post('/api/products', body, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Barang baru berhasil ditambahkan!');
            }

            setShowModal(false);
            loadData();
        } catch (error) {
            const msg = error.response?.data?.message || 'Gagal menyimpan barang';
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProduct = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/api/products/${deleteId}`);
            toast.success('Barang berhasil dihapus!');
            setDeleteId(null);
            loadData();
        } catch (error) {
            const msg = error.response?.data?.message || 'Gagal menghapus barang';
            toast.error(msg);
        }
    };

    const handleExportPDF = () => {
        window.print();
    };

    return (
        <div className="space-y-5">
            {/* Header with Title and Quick Stats */}
            <Header title="Daftar Barang" subtitle="Kelola data barang & inventori" />

            {/* Action Bar: Export PDF & Tambah Barang */}
            <div className="flex justify-end gap-2.5">
                <button
                    type="button"
                    onClick={handleExportPDF}
                    className="bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-2xs transition"
                >
                    <Download size={15} /> Ekspor PDF
                </button>
                <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    className="bg-[#1d4ed8] hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-xs transition"
                >
                    <Plus size={15} /> Tambah Barang
                </button>
            </div>

            {/* Low Stock Alert Banner */}
            {lowStockCount > 0 && (
                <div className="bg-[#fef9c3] border border-[#fef08a] text-[#854d0e] rounded-xl px-4 py-3 text-xs font-semibold flex items-center gap-2.5 shadow-2xs">
                    <Package size={17} className="text-[#a16207] shrink-0" />
                    <span>{lowStockCount} barang memiliki stok di bawah minimum</span>
                </div>
            )}

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Category Dropdown */}
                <div className="relative min-w-[180px]">
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs appearance-none pr-8 cursor-pointer"
                    >
                        <option value="">Semua kategori</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                {/* Search Bar */}
                <div className="flex-1 relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari nama atau kode barang..."
                        className="w-full bg-white border border-slate-200/90 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                    />
                </div>
            </div>

            {/* Inventory Table Container */}
            <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                <th className="py-3.5 px-4">Kode barang</th>
                                <th className="py-3.5 px-4">Nama barang</th>
                                <th className="py-3.5 px-4">Kategori</th>
                                <th className="py-3.5 px-4">Satuan</th>
                                <th className="py-3.5 px-4">Harga beli</th>
                                <th className="py-3.5 px-4">Harga jual</th>
                                <th className="py-3.5 px-4 text-center">Stok</th>
                                <th className="py-3.5 px-4 text-center">Min. stok</th>
                                <th className="py-3.5 px-4 text-center">Status</th>
                                <th className="py-3.5 px-4 text-center">Aksi</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                                        Memuat inventori barang...
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                                        Tidak ada barang yang sesuai filter
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((p) => {
                                    const rawPrice = Number(p.rawPrice) || Number(p.price) || 0;
                                    const hargaBeliEstimate = Math.round(rawPrice * 0.7);
                                    const minStock = 20;
                                    const isLowStock = p.stock <= 5;

                                    return (
                                        <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="py-3.5 px-4 font-mono font-medium text-slate-500 text-[11px]">
                                                BRG-{String(p.id).padStart(3, '0')}
                                            </td>
                                            <td className="py-3.5 px-4 font-bold text-slate-800">
                                                {p.name}
                                            </td>
                                            <td className="py-3.5 px-4 text-slate-600">
                                                {p.category?.name || '-'}
                                            </td>
                                            <td className="py-3.5 px-4 text-slate-500">
                                                Pcs
                                            </td>
                                            <td className="py-3.5 px-4 text-slate-600 font-medium">
                                                Rp {hargaBeliEstimate.toLocaleString('id-ID')}
                                            </td>
                                            <td className="py-3.5 px-4 font-bold text-slate-800">
                                                Rp {rawPrice.toLocaleString('id-ID')}
                                            </td>
                                            <td className={`py-3.5 px-4 text-center font-bold ${
                                                isLowStock ? 'text-rose-600' : 'text-slate-800'
                                            }`}>
                                                {p.stock}
                                            </td>
                                            <td className="py-3.5 px-4 text-center text-slate-500">
                                                {minStock}
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <span className="bg-[#e0f2fe] text-[#0369a1] text-[10px] font-bold px-3 py-1 rounded-full">
                                                    Aktif
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenEditModal(p)}
                                                        className="text-blue-600 hover:text-blue-800 p-1 transition"
                                                        title="Ubah data"
                                                    >
                                                        <Edit2 size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteId(p.id)}
                                                        className="text-rose-500 hover:text-rose-700 p-1 transition"
                                                        title="Hapus barang"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Count */}
                <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <p>
                        Menampilkan 1 - {filteredProducts.length} dari {filteredProducts.length} data
                    </p>
                </div>
            </div>

            {/* Modal Tambah / Edit Barang */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <h3 className="text-base font-bold text-slate-900">
                                {editingProduct ? 'Ubah Data Barang' : 'Tambah Barang Baru'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitForm} className="space-y-3.5 text-xs">
                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">Nama Barang *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Contoh: Nasi Goreng Spesial"
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-semibold text-slate-700 block mb-1">Kategori *</label>
                                    <select
                                        required
                                        value={formData.categoryId}
                                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                                    >
                                        <option value="">Pilih Kategori</option>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="font-semibold text-slate-700 block mb-1">Harga Jual (Rp) *</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        placeholder="Contoh: 15000"
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-semibold text-slate-700 block mb-1">Stok Barang *</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.stock}
                                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                        placeholder="Contoh: 50"
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="font-semibold text-slate-700 block mb-1">Satuan</label>
                                    <input
                                        type="text"
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                        placeholder="Pcs / Botol / Porsi"
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">Deskripsi</label>
                                <textarea
                                    rows={2}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Keterangan singkat produk"
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">
                                    Foto Barang {editingProduct ? '(Biarkan kosong jika tidak diganti)' : '*'}
                                </label>
                                <div className="flex items-center gap-3">
                                    {imagePreview && (
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                                        />
                                    )}
                                    <label className="flex-1 cursor-pointer border border-dashed border-slate-300 rounded-xl px-3 py-2.5 text-center hover:bg-slate-50 transition flex items-center justify-center gap-2 text-slate-500">
                                        <Upload size={14} />
                                        <span>Pilih file gambar...</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="pt-3 flex gap-2 justify-end border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2 bg-[#1d4ed8] hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan Barang'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Hapus */}
            {deleteId && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-100">
                        <AlertTriangle size={36} className="text-rose-500 mx-auto mb-2" />
                        <h4 className="text-sm font-bold text-slate-900 text-center">Hapus Barang Ini?</h4>
                        <p className="text-xs text-slate-500 text-center mt-1">
                            Barang yang sudah dihapus tidak dapat dipulihkan kembali.
                        </p>

                        <div className="mt-4 flex gap-2">
                            <button
                                type="button"
                                onClick={() => setDeleteId(null)}
                                className="flex-1 border border-slate-200 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteProduct}
                                className="flex-1 bg-rose-600 hover:bg-rose-700 py-2 rounded-xl text-xs font-semibold text-white shadow-xs"
                            >
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
