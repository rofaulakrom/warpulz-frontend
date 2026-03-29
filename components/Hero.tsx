"use client";
import { motion } from "framer-motion";
import Image from "next/image"; // 1. Impor komponen Image Next.js

export default function Hero() {
  return (
    <section id="home" className="relative h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden bg-linear-to-b from-krem-dark to-white">
      
      {/* --- LAYER 1: EFEK BACKGROUND ASLI (TETAP DIPERTAHANKAN) --- */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
        transition={{ duration: 20, repeat: Infinity }}
        className="absolute -top-20 -right-20 w-96 h-96 bg-krem rounded-full blur-3xl opacity-50 z-0" // Tambahkan z-0
      />
      
      {/* --- LAYER 2: GAMBAR PNG TRANSPARAN BARU (Z-INDEX 5) --- */}
      {/* Posisi gambar ini absolut, sedikit di bawah dan kiri, pointer-events-none agar tidak mengganggu klik */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 0.25, x: 0 }} // Gunakan opacity rendah (0.2 - 0.3) agar gradasi background tetap terlihat
        transition={{ duration: 1.5, delay: 0.8 }}
        className="absolute h-auto pointer-events-none z-5"
      >
        <Image 
          src="/images/bg-warpulz.png" // Ganti dengan path gambar PNG transparan Anda
          alt="Warkop Pulang Illustration"
          width={1920} 
          height={1080} 
          priority
          className="object-contain" // Memastikan gambar tidak terpotong
        />
      </motion.div>

      {/* --- LAYER 3: KONTEN TEKS (UBAH Z-INDEX KE 10 AGAR DI DEPAN GAMBAR) --- */}
      <motion.h2 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        // Tambahkan 'relative z-10' di semua elemen konten
        className="relative z-10 text-7xl md:text-9xl font-black mb-6 leading-none text-kopi-dark"
      >
        WARKOP PULANG <br/> <span className="text-kopi-light">"WARPULZ"</span>
      </motion.h2>

      <motion.p 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="relative z-10 text-xl text-kopi-dark max-w-xl mb-10"
      >
        Warkop Pulang, the place that can make u feel like at home.
      </motion.p>

      {/* Href di tombol sudah benar mengarah ke ID #shop */}
      <motion.a 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        href="#shop"
        className="relative z-10 bg-kopi text-white px-10 py-4 rounded-full font-bold text-lg shadow-2xl"
      >
        Pesan Sekarang
      </motion.a>
    </section>
  );
}