"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  Coffee,
  TrendingUp,
  DollarSign,
  Layers,
  Search,
  ExternalLink,
  Power,
  RefreshCw,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PlatformCafe {
  id: string;
  name: string;
  slug: string;
  city?: string | null;
  createdAt: string;
  isAcceptingOrders: boolean;
  owner: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  } | null;
  subscription: {
    status: string;
    planName: string;
    planPrice: number;
    currentPeriodEnd: string;
    isDevMode: boolean;
  } | null;
  tableCount: number;
  menuItemsCount: number;
  ordersCount: number;
  totalRevenue: number;
}

interface AdminStats {
  totalCafes: number;
  totalOrders: number;
  totalTables: number;
  platformMRR: number;
  platformGMV: number;
  plans: Array<{
    id: string;
    name: string;
    price: number;
    maxTables: number;
    maxMenuItems: number;
  }>;
}

export default function SuperAdminPage() {
  const router = useRouter();
  const [cafes, setCafes] = useState<PlatformCafe[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingCafeId, setUpdatingCafeId] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("cafe_token") : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const [cafesRes, statsRes] = await Promise.all([
        fetch("/api/admin/cafes", { headers }),
        fetch("/api/admin/stats", { headers }),
      ]);

      if (!cafesRes.ok || !statsRes.ok) {
        // Not super admin, redirect to login
        router.push("/login");
        return;
      }

      const cafesJson = await cafesRes.json();
      const statsJson = await statsRes.json();

      setCafes(cafesJson.cafes || []);
      setStats(statsJson);
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [router]);

  const handleToggleCafeStatus = async (cafeId: string, currentStatus: boolean) => {
    setUpdatingCafeId(cafeId);
    try {
      const res = await fetch(`/api/admin/cafes/${cafeId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAcceptingOrders: !currentStatus }),
      });
      if (res.ok) {
        await fetchAdminData();
      }
    } catch (err) {
      console.error("Toggle cafe error:", err);
    } finally {
      setUpdatingCafeId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF5EC] flex flex-col items-center justify-center p-6 text-center">
        <Shield className="w-10 h-10 text-purple-700 animate-spin mb-3" />
        <h2 className="font-serif text-lg font-bold text-[#2B1D18]">
          Authenticating Super Admin Privileges...
        </h2>
      </div>
    );
  }

  const filteredCafes = cafes.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.owner?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FAF5EC] text-[#24211F] pb-16">
      {/* Top Navbar */}
      <header className="bg-[#2B1D18] text-[#FAF5EC] p-4 border-b border-[#3D2B24] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded-lg bg-[#3D2B24] hover:bg-[#C58B5B] hover:text-[#2B1D18] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-700 flex items-center justify-center text-white">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <span className="font-serif font-bold text-base text-[#FAF5EC]">
                  Aura Platform Super Admin
                </span>
                <span className="block text-[10px] text-[#C58B5B] uppercase font-bold tracking-widest">
                  Multi-Tenant Governance
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-3.5 py-1.5 bg-[#3D2B24] hover:bg-[#C58B5B] hover:text-[#2B1D18] rounded-xl text-xs font-semibold transition-colors"
            >
              Open Manager View ↗
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 mt-8 space-y-8">
        {/* Platform KPIs */}
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#2B1D18]">
            Platform Overview & Tenant Metrics
          </h1>
          <p className="text-xs text-[#24211F]/70 mt-1">
            Global metrics across all onboarded cafes, billing pipelines, and total GMV.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-5 shadow-xs space-y-2">
            <span className="text-xs text-[#24211F]/60">Platform Monthly Run-rate (MRR)</span>
            <div className="font-serif font-bold text-2xl text-[#2B1D18]">
              {formatCurrency(stats?.platformMRR || 0)}
            </div>
            <span className="block text-[11px] text-[#75856B]">
              From active cafe subscriptions
            </span>
          </div>

          <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-5 shadow-xs space-y-2">
            <span className="text-xs text-[#24211F]/60">Gross Merchandise Value (GMV)</span>
            <div className="font-serif font-bold text-2xl text-[#C58B5B]">
              {formatCurrency(stats?.platformGMV || 0)}
            </div>
            <span className="block text-[11px] text-[#75856B]">
              Total order revenue processed
            </span>
          </div>

          <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-5 shadow-xs space-y-2">
            <span className="text-xs text-[#24211F]/60">Total Registered Cafes</span>
            <div className="font-serif font-bold text-2xl text-[#2B1D18]">
              {stats?.totalCafes || 0}
            </div>
            <span className="block text-[11px] text-[#24211F]/60">
              Active tenants across India
            </span>
          </div>

          <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-5 shadow-xs space-y-2">
            <span className="text-xs text-[#24211F]/60">Total Deployed Tables</span>
            <div className="font-serif font-bold text-2xl text-[#2B1D18]">
              {stats?.totalTables || 0}
            </div>
            <span className="block text-[11px] text-[#24211F]/60">
              {stats?.totalOrders || 0} lifetime orders handled
            </span>
          </div>
        </div>

        {/* SUBSCRIPTION PLANS OVERVIEW */}
        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E6DCCE] pb-3">
            <div>
              <h2 className="font-serif font-bold text-base text-[#2B1D18]">
                Configured SaaS Subscription Tiers
              </h2>
              <p className="text-xs text-[#24211F]/60">Platform plan boundaries and pricing limits</p>
            </div>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
              Billing Dev Mode Enabled
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats?.plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-[#FAF5EC]/70 rounded-xl p-4 border border-[#E6DCCE] space-y-2"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-serif font-bold text-sm text-[#2B1D18]">
                    {plan.name}
                  </h3>
                  <span className="font-bold text-sm text-[#C58B5B]">
                    {formatCurrency(plan.price)}/mo
                  </span>
                </div>
                <div className="text-xs text-[#24211F]/70 space-y-1 pt-1 border-t border-[#E6DCCE]/60">
                  <div>Max Tables: <strong>{plan.maxTables}</strong></div>
                  <div>Max Menu Items: <strong>{plan.maxMenuItems}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* REGISTERED CAFES TABLE */}
        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E6DCCE] pb-3">
            <div>
              <h2 className="font-serif font-bold text-base text-[#2B1D18]">
                Registered Tenant Cafes ({cafes.length})
              </h2>
              <p className="text-xs text-[#24211F]/60">Manage cafe account states and tenant data</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#24211F]/50" />
              <input
                type="text"
                placeholder="Search cafes or owners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF5EC] text-[#24211F]/70 border-b border-[#E6DCCE] font-semibold">
                <tr>
                  <th className="p-3">Cafe Name</th>
                  <th className="p-3">Owner & Contact</th>
                  <th className="p-3">Plan</th>
                  <th className="p-3">Tables</th>
                  <th className="p-3">Orders Handled</th>
                  <th className="p-3">Total GMV</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FAF5EC]">
                {filteredCafes.map((cafe) => (
                  <tr key={cafe.id} className="hover:bg-[#FAF5EC]/40">
                    <td className="p-3 font-semibold text-[#2B1D18]">
                      <div className="font-serif font-bold text-sm">{cafe.name}</div>
                      <div className="text-[11px] text-[#24211F]/50 font-normal">
                        slug: /{cafe.slug} • {cafe.city || "Bangalore"}
                      </div>
                    </td>

                    <td className="p-3 text-[#24211F]/80">
                      <div className="font-medium text-[#2B1D18]">
                        {cafe.owner?.name || "Unassigned"}
                      </div>
                      <div className="text-[11px] text-[#24211F]/50">
                        {cafe.owner?.email}
                      </div>
                    </td>

                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[10px] font-bold border border-blue-200">
                        {cafe.subscription?.planName || "Starter"}
                      </span>
                    </td>

                    <td className="p-3 font-bold text-[#2B1D18]">
                      {cafe.tableCount} tables
                    </td>

                    <td className="p-3 font-medium text-[#24211F]">
                      {cafe.ordersCount}
                    </td>

                    <td className="p-3 font-bold text-[#2B1D18]">
                      {formatCurrency(cafe.totalRevenue)}
                    </td>

                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-block ${
                          cafe.isAcceptingOrders
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-rose-50 text-rose-800 border-rose-200"
                        }`}
                      >
                        {cafe.isAcceptingOrders ? "Active" : "Suspended"}
                      </span>
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/menu/${cafe.slug}?table=T01`}
                          target="_blank"
                          title="Open Customer Menu"
                          className="p-1 text-[#75856B] hover:text-[#2B1D18]"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>

                        <button
                          onClick={() =>
                            handleToggleCafeStatus(cafe.id, cafe.isAcceptingOrders)
                          }
                          disabled={updatingCafeId === cafe.id}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                            cafe.isAcceptingOrders
                              ? "bg-rose-100 text-rose-800 hover:bg-rose-200"
                              : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          }`}
                        >
                          {cafe.isAcceptingOrders ? "Suspend" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
