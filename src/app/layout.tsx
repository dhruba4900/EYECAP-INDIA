import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import SiteBranding from "@/components/layout/SiteBranding";

export const metadata: Metadata = {
  title: "EYECAP | Haute Optique & Engineering",
  description: "Bespoke Japanese Beta-Titanium Eyewear, Polarized Sun Optics, and High-Performance BlueBlock Digital Glasses.",
  keywords: ["luxury glasses", "titanium eyewear", "blue light glasses", "polarized sunglasses", "smart audio glasses"],
  icons: {
    icon: "/favicon.svg",
    apple: "/eyecap-logo.png",
  },
  openGraph: {
    title: "EYECAP — Haute Optique & Engineering",
    description: "Architectural eyewear engineered with Japanese Beta-Titanium and precision optics.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-eyecap-dark text-eyecap-light antialiased min-h-screen flex flex-col selection:bg-eyecap-cyan selection:text-black">
        <AuthProvider>
          <CartProvider>
            <SiteBranding />
            <Suspense fallback={null}>
              <Navbar />
            </Suspense>
            <main className="flex-1">{children}</main>
            <CartDrawer />
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
