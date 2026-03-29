"use client";
import { motion } from "framer-motion";
import Image from "next/image"; // 1. Tambahkan import Image
import Link from "next/link";

export default function Navbar() {
  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 h-20 flex justify-between items-center px-10 bg-kopi-light/10 backdrop-blur-lg border-b border-white/20 z-50"
    >
      {/* 2. Tambahkan Logo di sini */}
      <div className="flex items-center gap-3">
        <Image 
          src="/images/logo-warpulz.png" // Sesuai dengan folder public/images Anda
          alt="Logo Warpulz" 
          width={40} 
          height={40} 
          className="w-10 h-10 object-contain"
        />
        <div className="text-2xl font-black tracking-tighter text-kopi href=#home">WARPULZ</div>
      </div>

      <div className="flex gap-8 font-medium items-center">
        <Link href="#shop" className="text-kopi-dark hover:text-white transition-all  tracking-tighter">MENU</Link>
        <Link href="/admin" className="bg-krem text-kopi-dark px-6 py-2 rounded-full hover:bg-krem-dark transition-all shadow-lg shadow-kopi/20">
          Admin Only
        </Link>
      </div>
    </motion.nav>
  );
}