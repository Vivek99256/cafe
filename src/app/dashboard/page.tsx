"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  Flame,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Coffee,
  Check,
  X,
  Play,
  FileText,
} from "lucide-react";
import { formatCurrency, formatTimeAgo, getStatusDetails } from "@/lib/utils";

interface AnalyticsData {
  todaySales: number;
  todayOrderCount: number;
  pendingCount: number;
  preparingCount: number;
  readyCount: number;
  avgOrderValue: number;
  totalSales: number;
  totalOrdersCount: number;
  topSellingItems: Array<{ name: string; quantity: number; revenue: number }>;
  last7Days: Array<{ date: string; label: string; sales: number; count: number }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    status: string;
    totalAmount: number;
    paymentStatus: string;
    createdAt: string;
    table: { tableNumber: string };
    items: Array<{ name: string; quantity: number }>;
  }>;
}

export default function DashboardOverviewPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/dashboard/analytics");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // Auto-refresh every 8 seconds
    const interval = setInterval(fetchAnalytics, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`/api/dashboard/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await fetchAnalytics();
      }
    } catch (err) {
      console.error("Status update error:", err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center py-24">
        <RefreshCw className="w-8 h-8 text-[#C58B5B] animate-spin mx-auto mb-2" />
        <p className="text-xs text-[#24211F]/70">Computing cafe revenue & order metrics...</p>
      </div>
    );
  }

  const maxSales = Math.max(...(data?.last7Days.map((d) => d.sales) || [1]), 1);

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#2B1D18]">
            Today&apos;s Cafe Performance
          </h1>
          <p className="text-xs text-[#24211F]/70 mt-1">
            Real-time sales, live table traffic, and order queue metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAnalytics}
            className="px-3.5 py-2 bg-[#FFFDF9] border border-[#E6DCCE] hover:bg-[#FAF5EC] rounded-xl text-xs font-semibold text-[#2B1D18] flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#C58B5B]" />
            <span>Sync</span>
          </button>
          <Link
            href="/dashboard/orders"
            className="px-4 py-2 bg-[#2B1D18] hover:bg-[#3D2B24] text-[#FAF5EC] rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
          >
            <span>Live Kitchen Board</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#C58B5B]" />
          </Link>
        </div>
      </div>

      {/* KPI METRICS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Today's Sales */}
        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#24211F]/60">
            <span>Today&apos;s Sales</span>
            <TrendingUp className="w-4 h-4 text-[#75856B]" />
          </div>
          <div className="font-serif font-bold text-2xl text-[#2B1D18]">
            {formatCurrency(data?.todaySales || 0)}
          </div>
          <span className="block text-[11px] text-[#75856B] font-medium">
            {data?.todayOrderCount || 0} orders received today
          </span>
        </div>

        {/* KPI 2: Pending Orders */}
        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#24211F]/60">
            <span>Pending Orders</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-serif font-bold text-2xl text-amber-700">
            {data?.pendingCount || 0}
          </div>
          <span className="block text-[11px] text-[#24211F]/60">
            Awaiting acceptance
          </span>
        </div>

        {/* KPI 3: In Kitchen Prep */}
        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#24211F]/60">
            <span>Kitchen Prep</span>
            <Flame className="w-4 h-4 text-purple-600" />
          </div>
          <div className="font-serif font-bold text-2xl text-purple-700">
            {data?.preparingCount || 0}
          </div>
          <span className="block text-[11px] text-[#24211F]/60">
            Active at barista station
          </span>
        </div>

        {/* KPI 4: Ready for Delivery */}
        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#24211F]/60">
            <span>Ready to Serve</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-serif font-bold text-2xl text-emerald-700">
            {data?.readyCount || 0}
          </div>
          <span className="block text-[11px] text-[#24211F]/60">
            Staged at service counter
          </span>
        </div>

        {/* KPI 5: Avg Order Value */}
        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-5 shadow-xs space-y-2 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-xs text-[#24211F]/60">
            <span>Avg Order Value</span>
            <Coffee className="w-4 h-4 text-[#C58B5B]" />
          </div>
          <div className="font-serif font-bold text-2xl text-[#2B1D18]">
            {formatCurrency(data?.avgOrderValue || 0)}
          </div>
          <span className="block text-[11px] text-[#24211F]/60">
            All-time sales: {formatCurrency(data?.totalSales || 0)}
          </span>
        </div>
      </div>

      {/* SALES CHART & TOP ITEMS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: 7-Day Revenue Trend Chart */}
        <div className="lg:col-span-2 bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#E6DCCE] pb-3">
            <div>
              <h2 className="font-serif font-bold text-base text-[#2B1D18]">
                Last 7 Days Revenue Trend
              </h2>
              <p className="text-xs text-[#24211F]/60">Daily recorded sales from digital orders</p>
            </div>
            <span className="text-xs font-bold text-[#75856B]">
              Past Week
            </span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="pt-4 h-52 flex items-end justify-between gap-3 px-2">
            {data?.last7Days.map((day) => {
              const heightPercent = Math.max(8, Math.round((day.sales / maxSales) * 100));
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] font-bold text-[#2B1D18] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {formatCurrency(day.sales)}
                  </span>
                  <div className="w-full bg-[#FAF5EC] rounded-t-xl overflow-hidden h-36 flex items-end">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-gradient-to-t from-[#2B1D18] to-[#C58B5B] rounded-t-xl group-hover:to-[#B47847] transition-all"
                    />
                  </div>
                  <span className="text-xs font-semibold text-[#24211F]/80">
                    {day.label}
                  </span>
                  <span className="text-[10px] text-[#24211F]/50">
                    {day.count} {day.count === 1 ? "order" : "orders"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Best Selling Products */}
        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-6 shadow-xs space-y-4">
          <div className="border-b border-[#E6DCCE] pb-3">
            <h2 className="font-serif font-bold text-base text-[#2B1D18]">
              Top Selling Delicacies
            </h2>
            <p className="text-xs text-[#24211F]/60">Highest volume menu items</p>
          </div>

          <div className="space-y-3 pt-1">
            {data?.topSellingItems && data.topSellingItems.length > 0 ? (
              data.topSellingItems.map((item, idx) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#FAF5EC]/60 border border-[#E6DCCE]"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#2B1D18] text-[#FAF5EC] text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-xs text-[#2B1D18] line-clamp-1">
                        {item.name}
                      </h4>
                      <span className="text-[11px] text-[#75856B] font-medium">
                        {item.quantity} portions served
                      </span>
                    </div>
                  </div>
                  <span className="font-serif font-bold text-xs text-[#2B1D18]">
                    {formatCurrency(item.revenue)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-[#24211F]/50">
                No orders recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RECENT ORDERS FEED */}
      <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E6DCCE] pb-3">
          <div>
            <h2 className="font-serif font-bold text-base text-[#2B1D18]">
              Live Order Activity
            </h2>
            <p className="text-xs text-[#24211F]/60">Recent orders placed from table QR codes</p>
          </div>
          <Link
            href="/dashboard/orders"
            className="text-xs font-bold text-[#C58B5B] hover:underline flex items-center gap-1"
          >
            <span>View All Live Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E6DCCE] text-[#24211F]/60 font-semibold">
                <th className="pb-3">Order / Time</th>
                <th className="pb-3">Table</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Items Summary</th>
                <th className="pb-3">Total Amount</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FAF5EC]">
              {data?.recentOrders && data.recentOrders.length > 0 ? (
                data.recentOrders.map((order) => {
                  const meta = getStatusDetails(order.status);
                  return (
                    <tr key={order.id} className="hover:bg-[#FAF5EC]/40 transition-colors">
                      <td className="py-3 font-semibold text-[#2B1D18]">
                        <div className="font-serif font-bold">#{order.orderNumber}</div>
                        <div className="text-[11px] text-[#24211F]/50 font-normal">
                          {formatTimeAgo(order.createdAt)}
                        </div>
                      </td>
                      <td className="py-3 font-bold text-[#2B1D18]">
                        Table {order.table.tableNumber}
                      </td>
                      <td className="py-3 font-medium text-[#24211F]">
                        {order.customerName}
                      </td>
                      <td className="py-3 text-[#24211F]/80 max-w-xs truncate">
                        {order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                      </td>
                      <td className="py-3 font-bold text-[#2B1D18]">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="py-3">
                        <span
                          className="px-2.5 py-1 rounded-full text-[10px] font-bold border inline-block"
                          style={{
                            backgroundColor: meta.badgeBg,
                            color: meta.badgeColor,
                            borderColor: "transparent",
                          }}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {order.status === "PENDING" && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleUpdateStatus(order.id, "ACCEPTED")}
                              disabled={updatingOrderId === order.id}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs"
                            >
                              <Check className="w-3 h-3" /> Accept
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(order.id, "CANCELLED")}
                              disabled={updatingOrderId === order.id}
                              className="p-1 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px]"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        {order.status === "ACCEPTED" && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, "PREPARING")}
                            disabled={updatingOrderId === order.id}
                            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs"
                          >
                            <Play className="w-3 h-3" /> Start Prep
                          </button>
                        )}
                        {order.status === "PREPARING" && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, "READY")}
                            disabled={updatingOrderId === order.id}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs"
                          >
                            <Check className="w-3 h-3" /> Mark Ready
                          </button>
                        )}
                        {order.status === "READY" && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, "SERVED")}
                            disabled={updatingOrderId === order.id}
                            className="px-2.5 py-1 bg-stone-800 hover:bg-stone-900 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Mark Served
                          </button>
                        )}
                        {order.status === "SERVED" && (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                              Served ✓
                            </span>
                            <Link
                              href={`/dashboard/orders?status=SERVED&search=${order.orderNumber}`}
                              className="px-2 py-1 bg-[#2B1D18] hover:bg-[#3D2B24] text-[#FAF5EC] rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors"
                              title="View Tax Invoice Bill"
                            >
                              <FileText className="w-3 h-3 text-[#C58B5B]" />
                              <span>Bill</span>
                            </Link>
                          </div>
                        )}
                        {order.status === "CANCELLED" && (
                          <span className="text-[11px] text-rose-600/70 italic">
                            Cancelled
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-xs text-[#24211F]/50">
                    No orders have been received yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
