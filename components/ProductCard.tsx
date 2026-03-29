"use client";
import { Product } from "@/types"; // Import tipe data
import { motion } from "framer-motion";

interface ProductProps {
  item: Product; // Gunakan tipe Product
  onBuy: (product: Product) => void; // Ganti 'any' dengan 'Product'
}

export default function ProductCard({ item, onBuy }: ProductProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -10 }}
      className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-2xl transition-all duration-300 group"
    >
      <div className="h-48 bg-gray-50 rounded-2xl mb-4 flex items-center justify-center relative overflow-hidden">
        <span className="text-6xl group-hover:scale-110 transition-transform duration-500">📦</span>
        <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-colors" />
      </div>

      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-bold text-xl text-gray-900">{item.name}</h4>
          <p className="text-sm text-gray-400">{item.category}</p>
        </div>
      </div>

      <div className="flex justify-between items-center mt-6">
        <div>
          <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Harga</p>
          <p className="text-xl font-black text-kopi-dark">
            Rp {item.price.toLocaleString("id-ID")}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onBuy(item)}
          className="bg-kopi-light text-white p-4 rounded-2xl shadow-lg hover:bg-kopi-dark transition-colors"
        >
          🛒
        </motion.button>
      </div>
    </motion.div>
  );
}