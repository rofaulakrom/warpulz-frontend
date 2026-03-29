"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  ChevronLeft, ChevronRight,
  DollarSign,
  Edit,
  FileText // Ikon tambahan untuk tombol laporan
  ,

























  Filter,
  LogOut,
  Menu,
  Package,
  Plus,
  ShoppingCart,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis, YAxis
} from "recharts";

// --- IMPORT LIBRARY PDF ---
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// --- INTERFACES ---
interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

interface OrderData {
  id: string;
  invoice_number: string;
  customer_name: string;
  table_number: string;
  order_type: string;
  product_name: string;
  total_price: number;
  payment_method: string;
  status: string;
  created_at: string;
}

interface ExpenseData {
  id: number;
  description: string;
  category: string;
  amount: number;
  expense_date: string;
  created_at: string;
}

const CATEGORIES = ["Semua", "Indomie", "Aneka Nasi", "Snacks", "Ordinary", "Hot Drink", "Cold Drink"];
const FORM_CATEGORIES = CATEGORIES.filter(c => c !== "Semua");
const EXPENSE_CATEGORIES = ["Bahan Baku", "Operasional", "Gaji Karyawan", "Lain-lain"];

// WARNA GRAFIK DISESUAIKAN TEMA KOPI (Coklat, Amber, Gold, Red Aksen)
const PIE_COLORS = ['#4a3320', '#d9a014', '#8b523e', '#d32f2f', '#6b523e', '#b9a58b'];

export default function AdminDashboard() {
  const router = useRouter();
  
  // Navigation State
  const [activeTab, setActiveTab] = useState("orders");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [expenses, setExpenses] = useState<ExpenseData[]>([]); 
  
  // Pagination & Filter States
  const [orderPage, setOrderPage] = useState(1);
  const [productPage, setProductPage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("Semua"); 
  
  const [stockCategory, setStockCategory] = useState("Semua"); 
  const [pieCategory, setPieCategory] = useState("Semua"); 
  
  const ITEMS_PER_PAGE = 10;

  // --- CRUD STATES PRODUK ---
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    sku: "", name: "", category: "Indomie", price: "" as number | string, stock: "" as number | string
  });

  // --- CRUD STATES PENGELUARAN ---
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseData | null>(null);
  const [expenseForm, setExpenseForm] = useState({
    description: "", category: "Bahan Baku", amount: "" as number | string, expense_date: new Date().toISOString().split('T')[0]
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem("admin_token");
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };
  };

  const refreshData = useCallback(async () => {
    try {
      console.log("Cek Link Backend:", process.env.NEXT_PUBLIC_API_URL);
      const resProd = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`);
      const jsonProd = await resProd.json();
      setProducts(jsonProd.data || []);

      const token = localStorage.getItem("admin_token");
      if (token) {
        const resOrd = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const jsonOrd = await resOrd.json();
        const sortedOrders = (jsonOrd.data || []).sort((a: OrderData, b: OrderData) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setOrders(sortedOrders);

        const resExp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/expenses`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const jsonExp = await resExp.json();
        setExpenses(jsonExp.data || []);
      }
    } catch (err) {
      console.error("Gagal mengambil data:", err);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.push("/admin/login");
      return;
    }
    
    const initFetch = async () => {
      await refreshData();
    };
    
    initFetch();
  }, [router, refreshData]);

  // --- FUNGSI GENERATE LAPORAN IMG---
  // --- FUNGSI GENERATE LAPORAN GAMBAR (PENGGANTI PDF) ---
