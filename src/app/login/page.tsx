"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Coffee, ArrowRight, Shield, Sparkles, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      if (data.user?.role === "SUPER_ADMIN") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handle1ClickDemo = async (role: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (data.success && data.redirectTo) {
        window.location.href = data.redirectTo;
      } else {
        throw new Error(data.error || "Demo login failed");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Demo sign in failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF5EC] flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-[#24211F]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 group mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#2B1D18] flex items-center justify-center text-[#FAF5EC] shadow-md group-hover:scale-105 transition-transform">
            <Coffee className="w-6 h-6 text-[#C58B5B]" />
          </div>
          <span className="font-serif text-2xl font-bold tracking-tight text-[#2B1D18]">
            Aura<span className="text-[#C58B5B]">.</span>
          </span>
        </Link>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2B1D18]">
          Manager & Platform Sign In
        </h2>
        <p className="mt-1 text-xs text-[#24211F]/70">
          Access your cafe live order board, table QR codes, and sales analytics.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#FFFDF9] py-8 px-6 shadow-xl rounded-3xl border border-[#E6DCCE] sm:px-10 space-y-6">
          {/* Quick Demo Sign In Box */}
          <div className="p-4 bg-[#FAF5EC] rounded-2xl border border-[#C58B5B]/30 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#2B1D18]">
              <Sparkles className="w-4 h-4 text-[#C58B5B]" />
              <span>Instant 1-Click Evaluation Logins:</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handle1ClickDemo("CAFE_OWNER")}
                disabled={loading}
                className="p-2 bg-[#2B1D18] text-[#FAF5EC] rounded-xl font-bold hover:bg-[#3D2B24] transition-colors text-center shadow-xs"
              >
                👑 Aura Cafe Owner
              </button>

              <button
                type="button"
                onClick={() => handle1ClickDemo("CAFE_MANAGER")}
                disabled={loading}
                className="p-2 bg-[#FAF5EC] border border-[#E6DCCE] text-[#2B1D18] rounded-xl font-bold hover:bg-[#F2E9DB] transition-colors text-center"
              >
                📋 Cafe Manager
              </button>

              <button
                type="button"
                onClick={() => handle1ClickDemo("KITCHEN_STAFF")}
                disabled={loading}
                className="p-2 bg-[#FAF5EC] border border-[#E6DCCE] text-[#2B1D18] rounded-xl font-bold hover:bg-[#F2E9DB] transition-colors text-center"
              >
                👨‍🍳 Kitchen Staff
              </button>

              <button
                type="button"
                onClick={() => handle1ClickDemo("SUPER_ADMIN")}
                disabled={loading}
                className="p-2 bg-purple-900 text-purple-100 rounded-xl font-bold hover:bg-purple-950 transition-colors text-center shadow-xs"
              >
                🛡️ Super Admin
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E6DCCE]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase font-bold tracking-wider">
              <span className="bg-[#FFFDF9] px-2 text-[#24211F]/50">Or standard login</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#24211F]/80 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@auracafe.com"
                className="w-full p-2.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#24211F]/80 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B]"
              />
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#2B1D18] hover:bg-[#3D2B24] text-[#FAF5EC] font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-md"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4 text-[#C58B5B]" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-[#FAF5EC]">
            <p className="text-xs text-[#24211F]/70">
              New cafe owner?{" "}
              <Link href="/register" className="font-bold text-[#C58B5B] hover:underline">
                Create and launch your cafe
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
