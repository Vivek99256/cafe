"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  QrCode,
  BellRing,
  Printer,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Coffee,
  Smartphone,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

export default function HomePage() {
  const [selectedDemoRole, setSelectedDemoRole] = useState<string>("owner");
  const [demoLoading, setDemoLoading] = useState(false);

  const handleQuickDemoLogin = async (role: string) => {
    setDemoLoading(true);
    try {
      const res = await fetch("/api/auth/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (data.success && data.redirectTo) {
        window.location.href = data.redirectTo;
      }
    } catch (err) {
      console.error("Demo login error:", err);
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF5EC] text-[#24211F]">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-[#C58B5B]/10 to-transparent blur-3xl pointer-events-none rounded-full -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Heading and CTAs */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EADBCE]/60 border border-[#C58B5B]/30 text-xs font-semibold text-[#2B1D18]">
                <Sparkles className="w-3.5 h-3.5 text-[#C58B5B]" />
                Next-Gen QR Code Cafe Operating System
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#2B1D18] leading-[1.12]">
                Elevate your cafe with <span className="italic text-[#C58B5B]">effortless</span> contactless ordering.
              </h1>

              <p className="text-lg text-[#24211F]/80 max-w-xl leading-relaxed">
                Empower your guests to scan, browse bespoke artisanal menus, and place orders directly from their tables. Boost table turnaround by 35% and free baristas to focus on the craft.
              </p>

              {/* Main Actions */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/menu/aura-cafe?table=T01"
                  target="_blank"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#2B1D18] text-[#FAF5EC] font-semibold hover:bg-[#3D2B24] transition-all shadow-md hover:shadow-lg group"
                >
                  <Smartphone className="w-5 h-5 text-[#C58B5B]" />
                  <span>Test Customer QR Menu</span>
                  <ArrowRight className="w-4 h-4 text-[#C58B5B] group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#FFFDF9] border border-[#E6DCCE] text-[#2B1D18] font-semibold hover:bg-[#FAF5EC] transition-all shadow-sm hover:border-[#C58B5B]"
                >
                  <span>Manager Live Board</span>
                  <ExternalLink className="w-4 h-4 text-[#75856B]" />
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-6 border-t border-[#E6DCCE]/80 flex flex-wrap items-center gap-6 text-xs text-[#24211F]/70">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#75856B]" />
                  <span>No mobile app download needed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#75856B]" />
                  <span>Real-time kitchen display</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#75856B]" />
                  <span>Configurable taxes & ₹ INR support</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Glow backdrop */}
                <div className="absolute inset-0 bg-[#2B1D18]/5 rounded-3xl transform rotate-1 scale-105" />

                <div className="relative bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] shadow-xl overflow-hidden p-6">
                  {/* Mock Phone Frame Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-[#E6DCCE]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden relative border border-[#E6DCCE]">
                        <Image
                          src="https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=250&q=80"
                          alt="Aura Logo"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-sm text-[#2B1D18]">
                          Aura Specialty Roastery
                        </h4>
                        <div className="flex items-center gap-1 text-[11px] text-[#75856B] font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>Table T01 • Garden Window</span>
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-[#FAF5EC] border border-[#E6DCCE] text-[11px] font-semibold text-[#C58B5B]">
                      Open Now
                    </span>
                  </div>

                  {/* Featured Item Preview */}
                  <div className="mt-4 space-y-3">
                    <div className="relative h-44 rounded-xl overflow-hidden">
                      <Image
                        src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80"
                        alt="Spanish Cortado Velvet"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-2.5 left-2.5 px-2 py-1 rounded bg-[#2B1D18]/85 text-[#FAF5EC] text-[10px] uppercase font-bold tracking-wider">
                        ★ Barista Pick
                      </div>
                    </div>

                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="font-semibold text-sm text-[#2B1D18]">
                          Spanish Cortado Velvet
                        </h5>
                        <p className="text-xs text-[#24211F]/70 line-clamp-1">
                          Double ristretto of Ethiopian Yirgacheffe with textured silky milk
                        </p>
                      </div>
                      <span className="font-bold text-sm text-[#2B1D18]">₹240</span>
                    </div>

                    {/* Floating simulated order tag */}
                    <div className="p-3 bg-[#FAF5EC] rounded-xl border border-[#E6DCCE] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-600 animate-ping"></div>
                        <span className="font-medium text-[#2B1D18]">
                          ORD-84191 • In Kitchen Prep
                        </span>
                      </div>
                      <span className="text-[#75856B] font-semibold">~4 mins</span>
                    </div>
                  </div>

                  {/* Floating Action Badge */}
                  <Link
                    href="/menu/aura-cafe?table=T01"
                    target="_blank"
                    className="mt-4 w-full py-2.5 bg-[#2B1D18] hover:bg-[#3D2B24] text-[#FAF5EC] rounded-xl text-center text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Launch Live Interactive Menu</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#C58B5B]" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 1-CLICK INSTANT DEMO LAUNCHER SECTION */}
      <section id="demo" className="py-16 bg-[#2B1D18] text-[#FAF5EC] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3D2B24] border border-[#C58B5B]/30 text-xs font-semibold text-[#C58B5B] mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Instant Sandbox Access
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
              Test-Drive Every Perspective
            </h2>
            <p className="mt-3 text-sm text-[#FAF5EC]/70">
              Select any role below to immediately test the platform with complete pre-seeded data, real menu items, and active kitchen tickets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Customer Phone Experience */}
            <div className="bg-[#3D2B24]/70 border border-[#C58B5B]/20 rounded-2xl p-6 flex flex-col justify-between hover:border-[#C58B5B]/60 transition-all">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#2B1D18] flex items-center justify-center text-[#C58B5B] border border-[#C58B5B]/30">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl font-bold">1. Customer QR Menu</h3>
                <p className="text-xs text-[#FAF5EC]/70 leading-relaxed">
                  Experience table T01 from a guest&apos;s phone. Customize espresso sizes, select oat milk, add notes, and watch your order submit with zero app download.
                </p>
                <div className="text-[11px] text-[#75856B] bg-[#2B1D18]/60 p-2.5 rounded-lg border border-[#FAF5EC]/10">
                  ✓ Table T01 detected automatically <br />
                  ✓ Add-ons, variants & allergy filters
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#FAF5EC]/10">
                <Link
                  href="/menu/aura-cafe?table=T01"
                  target="_blank"
                  className="w-full py-2.5 bg-[#C58B5B] hover:bg-[#B47847] text-[#2B1D18] font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Open Customer Menu</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Card 2: Cafe Manager & Kitchen Board */}
            <div className="bg-[#3D2B24]/70 border border-[#C58B5B]/50 rounded-2xl p-6 flex flex-col justify-between relative shadow-lg">
              <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-[#C58B5B] text-[#2B1D18] text-[10px] font-bold uppercase tracking-wider">
                Recommended
              </div>

              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#2B1D18] flex items-center justify-center text-[#C58B5B] border border-[#C58B5B]/30">
                  <BellRing className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl font-bold">2. Cafe Manager Dashboard</h3>
                <p className="text-xs text-[#FAF5EC]/70 leading-relaxed">
                  Access the live order manager with Kanban and Table views. Listen to audio order alerts, advance order statuses, manage tables, and generate QR tent cards.
                </p>
                <div className="text-[11px] text-[#75856B] bg-[#2B1D18]/60 p-2.5 rounded-lg border border-[#FAF5EC]/10">
                  ✓ Live audio order notifications <br />
                  ✓ Printable KOT and Receipts
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#FAF5EC]/10 space-y-2">
                <button
                  onClick={() => handleQuickDemoLogin("CAFE_OWNER")}
                  disabled={demoLoading}
                  className="w-full py-2.5 bg-[#FAF5EC] hover:bg-white text-[#2B1D18] font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <span>{demoLoading ? "Logging in..." : "1-Click Login as Cafe Owner"}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#C58B5B]" />
                </button>
                <div className="text-center text-[10px] text-[#FAF5EC]/50">
                  Credentials: owner@auracafe.com / Owner@1234
                </div>
              </div>
            </div>

            {/* Card 3: SaaS Super Admin */}
            <div className="bg-[#3D2B24]/70 border border-[#C58B5B]/20 rounded-2xl p-6 flex flex-col justify-between hover:border-[#C58B5B]/60 transition-all">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#2B1D18] flex items-center justify-center text-[#C58B5B] border border-[#C58B5B]/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl font-bold">3. SaaS Super Admin</h3>
                <p className="text-xs text-[#FAF5EC]/70 leading-relaxed">
                  Platform administration hub to inspect registered cafes, manage subscriptions, monitor platform-wide GMV, and toggle cafe activation status.
                </p>
                <div className="text-[11px] text-[#75856B] bg-[#2B1D18]/60 p-2.5 rounded-lg border border-[#FAF5EC]/10">
                  ✓ Platform MRR & GMV tracking <br />
                  ✓ Multi-cafe tenant governance
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#FAF5EC]/10 space-y-2">
                <button
                  onClick={() => handleQuickDemoLogin("SUPER_ADMIN")}
                  disabled={demoLoading}
                  className="w-full py-2.5 bg-[#FAF5EC]/10 hover:bg-[#FAF5EC]/20 text-[#FAF5EC] font-semibold border border-[#FAF5EC]/20 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <span>1-Click Super Admin Login</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#C58B5B]" />
                </button>
                <div className="text-center text-[10px] text-[#FAF5EC]/50">
                  Credentials: admin@cafesaas.com / Admin@1234
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES GRID */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EADBCE]/60 text-xs font-semibold text-[#2B1D18] mb-3">
            Designed for Hospitality Excellence
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#2B1D18]">
            Engineered to streamline every order from table to kitchen.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-[#FFFDF9] rounded-2xl p-8 border border-[#E6DCCE] hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#FAF5EC] border border-[#E6DCCE] flex items-center justify-center text-[#2B1D18]">
              <QrCode className="w-6 h-6 text-[#C58B5B]" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#2B1D18]">
              Anti-Tamper QR Code Tables
            </h3>
            <p className="text-sm text-[#24211F]/80 leading-relaxed">
              Every table generates a cryptographically signed QR code with a secure token. Customers cannot tamper with URL parameters to order to unauthorized tables.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-[#FFFDF9] rounded-2xl p-8 border border-[#E6DCCE] hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#FAF5EC] border border-[#E6DCCE] flex items-center justify-center text-[#2B1D18]">
              <BellRing className="w-6 h-6 text-[#C58B5B]" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#2B1D18]">
              Live Kitchen Display & Chime
            </h3>
            <p className="text-sm text-[#24211F]/80 leading-relaxed">
              Incoming orders pop up automatically on the manager order board accompanied by an authentic acoustic dual-tone bell so chefs never miss a ticket.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-[#FFFDF9] rounded-2xl p-8 border border-[#E6DCCE] hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#FAF5EC] border border-[#E6DCCE] flex items-center justify-center text-[#2B1D18]">
              <Printer className="w-6 h-6 text-[#C58B5B]" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#2B1D18]">
              Printable Tent Cards & KOT
            </h3>
            <p className="text-sm text-[#24211F]/80 leading-relaxed">
              Generate attractive printable table tent cards with cafe branding ready for laser printing. Print instant Kitchen Order Tickets (KOT) and customer receipts.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-[#FFFDF9] rounded-2xl p-8 border border-[#E6DCCE] hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#FAF5EC] border border-[#E6DCCE] flex items-center justify-center text-[#2B1D18]">
              <Coffee className="w-6 h-6 text-[#C58B5B]" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#2B1D18]">
              Variants, Add-ons & Notes
            </h3>
            <p className="text-sm text-[#24211F]/80 leading-relaxed">
              Support complex coffee configurations: milk options (oat, almond), syrup shots, temperature controls, egg styles, and customer instructions.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-[#FFFDF9] rounded-2xl p-8 border border-[#E6DCCE] hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#FAF5EC] border border-[#E6DCCE] flex items-center justify-center text-[#2B1D18]">
              <TrendingUp className="w-6 h-6 text-[#C58B5B]" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#2B1D18]">
              Real Database Analytics
            </h3>
            <p className="text-sm text-[#24211F]/80 leading-relaxed">
              Track daily sales, average order value, top performing drinks, and hourly order trends. Export complete transaction logs to CSV with one click.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-[#FFFDF9] rounded-2xl p-8 border border-[#E6DCCE] hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#FAF5EC] border border-[#E6DCCE] flex items-center justify-center text-[#2B1D18]">
              <ShieldCheck className="w-6 h-6 text-[#C58B5B]" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#2B1D18]">
              Strict Multi-Tenant Isolation
            </h3>
            <p className="text-sm text-[#24211F]/80 leading-relaxed">
              Role-based access control (Super Admin, Owner, Manager, Kitchen). Every query enforces tenant boundary checks at the database layer.
            </p>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-20 bg-[#F2E9DB]/50 border-t border-[#E6DCCE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EADBCE] text-xs font-semibold text-[#2B1D18] mb-3">
              Simple, Predictable SaaS Pricing
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#2B1D18]">
              Fair plans for independent cafes to growing chains.
            </h2>
            <p className="mt-3 text-sm text-[#24211F]/70">
              No hidden commission fees per order. Keep 100% of your revenue.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Plan 1 */}
            <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-8 flex flex-col justify-between shadow-sm">
              <div className="space-y-4">
                <h3 className="font-serif text-xl font-bold text-[#2B1D18]">Starter Barista</h3>
                <p className="text-xs text-[#24211F]/70">
                  Ideal for boutique espresso kiosks, specialty coffee stands, and intimate bakeries.
                </p>
                <div className="pt-2">
                  <span className="text-4xl font-bold text-[#2B1D18]">₹1,499</span>
                  <span className="text-xs text-[#24211F]/60"> / month</span>
                </div>
                <ul className="space-y-2.5 text-xs text-[#24211F]/80 pt-4 border-t border-[#E6DCCE]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#75856B]" />
                    <span>Up to 12 QR code tables</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#75856B]" />
                    <span>Digital contactless mobile menu</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#75856B]" />
                    <span>Kitchen live order board</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#75856B]" />
                    <span>Basic sales analytics</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8">
                <Link
                  href="/register"
                  className="w-full block text-center py-2.5 px-4 rounded-xl border border-[#2B1D18] text-[#2B1D18] font-semibold text-xs hover:bg-[#2B1D18] hover:text-[#FAF5EC] transition-colors"
                >
                  Get Started
                </Link>
              </div>
            </div>

            {/* Plan 2: Pro Roastery */}
            <div className="bg-[#2B1D18] text-[#FAF5EC] rounded-2xl border border-[#C58B5B] p-8 flex flex-col justify-between shadow-xl relative scale-105">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#C58B5B] text-[#2B1D18] text-[11px] font-bold uppercase tracking-wider">
                Most Popular for Cafes
              </div>
              <div className="space-y-4">
                <h3 className="font-serif text-xl font-bold">Pro Roastery & Bistro</h3>
                <p className="text-xs text-[#FAF5EC]/70">
                  Engineered for full-service cafes, brunch roasteries, and high-volume dining rooms.
                </p>
                <div className="pt-2">
                  <span className="text-4xl font-bold text-[#FAF5EC]">₹2,999</span>
                  <span className="text-xs text-[#FAF5EC]/60"> / month</span>
                </div>
                <ul className="space-y-2.5 text-xs text-[#FAF5EC]/90 pt-4 border-t border-[#3D2B24]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#C58B5B]" />
                    <span>Up to 40 QR code tables</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#C58B5B]" />
                    <span>Real-time audio alert order manager</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#C58B5B]" />
                    <span>Product variants & unlimited add-ons</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#C58B5B]" />
                    <span>Printable table tent cards with logo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#C58B5B]" />
                    <span>CSV order exports & item rankings</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8">
                <Link
                  href="/register"
                  className="w-full block text-center py-3 px-4 rounded-xl bg-[#C58B5B] hover:bg-[#B47847] text-[#2B1D18] font-bold text-xs transition-colors shadow-md"
                >
                  Start 14-Day Free Trial
                </Link>
              </div>
            </div>

            {/* Plan 3: Enterprise */}
            <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-8 flex flex-col justify-between shadow-sm">
              <div className="space-y-4">
                <h3 className="font-serif text-xl font-bold text-[#2B1D18]">Enterprise Outlets</h3>
                <p className="text-xs text-[#24211F]/70">
                  Custom deployment for multi-city restaurant brands, franchises, and luxury hotel bistros.
                </p>
                <div className="pt-2">
                  <span className="text-4xl font-bold text-[#2B1D18]">₹6,999</span>
                  <span className="text-xs text-[#24211F]/60"> / month</span>
                </div>
                <ul className="space-y-2.5 text-xs text-[#24211F]/80 pt-4 border-t border-[#E6DCCE]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#75856B]" />
                    <span>Unlimited tables & outlets</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#75856B]" />
                    <span>Custom domain support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#75856B]" />
                    <span>Dedicated account manager</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#75856B]" />
                    <span>Direct POS hardware integration</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8">
                <Link
                  href="/register"
                  className="w-full block text-center py-2.5 px-4 rounded-xl border border-[#2B1D18] text-[#2B1D18] font-semibold text-xs hover:bg-[#2B1D18] hover:text-[#FAF5EC] transition-colors"
                >
                  Contact Enterprise
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
