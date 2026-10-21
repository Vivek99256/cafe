"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Coffee, ArrowRight, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cafeName, setCafeName] = useState("");
  const [city, setCity] = useState("Bengaluru");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName || !email || !password || !cafeName) {
      setError("Please fill out all required fields.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerName: ownerName.trim(),
          email: email.trim(),
          password,
          cafeName: cafeName.trim(),
          city: city.trim(),
          phone: phone.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register cafe");
      }

      // Successful registration sets session cookie and redirects directly to manager dashboard
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
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
          Onboard Your Cafe
        </h2>
        <p className="mt-1 text-xs text-[#24211F]/70">
          Launch your contactless digital menu and real-time kitchen board in under 2 minutes.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-[#FFFDF9] py-8 px-6 shadow-xl rounded-3xl border border-[#E6DCCE] sm:px-10 space-y-6">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#24211F]/80 mb-1">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arjun Kapoor"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full p-2.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#24211F]/80 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 98200 12345"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#24211F]/80 mb-1">
                Work Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="owner@yourcafe.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#24211F]/80 mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                placeholder="Create a secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B]"
              />
            </div>

            <div className="pt-2 border-t border-[#FAF5EC]">
              <span className="block text-xs font-bold uppercase tracking-wider text-[#2B1D18] mb-3">
                Cafe Profile
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#24211F]/80 mb-1">
                    Cafe / Restaurant Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Copper Bean Roastery"
                    value={cafeName}
                    onChange={(e) => setCafeName(e.target.value)}
                    className="w-full p-2.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#24211F]/80 mb-1">
                    City / Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bengaluru, Mumbai, Delhi"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-2.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B]"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#FAF5EC] rounded-xl border border-[#E6DCCE] text-xs text-[#24211F]/70 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#2B1D18]">
                <Sparkles className="w-3.5 h-3.5 text-[#C58B5B]" />
                Included with your account:
              </div>
              <p>✓ 14-day Pro Roastery access with 40 QR tables</p>
              <p>✓ Tables T01, T02, and T03 generated automatically</p>
              <p>✓ Live audio alert kitchen display</p>
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
                <span>Generating Cafe Workspace & Tables...</span>
              ) : (
                <>
                  <span>Create Cafe & Launch Live Menu</span>
                  <ArrowRight className="w-4 h-4 text-[#C58B5B]" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-[#FAF5EC]">
            <p className="text-xs text-[#24211F]/70">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-[#C58B5B] hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
