import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "WARKOP PULANG (WARPULZ)",
  description: "Kopi, Teman, dan Cerita",
  icons: {
    icon: "/images/logo-warpulz-bg.png", // Sesuaikan dengan folder tempat Anda menaruh file
    shortcut: "/images/logo-warpulz-bg.png",
    apple: "/images/logo-warpulz-bg.png",
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}