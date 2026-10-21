"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  Download,
  Calendar,
  Coffee,
  CheckCircle2,
  Clock,
  RefreshCw,
  DollarSign,
  PieChart,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

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
  statusDistribution: {
    pending: number;
    accepted: number;
    preparing: number;
    ready: number;
    served: number;
    cancelled: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    status: string;
    totalAmount: number;
    paymentStatus: string;
    paymentMethod: string;
    createdAt: string;
    table: { tableNumber: string };
  }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/dashboard/analytics");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Fetch analytics error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // CSV Export feature
  const handleExportCSV = () => {
    if (!data?.recentOrders || data.recentOrders.length === 0) {
      alert("No orders to export");
      return;
    }

    const headers = [
      "Order Number",
      "Date",
      "Time",
      "Table",
      "Customer",
      "Total Amount (INR)",
      "Payment Method",
      "Payment Status",
      "Order Status",
    ];

    const rows = data.recentOrders.map((o) => {
      const date = new Date(o.createdAt);
      return [
        o.orderNumber,
        date.toISOString().split("T")[0],
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        `Table ${o.table.tableNumber}`,
        `"${o.customerName.replace(/"/g, '""')}"`,
        o.totalAmount,
        o.paymentMethod,
        o.paymentStatus,
        o.status,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Aura-Cafe-Sales-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="p-8 text-center py-24">
        <RefreshCw className="w-8 h-8 text-[#C58B5B] animate-spin mx-auto mb-2" />
        <p className="text-xs text-[#24211F]/70">Generating sales analytics and item performance...</p>
      </div>
    );
  }

  const maxDailySales = Math.max(...(data?.last7Days.map((d) => d.sales) || [1]), 1);

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#2B1D18]">
            Sales Analytics & Financial Reporting
          </h1>
          <p className="text-xs text-[#24211F]/70 mt-1">
            Historical revenue breakdowns, table throughput, and order distribution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-[#2B1D18] hover:bg-[#3D2B24] text-[#FAF5EC] rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 text-[#C58B5B]" />
            <span>Export Orders to CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-5 shadow-xs space-y-2">
          <span className="text-xs text-[#24211F]/60">Total Gross Revenue</span>
          <div className="font-serif font-bold text-2xl text-[#2B1D18]">
            {formatCurrency(data?.totalSales || 0)}
          </div>
          <span className="block text-[11px] text-[#75856B]">
            All completed QR orders
          </span>
        </div>

        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-5 shadow-xs space-y-2">
          <span className="text-xs text-[#24211F]/60">Average Ticket Size</span>
          <div className="font-serif font-bold text-2xl text-[#2B1D18]">
            {formatCurrency(data?.avgOrderValue || 0)}
          </div>
          <span className="block text-[11px] text-[#75856B]">
            Per table transaction
          </span>
        </div>

        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-5 shadow-xs space-y-2">
          <span className="text-xs text-[#24211F]/60">Lifetime Order Volume</span>
          <div className="font-serif font-bold text-2xl text-[#2B1D18]">
            {data?.totalOrdersCount || 0}
          </div>
          <span className="block text-[11px] text-[#24211F]/60">
            Total kitchen tickets
          </span>
        </div>

        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-5 shadow-xs space-y-2">
          <span className="text-xs text-[#24211F]/60">Today&apos;s Run-rate</span>
          <div className="font-serif font-bold text-2xl text-[#C58B5B]">
            {formatCurrency(data?.todaySales || 0)}
          </div>
          <span className="block text-[11px] text-[#75856B]">
            {data?.todayOrderCount || 0} tables served today
          </span>
        </div>
      </div>

      {/* REVENUE CHART */}
      <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#E6DCCE] pb-3">
          <div>
            <h2 className="font-serif font-bold text-base text-[#2B1D18]">
              Daily Sales Volume (Last 7 Days)
            </h2>
            <p className="text-xs text-[#24211F]/60">Revenue generated per calendar day</p>
          </div>
          <span className="text-xs font-bold text-[#75856B] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            Live Stream
          </span>
        </div>

        <div className="pt-4 h-64 flex items-end justify-between gap-4 px-4">
          {data?.last7Days.map((day) => {
            const heightPercent = Math.max(10, Math.round((day.sales / maxDailySales) * 100));
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group">
                <span className="text-xs font-bold text-[#2B1D18] opacity-0 group-hover:opacity-100 transition-opacity">
                  {formatCurrency(day.sales)}
                </span>
                <div className="w-full bg-[#FAF5EC] rounded-t-xl overflow-hidden h-44 flex items-end">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full bg-[#2B1D18] group-hover:bg-[#C58B5B] transition-all rounded-t-xl"
                  />
                </div>
                <span className="text-xs font-bold text-[#24211F]">{day.label}</span>
                <span className="text-[10px] text-[#24211F]/50">{day.count} orders</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* STATUS BREAKDOWN & POPULAR ITEMS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-6 shadow-xs space-y-4">
          <div className="border-b border-[#E6DCCE] pb-3">
            <h2 className="font-serif font-bold text-base text-[#2B1D18]">
              Order Fulfillment Breakdown
            </h2>
            <p className="text-xs text-[#24211F]/60">Historical status distribution</p>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center">
              <span className="block text-[11px] text-amber-800 font-semibold">Pending</span>
              <span className="block text-xl font-bold text-amber-900 mt-1">
                {data?.statusDistribution.pending || 0}
              </span>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-center">
              <span className="block text-[11px] text-blue-800 font-semibold">Accepted</span>
              <span className="block text-xl font-bold text-blue-900 mt-1">
                {data?.statusDistribution.accepted || 0}
              </span>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-center">
              <span className="block text-[11px] text-purple-800 font-semibold">Preparing</span>
              <span className="block text-xl font-bold text-purple-900 mt-1">
                {data?.statusDistribution.preparing || 0}
              </span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
              <span className="block text-[11px] text-emerald-800 font-semibold">Ready</span>
              <span className="block text-xl font-bold text-emerald-900 mt-1">
                {data?.statusDistribution.ready || 0}
              </span>
            </div>
            <div className="p-3 bg-stone-100 rounded-xl border border-stone-200 text-center">
              <span className="block text-[11px] text-stone-700 font-semibold">Served</span>
              <span className="block text-xl font-bold text-stone-900 mt-1">
                {data?.statusDistribution.served || 0}
              </span>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-center">
              <span className="block text-[11px] text-rose-800 font-semibold">Cancelled</span>
              <span className="block text-xl font-bold text-rose-900 mt-1">
                {data?.statusDistribution.cancelled || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Top Delicacies */}
        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-6 shadow-xs space-y-4">
          <div className="border-b border-[#E6DCCE] pb-3">
            <h2 className="font-serif font-bold text-base text-[#2B1D18]">
              Top Revenue Dishes & Drinks
            </h2>
            <p className="text-xs text-[#24211F]/60">Ranked by lifetime sales</p>
          </div>

          <div className="space-y-3 pt-1">
            {data?.topSellingItems && data.topSellingItems.length > 0 ? (
              data.topSellingItems.map((item, idx) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#FAF5EC]/70 border border-[#E6DCCE]"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#2B1D18] text-[#FAF5EC] text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-xs text-[#2B1D18]">
                        {item.name}
                      </h4>
                      <span className="text-[11px] text-[#75856B]">
                        {item.quantity} orders
                      </span>
                    </div>
                  </div>
                  <span className="font-serif font-bold text-sm text-[#2B1D18]">
                    {formatCurrency(item.revenue)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-[#24211F]/50">
                No item sales recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
