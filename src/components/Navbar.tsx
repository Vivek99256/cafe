"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Coffee, ArrowRight, Menu, X, Shield, Sparkles } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#FAF5EC]/95 backdrop-blur-md border-b border-[#E6DCCE] shadow-sm py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-[#2B1D18] flex items-center justify-center text-[#FAF5EC] shadow-md group-hover:scale-105 transition-transform">
              <Coffee className="w-5 h-5 text-[#C58B5B]" />
            </div>
            <div>
              <span className="font-serif text-xl font-bold tracking-tight text-[#2B1D18]">
                Aura<span className="text-[#C58B5B]">.</span>
              </span>
              <span className="block text-[10px] uppercase tracking-widest font-semibold text-[#75856B]">
                Cafe SaaS Platform
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/#features"
              className="text-sm font-medium text-[#24211F]/80 hover:text-[#2B1D18] transition-colors"
            >
              Features
            </Link>
            <Link
              href="/#demo"
              className="text-sm font-medium text-[#24211F]/80 hover:text-[#2B1D18] transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C58B5B]" />
              Live Demos
            </Link>
            <Link
              href="/#pricing"
              className="text-sm font-medium text-[#24211F]/80 hover:text-[#2B1D18] transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/menu/aura-cafe?table=T01"
              target="_blank"
              className="text-sm font-medium text-[#75856B] hover:text-[#5E6D54] transition-colors"
            >
              Customer QR Demo ↗
            </Link>
          </nav>

          {/* CTA Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-[#2B1D18] hover:text-[#C58B5B] transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2B1D18] text-[#FAF5EC] text-sm font-medium hover:bg-[#3D2B24] transition-colors shadow-sm"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4 text-[#C58B5B]" />
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-[#2B1D18] hover:bg-[#F2E9DB]"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 pb-4 border-t border-[#E6DCCE] bg-[#FAF5EC] rounded-xl px-4 space-y-3 shadow-lg">
            <Link
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-[#24211F]"
            >
              Features
            </Link>
            <Link
              href="/#demo"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-[#24211F]"
            >
              Live Demos
            </Link>
            <Link
              href="/#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-[#24211F]"
            >
              Pricing
            </Link>
            <Link
              href="/menu/aura-cafe?table=T01"
              target="_blank"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-[#75856B]"
            >
              Customer QR Demo ↗
            </Link>
            <div className="pt-2 border-t border-[#E6DCCE] flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-sm font-semibold text-[#2B1D18] border border-[#2B1D18]/20 rounded-lg"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-sm font-semibold bg-[#2B1D18] text-[#FAF5EC] rounded-lg"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