const generateDailyImageReport = async () => {
  // A. SIAPKAN DATA (Sama seperti PDF)
  const todayStr = new Date().toISOString().split('T')[0];
  const displayDate = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // 1. Data Penjualan
  const todayOrders = orders.filter(o => 
    (o.status === "Paid" || o.status === "Completed") && o.created_at.startsWith(todayStr)
  );
  const productSales: Record<string, { category: string, qty: number, total: number }> = {};
  todayOrders.forEach(o => {
    o.product_name.split(' | ').forEach(itemStr => {
      const match = itemStr.match(/(.*?)\s\((\d+)x\)/);
      if (match) {
        const name = match[1].trim();
        const qty = parseInt(match[2]);
        const pData = products.find(p => p.name === name);
        const category = pData ? pData.category : "Lainnya";
        const price = pData ? pData.price : 0;
        if (!productSales[name]) {
          productSales[name] = { category, qty: 0, total: 0 };
        }
        productSales[name].qty += qty;
        productSales[name].total += (price * qty);
      }
    });
  });

  // 2. Data Pengeluaran
  const todayExpenses = expenses.filter(e => e.expense_date === todayStr);

  // 3. Ringkasan Keuangan
  const revToday = todayOrders.reduce((sum, o) => sum + o.total_price, 0);
  const expToday = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  const net = revToday - expToday;

  // B. BUAT TEMPLATE HTML (Akan Dipotret)
  // Kita buat di memori, tidak tampil di layar
  const reportContainer = document.createElement("div");
  reportContainer.id = "WARPULZ_REPORT_IMAGE";
  
  // Style Container Utama (Latar Belakang & Padding)
  Object.assign(reportContainer.style, {
    padding: "50px",
    width: "700px", // Lebar ideal untuk di HP
    backgroundColor: "#fdfbf7", // Warna Krem khas Warpulz
    fontFamily: "sans-serif",
    color: "#2e231b",
    position: "absolute",
    left: "-9999px", // Sembunyikan dari layar
    top: "0",
  });

  // Isi Konten Laporan
  reportContainer.innerHTML = `
    <div style="border-bottom: 2px solid #e3d6c1; padding-bottom: 15px; margin-bottom: 25px;">
      <h1 style="margin: 0; color: #4a3320; font-style: italic; text-align: center;">WARPULZ REPORT</h1>
      <p style="margin: 5px 0 0 0; font-weight: bold; color: #8a7a6c; text-align: center;">LAPORAN HARIAN WARKOP PULANG</p>
      <p style="margin: 3px 0 0 0; font-size: 11px; color: #b9a58b; text-align: center;">Dicetak pada: ${displayDate}</p>
    </div>

    <div style="margin-bottom: 30px;">
      <h3 style="color: #4a3320; font-weight: bold; margin-bottom: 10px;">A. RINCIAN PENJUALAN MENU</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
        <thead>
          <tr style="background-color: #4a3320; color: white;">
            <th style="padding: 8px; border: 1px solid #6b523e; text-align: left;">Nama Produk</th>
            <th style="padding: 8px; border: 1px solid #6b523e; text-align: left;">Kategori</th>
            <th style="padding: 8px; border: 1px solid #6b523e; text-align: center;">Banyak</th>
            <th style="padding: 8px; border: 1px solid #6b523e; text-align: right;">Total Harga</th>
          </tr>
        </thead>
        <tbody style="background-color: white;">
          ${Object.entries(productSales).length > 0 ? Object.entries(productSales).map(([name, data]) => `
            <tr>
              <td style="padding: 8px; border: 1px solid #e3d6c1;">${name}</td>
              <td style="padding: 8px; border: 1px solid #e3d6c1; color: #8b523e;">${data.category}</td>
              <td style="padding: 8px; border: 1px solid #e3d6c1; text-align: center;">${data.qty}</td>
              <td style="padding: 8px; border: 1px solid #e3d6c1; text-align: right; font-weight: bold;">Rp ${data.total.toLocaleString("id-ID")}</td>
            </tr>
          `).join('') : `
            <tr><td colspan="4" style="padding: 20px; text-align: center; color: #8a7a6c; font-style: italic;">Tidak ada penjualan hari ini</td></tr>
          `}
        </tbody>
      </table>
    </div>

    <div style="margin-bottom: 30px;">
      <h3 style="color: #4a3320; font-weight: bold; margin-bottom: 10px;">B. RINCIAN PENGELUARAN TOKO</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
        <thead>
          <tr style="background-color: #d32f2f; color: white;">
            <th style="padding: 8px; border: 1px solid #b91c1c; text-align: left;">Deskripsi Pengeluaran</th>
            <th style="padding: 8px; border: 1px solid #b91c1c; text-align: left;">Kategori</th>
            <th style="padding: 8px; border: 1px solid #b91c1c; text-align: right;">Nominal</th>
          </tr>
        </thead>
        <tbody style="background-color: white;">
          ${todayExpenses.length > 0 ? todayExpenses.map(exp => `
            <tr>
              <td style="padding: 8px; border: 1px solid #e3d6c1;">${exp.description}</td>
              <td style="padding: 8px; border: 1px solid #e3d6c1; color: #8a7a6c;">${exp.category}</td>
              <td style="padding: 8px; border: 1px solid #e3d6c1; text-align: right; font-weight: bold; color: #d32f2f;">Rp ${exp.amount.toLocaleString("id-ID")}</td>
            </tr>
          `).join('') : `
            <tr><td colspan="3" style="padding: 20px; text-align: center; color: #8a7a6c; font-style: italic;">Tidak ada pengeluaran hari ini</td></tr>
          `}
        </tbody>
      </table>
    </div>

    <div style="background-color: white; padding: 20px; border-radius: 15px; border: 2px dashed #e3d6c1;">
      <h3 style="margin-top: 0; font-size: 14px; color: #2e231b; font-weight: bold;">RINGKASAN KEUANGAN HARI INI:</h3>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 11px;">
        <span>Total Pemasukan (A):</span>
        <span style="font-weight: bold;">Rp ${revToday.toLocaleString("id-ID")}</span>
      </div>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 11px; color: #d32f2f;">
        <span>Total Pengeluaran (B):</span>
        <span style="font-weight: bold;">Rp ${expToday.toLocaleString("id-ID")}</span>
      </div>

      <div style="display: flex; justify-content: space-between; margin-top: 15px; font-size: 14px; border-top: 1px solid #f4f1ea; padding-top: 10px;">
        <span style="font-weight: bold;">LABA BERSIH (A - B):</span>
        <span style="font-weight: bold; color: ${net >= 0 ? '#10b981' : '#d32f2f'};">Rp ${net.toLocaleString("id-ID")}</span>
      </div>
    </div>

    <p style="margin-top: 30px; text-align: center; font-size: 9px; color: #b9a58b;">
      Dicetak otomatis oleh Sistem Admin Warpulz • WARPULZ COMMAND CENTER
    </p>
  `;

  // C. PROSES PEMOTRETAN (HTML to CANVAS)
  // Masukkan elemen ke body sebentar, potret, lalu hapus lagi
  document.body.appendChild(reportContainer);
  
  try {
    const canvas = await html2canvas(reportContainer, {
      scale: 2, // Meningkatkan resolusi gambar (lebih tajam)
      backgroundColor: "#fdfbf7", // Pastikan latar belakang sama
      useCORS: true, // Izinkan gambar/font dari luar (jika ada)
      logging: false, // Matikan log di console
    });

    const image = canvas.toDataURL("image/png");
    
    // Hapus elemen bayangan dari body
    document.body.removeChild(reportContainer);

    // D. DOWNLOAD GAMBAR
    const link = document.createElement("a");
    link.href = image;
    link.download = `Laporan_Warpulz_${todayStr}.png`;
    link.click();

  } catch (error) {
    console.error("Gagal cetak gambar laporan:", error);
    alert("Maaf, gagal menyimpan laporan sebagai gambar. Coba PDF dulu.");
    document.body.removeChild(reportContainer); // Hapus jika gagal
  }
};
  // --- FUNGSI GENERATE LAPORAN ---
  const generateDailyReport = () => {
    const doc = new jsPDF();
    const todayStr = new Date().toISOString().split('T')[0];
    const displayDate = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    doc.setFontSize(18);
    doc.setTextColor(74, 51, 32); // Warna Kopi
    doc.text("LAPORAN HARIAN WARKOP PULANG", 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(138, 122, 108);
    doc.text(`Dicetak pada: ${displayDate}`, 14, 28);

    // 1. DATA PENJUALAN PRODUK
    const todayOrders = orders.filter(o => 
      (o.status === "Paid" || o.status === "Completed") && o.created_at.startsWith(todayStr)
    );

    const productSales: Record<string, { category: string, qty: number, total: number }> = {};
    
    todayOrders.forEach(o => {
      o.product_name.split(' | ').forEach(itemStr => {
        const match = itemStr.match(/(.*?)\s\((\d+)x\)/);
        if (match) {
          const name = match[1].trim();
          const qty = parseInt(match[2]);
          const pData = products.find(p => p.name === name);
          const category = pData ? pData.category : "Lainnya";
          const price = pData ? pData.price : 0;

          if (!productSales[name]) {
            productSales[name] = { category, qty: 0, total: 0 };
          }
          productSales[name].qty += qty;
          productSales[name].total += (price * qty);
        }
      });
    });

    const productRows = Object.entries(productSales).map(([name, data]) => [
      name,
      data.category,
      data.qty.toString(),
      `Rp ${data.total.toLocaleString("id-ID")}`
    ]);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(74, 51, 32);
    doc.text("A. RINCIAN PENJUALAN MENU", 14, 38);

    autoTable(doc, {
      startY: 42,
      head: [['Nama Produk', 'Kategori', 'Banyak', 'Total Pemasukan']],
      body: productRows,
      theme: 'grid',
      headStyles: { fillColor: [74, 51, 32], textColor: [255, 255, 255] },
      styles: { fontSize: 9 }
    });

    // 2. DATA PENGELUARAN
    const todayExpenses = expenses.filter(e => e.expense_date === todayStr);
    const expenseRows = todayExpenses.map(e => [
      e.description,
      e.category,
      `Rp ${e.amount.toLocaleString("id-ID")}`
    ]);

    const finalYProducts = (doc as any).lastAutoTable.finalY + 15;
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(74, 51, 32);
    doc.text("B. RINCIAN PENGELUARAN TOKO", 14, finalYProducts);

    autoTable(doc, {
      startY: finalYProducts + 4,
      head: [['Deskripsi Pengeluaran', 'Kategori', 'Nominal']],
      body: expenseRows.length > 0 ? expenseRows : [['Tidak ada pengeluaran hari ini', '-', '-']],
      theme: 'grid',
      headStyles: { fillColor: [211, 47, 47], textColor: [255, 255, 255] }, 
      styles: { fontSize: 9 }
    });

    // 3. RINGKASAN AKHIR (MODIFIKASI FONT BESAR & BOLD)
    const finalYExpenses = (doc as any).lastAutoTable.finalY + 15;
    const revToday = todayOrders.reduce((sum, o) => sum + o.total_price, 0);
    const expToday = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const diff = revToday - expToday;

    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("RINGKASAN KEUANGAN HARI INI:", 14, finalYExpenses);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Pemasukan (A):`, 14, finalYExpenses + 10);
    doc.setFont("helvetica", "bold");
    doc.text(`Rp ${revToday.toLocaleString("id-ID")}`, 65, finalYExpenses + 10); // Angka dibuat Bold
    
    doc.setFont("helvetica");
    doc.text(`Total Pengeluaran (B):`, 14, finalYExpenses + 18);
    doc.setFont("helvetica");
    doc.setTextColor(211, 47, 47); // Warna Merah untuk angka pengeluaran
    doc.text(`Rp ${expToday.toLocaleString("id-ID")}`, 65, finalYExpenses + 18);
    
    // GARIS PEMISAH SEDERHANA
    doc.setDrawColor(200, 200, 200);
    doc.line(14, finalYExpenses + 22, 100, finalYExpenses + 22);

    doc.setFontSize(13);
    doc.setTextColor(diff >= 0 ? 16 : 211, diff >= 0 ? 129 : 47, diff >= 0 ? 64 : 47);
    doc.setFont("helvetica");
    doc.text(`LABA BERSIH (A - B): Rp ${diff.toLocaleString("id-ID")}`, 14, finalYExpenses + 32);

    doc.save(`Laporan_Warpulz_${todayStr}.pdf`);
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  };

  const handleUpdateOrderStatus = async (id: string, newStatus: string) => {
    if (confirm(`Ubah status pesanan menjadi ${newStatus}?`)) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}/status`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({ status: newStatus }),
        });
        if (response.ok) refreshData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleProductFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProductForm(prev => ({
      ...prev,
      [name]: (name === "price" || name === "stock") ? (value === "" ? "" : Number(value)) : value
    }));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingProduct ? `${process.env.NEXT_PUBLIC_API_URL}/products/${editingProduct.id}` : `${process.env.NEXT_PUBLIC_API_URL}/products`;
    const method = editingProduct ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...productForm,
          price: Number(productForm.price) || 0,
          stock: Number(productForm.stock) || 0
        }),
      });

      if (response.ok) {
        setIsProductModalOpen(false);
        setEditingProduct(null);
        refreshData();
      } else {
        alert("Gagal menyimpan produk.");
      }
    } catch {
      alert("Koneksi gagal.");
    }
  };

  const handleEditClick = (p: Product) => {
    setEditingProduct(p);
    setProductForm({ sku: p.sku, name: p.name, category: p.category, price: p.price, stock: p.stock });
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus menu ini?")) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${id}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });
        if (response.ok) refreshData();
      } catch {
        alert("Gagal menghapus produk.");
      }
    }
  };

  const openAddProductModal = () => {
    setEditingProduct(null);
    setProductForm({ sku: "", name: "", category: "Indomie", price: "", stock: "" });
    setIsProductModalOpen(true);
  };

  const handleExpenseFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setExpenseForm(prev => ({
      ...prev,
      [name]: name === "amount" ? (value === "" ? "" : Number(value)) : value
    }));
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingExpense ? `${process.env.NEXT_PUBLIC_API_URL}/expenses/${editingExpense.id}` : `${process.env.NEXT_PUBLIC_API_URL}/expenses`
    ;
    const method = editingExpense ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...expenseForm,
          amount: Number(expenseForm.amount) || 0
        }),
      });

      if (response.ok) {
        setIsExpenseModalOpen(false);
        setEditingExpense(null);
        refreshData();
      } else {
        alert("Gagal menyimpan pengeluaran.");
      }
    } catch {
      alert("Koneksi gagal.");
    }
  };

  const handleEditExpenseClick = (exp: ExpenseData) => {
    setEditingExpense(exp);
    setExpenseForm({ description: exp.description, category: exp.category, amount: exp.amount, expense_date: exp.expense_date });
    setIsExpenseModalOpen(true);
  };

  const handleDeleteExpense = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus catatan pengeluaran ini?")) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/expenses/${id}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });
        if (response.ok) refreshData();
      } catch {
        alert("Gagal menghapus data.");
      }
    }
  };

  const openAddExpenseModal = () => {
    setEditingExpense(null);
    setExpenseForm({ description: "", category: "Bahan Baku", amount: "", expense_date: new Date().toISOString().split('T')[0] });
    setIsExpenseModalOpen(true);
  };

  // --- CALCULATIONS FOR SUMMARY ---
  const today = new Date().toISOString().split('T')[0];
  const totalRevenueAllTime = orders.filter(o => o.status === "Paid" || o.status === "Completed").reduce((sum, o) => sum + o.total_price, 0);
  const totalRevenueToday = orders.filter(o => (o.status === "Paid" || o.status === "Completed") && o.created_at.startsWith(today)).reduce((sum, o) => sum + o.total_price, 0);
  const totalOrdersToday = orders.filter(o => o.created_at.startsWith(today)).length;
  const totalExpenseAllTime = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netProfit = totalRevenueAllTime - totalExpenseAllTime;
  
  const paginatedOrders = orders.slice((orderPage - 1) * ITEMS_PER_PAGE, orderPage * ITEMS_PER_PAGE);
  const totalOrderPages = Math.ceil(orders.length / ITEMS_PER_PAGE);
  
  const paginatedExpenses = expenses.slice((expensePage - 1) * ITEMS_PER_PAGE, expensePage * ITEMS_PER_PAGE);
  const totalExpensePages = Math.ceil(expenses.length / ITEMS_PER_PAGE);

  const filteredProducts = selectedCategory === "Semua" ? products : products.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());
  const paginatedProducts = filteredProducts.slice((productPage - 1) * ITEMS_PER_PAGE, productPage * ITEMS_PER_PAGE);
  const totalProductPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setProductPage(1);
  };

  const stockByProductData = (stockCategory === "Semua" ? products : products.filter(p => p.category.toLowerCase() === stockCategory.toLowerCase()))
    .map(p => ({
      name: p.name,
      Stok: p.stock
    }));

  const revenueTrendData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dailyRev = orders
      .filter(o => (o.status === "Paid" || o.status === "Completed") && o.created_at.startsWith(dateStr))
      .reduce((sum, o) => sum + o.total_price, 0);
    const dailyExp = expenses
      .filter(e => e.expense_date.startsWith(dateStr))
      .reduce((sum, e) => sum + e.amount, 0);
    return {
      tanggal: dateStr.slice(5),
      Pendapatan: dailyRev,
      Pengeluaran: dailyExp
    };
  });

  const productSalesCount: Record<string, number> = {};
  orders.filter(o => o.status === "Paid" || o.status === "Completed").forEach(o => {
    const items = o.product_name.split(' | ');
    items.forEach(itemStr => {
      const match = itemStr.match(/(.*?)\s\((\d+)x\)/);
      if (match) {
        const name = match[1].trim();
        const qty = parseInt(match[2]);
        const foundProduct = products.find(p => p.name.toLowerCase() === name.toLowerCase());
        const prodCategory = foundProduct ? foundProduct.category : "Lain-lain";
        if (pieCategory === "Semua" || prodCategory.toLowerCase() === pieCategory.toLowerCase()) {
          productSalesCount[name] = (productSalesCount[name] || 0) + qty;
        }
      }
    });
  });

  const pieChartData = Object.entries(productSalesCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }));

  const handleNavClick = (tabName: string) => {
    setActiveTab(tabName);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-krem font-sans text-[#2e231b] relative">
      
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-[#2e231b]/50 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 bg-white border-r border-krem-dark flex flex-col shadow-2xl md:shadow-sm z-50 w-64 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-[#f4f1ea] flex justify-between items-center">
          <button onClick={() => handleNavClick("orders")} className="text-left w-full hover:scale-105 transition-transform origin-left">
            <h1 className="text-2xl font-black italic tracking-tighter text-kopi">WARPULZ<span className="text-[#2e231b]"> ADMIN</span></h1>
            <p className="text-[10px] font-bold text-[#8a7a6c] uppercase tracking-widest mt-1">Command Center</p>
          </button>
          <button className="md:hidden text-[#8a7a6c] hover:text-[#d32f2f]" onClick={() => setIsSidebarOpen(false)}><X size={24} /></button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button onClick={() => handleNavClick("orders")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'orders' ? 'bg-kopi text-white' : 'text-kopi-light hover:bg-[#f4f1ea] hover:text-kopi'}`}><ShoppingCart size={18} /> Manajemen Pesanan</button>
          <button onClick={() => handleNavClick("products")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'products' ? 'bg-kopi text-white' : 'text-kopi-light hover:bg-[#f4f1ea] hover:text-kopi'}`}><Package size={18} /> Manajemen Stok</button>
          <button onClick={() => handleNavClick("expenses")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'expenses' ? 'bg-kopi text-white' : 'text-kopi-light hover:bg-[#f4f1ea] hover:text-kopi'}`}><DollarSign size={18} /> Buku Pengeluaran</button>
          <button onClick={() => handleNavClick("analytics")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'analytics' ? 'bg-kopi text-white' : 'text-kopi-light hover:bg-[#f4f1ea] hover:text-kopi'}`}><BarChart3 size={18} /> Visualisasi Data</button>
        </nav>

        <div className="p-4 border-t border-[#f4f1ea]">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#fff1f1] text-[#d32f2f] rounded-xl font-bold text-sm hover:bg-[#ffe4e4] transition-all"><LogOut size={16} /> Logout Sistem</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden w-full">
        <header className="bg-white border-b border-krem-dark px-4 md:px-8 py-4 md:py-5 flex items-center justify-between z-10 sticky top-0">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 -ml-2 text-kopi hover:bg-[#f4f1ea] rounded-lg transition-colors" onClick={() => setIsSidebarOpen(true)}><Menu size={24} /></button>
            <h2 className="text-lg md:text-xl font-black uppercase tracking-tight truncate text-kopi">
              {activeTab === 'orders' && "Pesanan Masuk"}
              {activeTab === 'products' && "Stok & Etalase"}
              {activeTab === 'expenses' && "Buku Pengeluaran"}
              {activeTab === 'analytics' && "Visualisasi Data"}
            </h2>
          </div>
          <div className="text-[10px] md:text-xs font-bold text-[#8a7a6c] uppercase tracking-widest text-right">{new Date().toLocaleDateString('id-ID', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 w-full">
          {activeTab === "orders" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* HEADER ACTIONS + TOMBOL GENERATE LAPORAN */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h3 className="font-black text-kopi uppercase italic tracking-tighter">Statistik & Transaksi</h3>
                <div className="flex gap-2">
  <button 
    onClick={generateDailyReport}
    className="bg-kopi text-white px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-2"
  >
    <FileText size={16} /> PDF
  </button>

  <button 
    onClick={generateDailyImageReport}
    className="bg-amber-600 text-white px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-2"
  >
    <span>📸</span> Simpan Gambar
  </button>
</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-krem-dark flex items-center gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#fcfaf5] flex items-center justify-center text-[#d9a014] shrink-0"><TrendingUp size={20} /></div>
                  <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-widest text-[#8a7a6c] truncate">Pendapatan Hari Ini</p><h3 className="text-xl md:text-2xl font-black text-[#2e231b] truncate">Rp {totalRevenueToday.toLocaleString("id-ID")}</h3></div>
                </div>
                <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-[#e3d6c1] flex items-center gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#f0f9f4] flex items-center justify-center text-[#10b981] shrink-0"><DollarSign size={20} /></div>
                  <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-widest text-[#8a7a6c] truncate">Total Penjualan</p><h3 className="text-xl md:text-2xl font-black text-[#2e231b] truncate">Rp {totalRevenueAllTime.toLocaleString("id-ID")}</h3></div>
                </div>
                <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-krem-dark flex items-center gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#fffcf0] flex items-center justify-center text-[#f59e0b] shrink-0"><ShoppingCart size={20} /></div>
                  <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-widest text-[#8a7a6c] truncate">Transaksi Hari Ini</p><h3 className="text-xl md:text-2xl font-black text-[#2e231b] truncate">{totalOrdersToday} Pesanan</h3></div>
                </div>
              </div>

              <div className="bg-white rounded-[20px] md:rounded-[30px] shadow-sm border border-krem-dark overflow-hidden w-full">
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-200">
                    <thead className="bg-[#fcfaf5]">
                      <tr className="text-[#8a7a6c] uppercase text-[10px] tracking-widest">
                        <th className="py-4 px-6 font-bold whitespace-nowrap">Waktu & Invoice</th>
                        <th className="py-4 px-6 font-bold whitespace-nowrap">Pelanggan</th>
                        <th className="py-4 px-6 font-bold min-w-62.5">Pesanan</th>
                        <th className="py-4 px-6 font-bold whitespace-nowrap">Total (Metode)</th>
                        <th className="py-4 px-6 font-bold whitespace-nowrap">Status</th>
                        <th className="py-4 px-6 font-bold text-right whitespace-nowrap">Aksi Kasir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f4f1ea]">
                      {paginatedOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-[#fcfaf5]/50 transition-colors">
                          <td className="py-4 px-6"><div className="font-bold text-[#2e231b] text-xs">{ord.invoice_number}</div><div className="text-[10px] text-[#8a7a6c] mt-1">{new Date(ord.created_at).toLocaleString("id-ID")}</div></td>
                          <td className="py-4 px-6"><div className="font-bold text-sm text-[#2e231b]">{ord.customer_name}</div><div className="text-[10px] font-black text-kopi uppercase mt-1">{ord.order_type} • Meja {ord.table_number}</div></td>
                          <td className="py-4 px-6"><div className="flex flex-col gap-1.5">{ord.product_name.split(' | ').map((item, idx) => (<div key={idx} className="text-[11px] text-[#6b523e] font-medium bg-[#fcfaf5] px-3 py-1.5 rounded-lg border border-[#e3d6c1] whitespace-nowrap md:whitespace-normal">{item}</div>))}</div></td>
                          <td className="py-4 px-6"><div className="font-black text-[#2e231b] text-sm">Rp {ord.total_price.toLocaleString("id-ID")}</div><div className="text-[10px] font-bold text-[#8a7a6c] uppercase mt-1">{ord.payment_method}</div></td>
                          <td className="py-4 px-6"><span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${ord.status === "Paid" ? "bg-[#f0f9f4] text-[#10b981]" : ord.status === "Unpaid" ? "bg-[#fff9eb] text-[#d9a014]" : ord.status === "Completed" ? "bg-[#f4f1ea] text-[#8a7a6c]" : "bg-[#f0f7ff] text-[#3b82f6]"}`}>{ord.status}</span></td>
                          <td className="py-4 px-6 text-right"><div className="flex justify-end gap-2 flex-wrap">{ord.status === "Unpaid" && ord.payment_method === "Cash" && (<button onClick={() => handleUpdateOrderStatus(ord.id, "Paid")} className="bg-[#d9a014] text-white font-bold text-[10px] uppercase px-3 py-2 rounded-lg hover:bg-[#b88610] shadow-sm transition-all whitespace-nowrap">Terima Uang</button>)}{ (ord.status === "Paid" || ord.status === "Completed") && (<button onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}/orders/${ord.id}/receipt`, '_blank')} className="bg-kopi text-white font-bold text-[10px] uppercase px-3 py-2 rounded-lg bg-kopi-dark shadow-sm transition-all flex items-center gap-1 whitespace-nowrap"><span>🖨️</span> Cetak</button>)}{ord.status === "Paid" && (<button onClick={() => handleUpdateOrderStatus(ord.id, "Completed")} className="bg-[#10b981] text-white font-bold text-[10px] uppercase px-3 py-2 rounded-lg hover:bg-[#059669] shadow-sm transition-all whitespace-nowrap">Selesaikan</button>)}</div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 border-t border-[#f4f1ea] flex flex-col md:flex-row items-center justify-between gap-4 bg-[#fcfaf5]/50"><span className="text-xs font-bold text-[#8a7a6c]">Halaman {orderPage} dari {totalOrderPages || 1}</span><div className="flex gap-2"><button onClick={() => setOrderPage(p => Math.max(1, p - 1))} disabled={orderPage === 1} className="p-2 bg-white rounded-lg border border-[#e3d6c1] shadow-sm disabled:opacity-50 text-[#4a3320]"><ChevronLeft size={16} /></button><button onClick={() => setOrderPage(p => Math.min(totalOrderPages, p + 1))} disabled={orderPage === totalOrderPages || totalOrderPages === 0} className="p-2 bg-white rounded-lg border border-[#e3d6c1] shadow-sm disabled:opacity-50 text-[#4a3320]"><ChevronRight size={16} /></button></div></div>
              </div>
            </div>
          )}

          {activeTab === "products" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                 <div className="flex flex-col gap-3">
                   <div className="flex items-center gap-2 text-[#6b523e] font-bold text-sm"><Filter size={18} /> <span>Filter Etalase:</span></div>
                   <div className="flex flex-wrap gap-2">{CATEGORIES.map(cat => (<button key={cat} onClick={() => handleCategoryChange(cat)} className={`px-3 md:px-4 py-2 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest transition-all shadow-sm ${selectedCategory === cat ? 'bg-kopi text-white border-[#4a3320]' : 'bg-white text-[#8a7a6c] border border-[#e3d6c1] hover:border-[#4a3320] hover:text-[#4a3320]'}`}>{cat}</button>))}</div>
                 </div>
                 <button onClick={openAddProductModal} className="bg-[#10b981] hover:bg-[#059669] text-white px-5 py-3 md:py-2.5 rounded-full font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-[#10b981]/20 transition-all w-full md:w-auto"><Plus size={16} /> Tambah Menu</button>
               </div>
               <div className="bg-white rounded-[20px] md:rounded-[30px] shadow-sm border border-[#e3d6c1] overflow-hidden w-full">
                <div className="p-4 md:p-6 border-b border-[#f4f1ea] flex justify-between items-center bg-[#fcfaf5]/30"><h3 className="font-black text-[#2e231b] uppercase italic tracking-tighter text-sm md:text-base">Stok: {selectedCategory} <span className="text-[#d9a014] text-xs md:text-sm not-italic ml-1 md:ml-2">({filteredProducts.length})</span></h3></div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-150">
                    <thead className="bg-[#fcfaf5]"><tr className="text-[#8a7a6c] uppercase text-[10px] tracking-widest border-b border-[#f4f1ea]"><th className="py-4 px-6 font-bold">SKU</th><th className="py-4 px-6 font-bold">Nama Menu</th><th className="py-4 px-6 font-bold">Kategori</th><th className="py-4 px-6 font-bold">Harga</th><th className="py-4 px-6 font-bold text-center">Sisa Stok</th><th className="py-4 px-6 font-bold text-right">Tindakan</th></tr></thead>
                    <tbody className="divide-y divide-[#f4f1ea]">{paginatedProducts.length > 0 ? (paginatedProducts.map((p) => (<tr key={p.id} className="hover:bg-[#fcfaf5]/50 transition-colors"><td className="py-4 px-6 text-xs font-mono font-bold text-[#b9a58b]">{p.sku}</td><td className="py-4 px-6 font-bold text-sm text-[#2e231b]">{p.name}</td><td className="py-4 px-6 text-[10px] font-black uppercase text-[#8b523e] tracking-wider">{p.category}</td><td className="py-4 px-6 font-medium text-sm text-[#2e231b]">Rp {p.price.toLocaleString("id-ID")}</td><td className="py-4 px-6 text-center"><span className={`px-4 py-1.5 rounded-xl text-xs font-black border ${p.stock < 10 ? 'bg-[#fff1f1] text-[#d32f2f] border-[#ffe4e4]' : 'bg-[#f0f9f4] text-[#10b981] border-[#d1fae5]'}`}>{p.stock}</span></td><td className="py-4 px-6 text-right"><div className="flex justify-end gap-2"><button onClick={() => handleEditClick(p)} className="p-2 text-[#4a3320] hover:bg-[#f4e9d8] rounded-lg transition-colors border border-transparent hover:border-[#e3d6c1]"><Edit size={16} /></button><button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-[#d32f2f] hover:bg-[#fff1f1] rounded-lg transition-colors border border-transparent hover:border-[#ffe4e4]"><Trash2 size={16} /></button></div></td></tr>))) : (<tr><td colSpan={6} className="py-10 text-center text-[#8a7a6c] font-bold text-sm">Tidak ada produk di kategori ini.</td></tr>)}</tbody>
                  </table>
                </div>
                <div className="p-4 border-t border-[#f4f1ea] flex flex-col md:flex-row items-center justify-between gap-4 bg-[#fcfaf5]/50"><span className="text-xs font-bold text-[#8a7a6c]">Halaman {productPage} dari {totalProductPages || 1}</span><div className="flex gap-2"><button onClick={() => setProductPage(p => Math.max(1, p - 1))} disabled={productPage === 1} className="p-2 bg-white rounded-lg border border-[#e3d6c1] shadow-sm disabled:opacity-50 text-[#4a3320]"><ChevronLeft size={16} /></button><button onClick={() => setProductPage(p => Math.min(totalProductPages, p + 1))} disabled={productPage === totalProductPages || totalProductPages === 0} className="p-2 bg-white rounded-lg border border-[#e3d6c1] shadow-sm disabled:opacity-50 text-[#4a3320]"><ChevronRight size={16} /></button></div></div>
              </div>
            </div>
          )}

          {activeTab === "expenses" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-[#e3d6c1] flex items-center gap-4"><div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#f0f9f4] flex items-center justify-center text-[#10b981] shrink-0"><TrendingUp size={20} /></div><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-widest text-[#8a7a6c] truncate">Total Pendapatan</p><h3 className="text-xl md:text-2xl font-black text-[#2e231b] truncate">Rp {totalRevenueAllTime.toLocaleString("id-ID")}</h3></div></div>
                <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-[#e3d6c1] flex items-center gap-4"><div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#fff1f1] flex items-center justify-center text-[#d32f2f] shrink-0"><TrendingDown size={20} /></div><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-widest text-[#8a7a6c] truncate">Total Pengeluaran</p><h3 className="text-xl md:text-2xl font-black text-[#2e231b] truncate">Rp {totalExpenseAllTime.toLocaleString("id-ID")}</h3></div></div>
                <div className={`p-5 md:p-6 rounded-2xl shadow-sm border flex items-center gap-4 ${netProfit >= 0 ? 'bg-gradient-to-br from-[#4a3320] to-[#2e231b] border-[#2e231b] text-white' : 'bg-gradient-to-br from-[#d32f2f] to-[#b91c1c] border-[#b91c1c] text-white'}`}><div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0"><Wallet size={20} /></div><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-widest text-white/80 truncate">Profit Keuntungan</p><h3 className="text-xl md:text-2xl font-black text-white truncate">Rp {netProfit.toLocaleString("id-ID")}</h3></div></div>
              </div>
              <div className="flex justify-end"><button onClick={openAddExpenseModal} className="bg-[#d32f2f] hover:bg-[#b91c1c] text-white px-5 py-3 md:py-2.5 rounded-full font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-[#d32f2f]/20 transition-all w-full md:w-auto"><Plus size={16} /> Catat Pengeluaran</button></div>
              <div className="bg-white rounded-[20px] md:rounded-[30px] shadow-sm border border-[#e3d6c1] overflow-hidden w-full">
                <div className="p-4 md:p-6 border-b border-[#f4f1ea] flex justify-between items-center bg-[#fcfaf5]/30"><h3 className="font-black text-[#2e231b] uppercase italic tracking-tighter text-sm md:text-base">Riwayat Pengeluaran Toko</h3></div>
                <div className="overflow-x-auto"><table className="w-full text-left min-w-150"><thead className="bg-[#fcfaf5]"><tr className="text-[#8a7a6c] uppercase text-[10px] tracking-widest border-b border-[#f4f1ea]"><th className="py-4 px-6 font-bold">Tanggal</th><th className="py-4 px-6 font-bold">Deskripsi</th><th className="py-4 px-6 font-bold">Kategori</th><th className="py-4 px-6 font-bold">Nominal (Rp)</th><th className="py-4 px-6 font-bold text-right">Tindakan</th></tr></thead><tbody className="divide-y divide-[#f4f1ea]">{paginatedExpenses.length > 0 ? (paginatedExpenses.map((exp) => (<tr key={exp.id} className="hover:bg-[#fcfaf5]/50 transition-colors"><td className="py-4 px-6 font-bold text-xs text-[#8a7a6c]">{new Date(exp.expense_date).toLocaleDateString('id-ID')}</td><td className="py-4 px-6 font-bold text-sm text-[#2e231b]">{exp.description}</td><td className="py-4 px-6"><span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#f4f1ea] text-[#6b523e] whitespace-nowrap">{exp.category}</span></td><td className="py-4 px-6 font-black text-sm text-[#d32f2f] whitespace-nowrap">- Rp {exp.amount.toLocaleString("id-ID")}</td><td className="py-4 px-6 text-right"><div className="flex justify-end gap-2"><button onClick={() => handleEditExpenseClick(exp)} className="p-2 text-[#4a3320] hover:bg-[#f4e9d8] rounded-lg transition-colors border border-transparent hover:border-[#e3d6c1]"><Edit size={16} /></button><button onClick={() => handleDeleteExpense(exp.id)} className="p-2 text-[#d32f2f] hover:bg-[#fff1f1] rounded-lg transition-colors border border-transparent hover:border-[#ffe4e4]"><Trash2 size={16} /></button></div></td></tr>))) : (<tr><td colSpan={5} className="py-10 text-center text-[#8a7a6c] font-bold text-sm">Belum ada catatan pengeluaran.</td></tr>)}</tbody></table></div>
                <div className="p-4 border-t border-[#f4f1ea] flex flex-col md:flex-row items-center justify-between gap-4 bg-[#fcfaf5]/50"><span className="text-xs font-bold text-[#8a7a6c]">Halaman {expensePage} dari {totalExpensePages || 1}</span><div className="flex gap-2"><button onClick={() => setExpensePage(p => Math.max(1, p - 1))} disabled={expensePage === 1} className="p-2 bg-white rounded-lg border border-[#e3d6c1] shadow-sm disabled:opacity-50 text-[#4a3320]"><ChevronLeft size={16} /></button><button onClick={() => setExpensePage(p => Math.min(totalOrderPages, p + 1))} disabled={expensePage === totalExpensePages || totalExpensePages === 0} className="p-2 bg-white rounded-lg border border-[#e3d6c1] shadow-sm disabled:opacity-50 text-[#4a3320]"><ChevronRight size={16} /></button></div></div>
              </div>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 w-full">
              <div className="bg-white p-4 md:p-8 rounded-[20px] md:rounded-[30px] shadow-sm border border-[#e3d6c1] w-full overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6"><div><h3 className="text-lg md:text-xl font-black uppercase italic tracking-tighter text-[#2e231b]">Distribusi Stok {stockCategory !== "Semua" && <span className="text-[#8b523e] not-italic">- {stockCategory}</span>}</h3><p className="text-[10px] font-bold text-[#8a7a6c] uppercase tracking-widest mt-1">Jumlah unit tersedia per produk</p></div><div className="flex flex-wrap gap-2">{CATEGORIES.map(cat => (<button key={`bar-${cat}`} onClick={() => setStockCategory(cat)} className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${stockCategory === cat ? 'bg-kopi text-white' : 'bg-[#fcfaf5] text-[#8a7a6c] hover:bg-[#f4e9d8] hover:text-[#4a3320]'}`}>{cat}</button>))}</div></div>
                <div className="h-64 md:h-96 w-full -ml-4 md:ml-0"><ResponsiveContainer width="100%" height="100%"><BarChart data={stockByProductData} margin={{ top: 10, right: 10, left: -20, bottom: 60 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e3d6c1" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontBold: 800, fill: '#6b523e' }} interval={0} angle={-45} textAnchor="end" /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontBold: 800, fill: '#6b523e' }} /><Tooltip cursor={{ fill: '#fcfaf5' }} contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} /><Bar dataKey="Stok" fill="#4a3320" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
              </div>
              <div className="bg-white p-4 md:p-8 rounded-[20px] md:rounded-[30px] shadow-sm border border-[#e3d6c1] flex flex-col items-center w-full"><div className="flex flex-col md:flex-row md:items-start justify-between w-full gap-4 mb-6"><div><h3 className="text-lg md:text-xl font-black uppercase italic tracking-tighter text-[#2e231b]">Top 6 Menu Terlaris {pieCategory !== "Semua" && <span className="text-[#8b523e] not-italic">- {pieCategory}</span>}</h3><p className="text-[10px] font-bold text-[#8a7a6c] uppercase tracking-widest mt-1">Berdasarkan total porsi yang terjual</p></div><div className="flex flex-wrap gap-2">{CATEGORIES.map(cat => (<button key={`pie-${cat}`} onClick={() => setPieCategory(cat)} className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${pieCategory === cat ? 'bg-kopi text-white' : 'bg-[#fcfaf5] text-[#8a7a6c] hover:bg-[#f4e9d8] hover:text-[#4a3320]'}`}>{cat}</button>))}</div></div><div className="h-72 md:h-96 w-full max-w-2xl flex justify-center"><ResponsiveContainer width="100%" height="100%"><PieChart><Tooltip formatter={(value: any) => [`${value} Porsi`, 'Terjual']} contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} /><Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', lineHeight: '20px', color: '#4a3320' }} /><Pie data={pieChartData} cx="45%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">{pieChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />))}</Pie></PieChart></ResponsiveContainer></div></div>
              <div className="bg-white p-4 md:p-8 rounded-[20px] md:rounded-[30px] shadow-sm border border-[#e3d6c1] w-full overflow-hidden"><div className="mb-6"><h3 className="text-lg md:text-xl font-black uppercase italic tracking-tighter text-[#2e231b]">Arus Kas 7 Hari Terakhir</h3><p className="text-[10px] font-bold text-[#8a7a6c] uppercase tracking-widest mt-1">Laporan harian Warkop Pulang</p></div><div className="h-64 md:h-80 w-full -ml-4 md:ml-0"><ResponsiveContainer width="100%" height="100%"><LineChart data={revenueTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e3d6c1" /><XAxis dataKey="tanggal" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontBold: 800, fill: '#6b523e' }} /><YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `Rp ${(val/1000)}k`} tick={{ fontSize: 9, fontBold: 800, fill: '#6b523e' }} /><Tooltip formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, '']} contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} /><Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} /><Line type="monotone" dataKey="Pendapatan" stroke="#10b981" strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 5 }} /><Line type="monotone" dataKey="Pengeluaran" stroke="#d32f2f" strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 5 }} /></LineChart></ResponsiveContainer></div></div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL FORM CRUD PRODUK (TEMA KOPI) */}
      <AnimatePresence>
        {isProductModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-[#2e231b]/60 backdrop-blur-sm p-4"><motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-[35px] shadow-2xl w-full max-w-lg overflow-hidden border border-[#e3d6c1] relative max-h-[90vh] overflow-y-auto"><div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#4a3320] via-[#d9a014] to-[#4a3320]" /><div className="p-6 md:p-8"><div className="flex justify-between items-center mb-6"><h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter text-[#2e231b]">{editingProduct ? "Ubah Menu" : "Menu Baru"}</h3><button onClick={() => setIsProductModalOpen(false)} className="text-[#8a7a6c] hover:text-[#d32f2f] font-black text-xl">✕</button></div><form onSubmit={handleSaveProduct} className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-[10px] font-black uppercase tracking-widest text-[#8a7a6c] mb-1 ml-2">SKU Kode</label><input type="text" name="sku" value={productForm.sku} onChange={handleProductFormChange} required className="w-full bg-[#fcfaf5] border border-transparent focus:border-[#4a3320] rounded-2xl p-3 md:p-4 text-sm font-bold outline-none" placeholder="Contoh: IDM-001" /></div><div><label className="block text-[10px] font-black uppercase tracking-widest text-[#8a7a6c] mb-1 ml-2">Stok (Porsi)</label><input type="number" name="stock" value={productForm.stock} onChange={handleProductFormChange} required className="w-full bg-[#fcfaf5] border border-transparent focus:border-[#4a3320] rounded-2xl p-3 md:p-4 text-sm font-black text-[#4a3320] outline-none" min="0" /></div></div><div><label className="block text-[10px] font-black uppercase tracking-widest text-[#8a7a6c] mb-1 ml-2">Nama Menu</label><input type="text" name="name" value={productForm.name} onChange={handleProductFormChange} required className="w-full bg-[#fcfaf5] border border-transparent focus:border-[#4a3320] rounded-2xl p-3 md:p-4 text-sm font-bold outline-none" placeholder="Contoh: Indomie Telur" /></div><div><label className="block text-[10px] font-black uppercase tracking-widest text-[#8a7a6c] mb-1 ml-2">Kategori</label><select name="category" value={productForm.category} onChange={handleProductFormChange} className="w-full bg-[#fcfaf5] border border-transparent focus:border-[#4a3320] rounded-2xl p-3 md:p-4 text-sm font-bold outline-none cursor-pointer appearance-none text-[#2e231b]">{FORM_CATEGORIES.map(cat => (<option key={cat} value={cat}>{cat}</option>))}</select></div><div><label className="block text-[10px] font-black uppercase tracking-widest text-[#8a7a6c] mb-1 ml-2">Harga (Rp)</label><input type="number" name="price" value={productForm.price} onChange={handleProductFormChange} required className="w-full bg-[#fcfaf5] border border-transparent focus:border-[#4a3320] rounded-2xl p-3 md:p-4 text-sm font-black text-[#10b981] outline-none" min="0" /></div><div className="pt-4"><button type="submit" className="w-full bg-kopi text-white font-black py-3 md:py-4 rounded-3xl bg-kopi-dark shadow-xl shadow-[#4a3320]/20 uppercase text-xs tracking-widest transition-all">{editingProduct ? "Simpan Perubahan" : "Tambahkan Menu"}</button></div></form></div></motion.div></motion.div>
        )}
      </AnimatePresence>

      {/* MODAL FORM CRUD PENGELUARAN (TEMA KOPI/RED) */}
      <AnimatePresence>
        {isExpenseModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-[#2e231b]/60 backdrop-blur-sm p-4"><motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-[35px] shadow-2xl w-full max-w-lg overflow-hidden border border-krem-dark relative max-h-[90vh] overflow-y-auto"><div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#d32f2f] via-kopi to-[#d32f2f]" /><div className="p-6 md:p-8"><div className="flex justify-between items-center mb-6"><h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter text-[#2e231b]">{editingExpense ? "Ubah Catatan" : "Catat Pengeluaran"}</h3><button onClick={() => setIsExpenseModalOpen(false)} className="text-[#8a7a6c] hover:text-[#d32f2f] font-black text-xl">✕</button></div><form onSubmit={handleSaveExpense} className="space-y-4"><div><label className="block text-[10px] font-black uppercase tracking-widest text-[#8a7a6c] mb-1 ml-2">Tanggal Pengeluaran</label><input type="date" name="expense_date" value={expenseForm.expense_date} onChange={handleExpenseFormChange} required className="w-full bg-[#fcfaf5] border border-transparent focus:border-[#d32f2f] rounded-2xl p-3 md:p-4 text-sm font-bold outline-none text-[#2e231b]" /></div><div><label className="block text-[10px] font-black uppercase tracking-widest text-[#8a7a6c] mb-1 ml-2">Deskripsi (Untuk Apa?)</label><input type="text" name="description" value={expenseForm.description} onChange={handleExpenseFormChange} required className="w-full bg-[#fcfaf5] border border-transparent focus:border-[#d32f2f] rounded-2xl p-3 md:p-4 text-sm font-bold outline-none" placeholder="Contoh: Beli Telur 2 Kg, Bayar Listrik" /></div><div><label className="block text-[10px] font-black uppercase tracking-widest text-[#8a7a6c] mb-1 ml-2">Kategori Pengeluaran</label><select name="category" value={expenseForm.category} onChange={handleExpenseFormChange} className="w-full bg-[#fcfaf5] border border-transparent focus:border-[#d32f2f] rounded-2xl p-3 md:p-4 text-sm font-bold outline-none cursor-pointer appearance-none text-[#2e231b]">{EXPENSE_CATEGORIES.map(cat => (<option key={cat} value={cat}>{cat}</option>))}</select></div><div><label className="block text-[10px] font-black uppercase tracking-widest text-[#8a7a6c] mb-1 ml-2">Nominal Uang Keluar (Rp)</label><input type="number" name="amount" value={expenseForm.amount} onChange={handleExpenseFormChange} required className="w-full bg-[#fcfaf5] border border-transparent focus:border-[#d32f2f] rounded-2xl p-3 md:p-4 text-sm font-black text-[#d32f2f] outline-none" min="1" /></div><div className="pt-4"><button type="submit" className="w-full bg-[#d32f2f] text-white font-black py-3 md:py-4 rounded-3xl hover:bg-[#b91c1c] shadow-xl shadow-[#d32f2f]/20 uppercase text-xs tracking-widest transition-all">{editingExpense ? "Simpan Perubahan" : "Catat Uang Keluar"}</button></div></form></div></motion.div></motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}