import Link from "next/link";
import { Coffee, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#2B1D18] text-[#FAF5EC] border-t border-[#3D2B24]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#C58B5B] flex items-center justify-center text-[#2B1D18]">
                <Coffee className="w-5 h-5 text-[#FAF5EC]" />
              </div>
              <span className="font-serif text-xl font-bold tracking-tight text-[#FAF5EC]">
                Aura<span className="text-[#C58B5B]">.</span>
              </span>
            </div>
            <p className="text-sm text-[#FAF5EC]/70 leading-relaxed">
              The premium contactless ordering and kitchen management system built for high-volume cafes, specialty coffee roasters, and modern restaurants.
            </p>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-wider font-semibold text-[#C58B5B] mb-4">
              Product
            </h4>
            <ul className="space-y-2.5 text-sm text-[#FAF5EC]/70">
              <li>
                <Link href="/menu/aura-cafe?table=T01" className="hover:text-[#FAF5EC] transition-colors">
                  Customer QR Menu
                </Link>
              </li>
              <li>
                <Link href="/dashboard/orders" className="hover:text-[#FAF5EC] transition-colors">
                  Kitchen Live Board
                </Link>
              </li>
              <li>
                <Link href="/dashboard/tables" className="hover:text-[#FAF5EC] transition-colors">
                  QR Tent Cards & Printing
                </Link>
              </li>
              <li>
                <Link href="/dashboard/analytics" className="hover:text-[#FAF5EC] transition-colors">
                  Sales Analytics
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-wider font-semibold text-[#C58B5B] mb-4">
              Demo Access
            </h4>
            <ul className="space-y-2.5 text-sm text-[#FAF5EC]/70">
              <li>
                <Link href="/login" className="hover:text-[#FAF5EC] transition-colors">
                  Manager Dashboard Login
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-[#FAF5EC] transition-colors">
                  Super Admin SaaS Portal
                </Link>
              </li>
              <li>
                <Link href="/menu/bella-cucina?table=B01" className="hover:text-[#FAF5EC] transition-colors">
                  Bella Cucina Trattoria Menu
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-[#FAF5EC] transition-colors">
                  Register Your Cafe
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-wider font-semibold text-[#C58B5B] mb-4">
              Architecture
            </h4>
            <p className="text-sm text-[#FAF5EC]/70 leading-relaxed mb-3">
              Built with Next.js 16 App Router, TypeScript, Prisma ORM, Tailwind CSS, and Web Audio API real-time notifications.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#3D2B24] text-xs text-[#FAF5EC]/90 border border-[#C58B5B]/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Multi-tenant Production Ready
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#3D2B24] flex flex-col sm:flex-row items-center justify-between text-xs text-[#FAF5EC]/60 gap-4">
          <p>© {new Date().getFullYear()} Aura Cafe SaaS. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Crafted with <Heart className="w-3.5 h-3.5 text-[#C58B5B] fill-current" /> for world-class cafes & coffee roasteries.
          </p>
        </div>
      </div>
    </footer>
  );
}
