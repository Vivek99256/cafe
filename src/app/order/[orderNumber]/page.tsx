"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Coffee,
  MapPin,
  Phone,
  RefreshCw,
  ArrowLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { formatCurrency, getStatusDetails } from "@/lib/utils";

interface OrderItem {
  id: string;
  name: string;
  variantName?: string | null;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  specialInstructions?: string | null;
  selectedAddOns: Array<{ name: string; price: number; quantity: number }>;
}

interface StatusHistory {
  id: string;
  status: string;
  note?: string | null;
  changedBy?: string | null;
  createdAt: string;
}

interface OrderData {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  notes?: string | null;
  createdAt: string;
  estimatedReadyTime?: string | null;
  cafe: {
    id: string;
    name: string;
    slug: string;
    phone?: string | null;
    logoUrl?: string | null;
    currencySymbol: string;
    estimatedPrepTime: number;
  };
  table: {
    id: string;
    tableNumber: string;
    label?: string | null;
  };
  items: OrderItem[];
  statusHistory: StatusHistory[];
}

const ORDER_STEPS = [
  { key: "PENDING", title: "Order Received", desc: "Sent to kitchen counter" },
  { key: "ACCEPTED", title: "Confirmed", desc: "Accepted by staff" },
  { key: "PREPARING", title: "Handcrafting", desc: "Barista & kitchen preparing" },
  { key: "READY", title: "Ready for Table", desc: "Plated & served shortly" },
  { key: "SERVED", title: "Served & Complete", desc: "Delivered to your table" },
];

export default function OrderTrackingPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = use(params);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [assistanceRequested, setAssistanceRequested] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${orderNumber}`);
      if (!res.ok) throw new Error("Order not found");
      const data = await res.json();
      setOrder(data.order);
      setLastRefreshed(new Date());
    } catch (err) {
      setError("Unable to find order details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();

    // Auto poll every 4 seconds to reflect status changes in real time
    const interval = setInterval(() => {
      fetchOrder();
    }, 4000);

    return () => clearInterval(interval);
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF5EC] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#2B1D18] flex items-center justify-center text-[#C58B5B] shadow-md mb-3 animate-spin">
          <RefreshCw className="w-7 h-7" />
        </div>
        <h2 className="font-serif text-lg font-bold text-[#2B1D18]">
          Tracking Order #{orderNumber}...
        </h2>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#FAF5EC] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-rose-600 mb-3" />
        <h2 className="font-serif text-xl font-bold text-[#2B1D18]">
          Order Not Found
        </h2>
        <p className="text-xs text-[#24211F]/70 mt-1 max-w-sm">
          We could not locate order #{orderNumber}. Please check the number or speak to your server.
        </p>
        <Link
          href="/"
          className="mt-5 px-4 py-2 bg-[#2B1D18] text-[#FAF5EC] text-xs font-semibold rounded-xl"
        >
          Return Home
        </Link>
      </div>
    );
  }

  const currentStatusMeta = getStatusDetails(order.status);
  const currentStepIndex = ORDER_STEPS.findIndex((s) => s.key === order.status);

  return (
    <div className="min-h-screen bg-[#FAF5EC] text-[#24211F] pb-16">
      {/* Top Header */}
      <header className="bg-[#2B1D18] text-[#FAF5EC] p-4 shadow-md sticky top-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            href={`/menu/${order.cafe.slug}?table=${order.table.tableNumber}`}
            className="flex items-center gap-1.5 text-xs text-[#FAF5EC]/80 hover:text-[#FAF5EC]"
          >
            <ArrowLeft className="w-4 h-4 text-[#C58B5B]" />
            <span>Back to Menu</span>
          </Link>
          <div className="text-right">
            <span className="block font-serif font-bold text-sm text-[#FAF5EC]">
              {order.cafe.name}
            </span>
            <span className="block text-[11px] text-[#C58B5B] font-medium">
              Table {order.table.tableNumber}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 mt-6 space-y-6">
        {/* Status Highlight Banner */}
        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-6 shadow-sm text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border" style={{ backgroundColor: currentStatusMeta.badgeBg, color: currentStatusMeta.badgeColor, borderColor: "transparent" }}>
            <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: currentStatusMeta.badgeColor }} />
            {currentStatusMeta.label}
          </div>

          <h1 className="font-serif text-2xl font-bold text-[#2B1D18]">
            Order #{order.orderNumber}
          </h1>

          <p className="text-xs text-[#24211F]/70 max-w-md mx-auto leading-relaxed">
            {currentStatusMeta.description}
          </p>

          <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-[#24211F]/50">
            <Clock className="w-3.5 h-3.5" />
            <span>Updated live: {lastRefreshed.toLocaleTimeString()}</span>
            <button
              onClick={fetchOrder}
              className="text-[#C58B5B] hover:underline flex items-center gap-0.5 ml-1"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
        </div>

        {/* Live Stepper Timeline */}
        {order.status !== "CANCELLED" ? (
          <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-6 shadow-sm">
            <h3 className="font-serif font-bold text-sm text-[#2B1D18] mb-6">
              Live Preparation Timeline
            </h3>

            <div className="space-y-6 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#E6DCCE]">
              {ORDER_STEPS.map((step, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div key={step.key} className="flex items-start gap-4 relative">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                        isCurrent
                          ? "bg-[#2B1D18] text-[#C58B5B] ring-4 ring-[#C58B5B]/30"
                          : isPassed
                          ? "bg-emerald-600 text-white"
                          : "bg-[#FAF5EC] border border-[#E6DCCE] text-[#24211F]/40"
                      }`}
                    >
                      {isPassed && !isCurrent ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <h4
                        className={`text-xs font-bold ${
                          isCurrent
                            ? "text-[#2B1D18] font-serif text-sm"
                            : isPassed
                            ? "text-[#2B1D18]"
                            : "text-[#24211F]/40"
                        }`}
                      >
                        {step.title}
                      </h4>
                      <p className="text-[11px] text-[#24211F]/60">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-rose-800 text-xs">
            <h3 className="font-bold text-sm mb-1">Order Cancelled</h3>
            <p>This order has been cancelled by the cafe staff. If you have questions, please speak directly with your server.</p>
          </div>
        )}

        {/* Order Items Breakdown */}
        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E6DCCE] pb-3">
            <h3 className="font-serif font-bold text-sm text-[#2B1D18]">
              Ordered Items ({order.items.length})
            </h3>
            <span className="text-xs text-[#24211F]/60">
              For: <strong className="text-[#2B1D18]">{order.customerName}</strong>
            </span>
          </div>

          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between text-xs py-1 border-b border-[#FAF5EC] last:border-none"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-[#2B1D18]">
                    {item.quantity}x {item.name}
                  </div>
                  {item.variantName && (
                    <div className="text-[11px] text-[#C58B5B]">
                      Size: {item.variantName}
                    </div>
                  )}
                  {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                    <div className="text-[11px] text-[#75856B]">
                      + {item.selectedAddOns.map((a) => a.name).join(", ")}
                    </div>
                  )}
                  {item.specialInstructions && (
                    <div className="text-[11px] text-[#24211F]/60 italic">
                      &quot;{item.specialInstructions}&quot;
                    </div>
                  )}
                </div>

                <span className="font-bold text-[#2B1D18]">
                  {formatCurrency(item.totalPrice, "INR", order.cafe.currencySymbol)}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing totals */}
          <div className="pt-3 border-t border-[#E6DCCE] space-y-1.5 text-xs text-[#24211F]/70">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal, "INR", order.cafe.currencySymbol)}</span>
            </div>
            <div className="flex justify-between">
              <span>Taxes</span>
              <span>{formatCurrency(order.taxAmount, "INR", order.cafe.currencySymbol)}</span>
            </div>
            <div className="flex justify-between font-serif font-bold text-sm text-[#2B1D18] pt-1.5 border-t border-[#E6DCCE]">
              <span>Total Paid / Due</span>
              <span className="text-[#C58B5B]">
                {formatCurrency(order.totalAmount, "INR", order.cafe.currencySymbol)}
              </span>
            </div>
            <div className="text-[11px] text-[#24211F]/60 pt-1">
              Payment Method: <strong>{order.paymentMethod === "PAY_AT_COUNTER" ? "Pay at Counter" : "UPI / Online"}</strong> • Status: <strong className={order.paymentStatus === "PAID" ? "text-emerald-700" : "text-amber-700"}>{order.paymentStatus}</strong>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => setAssistanceRequested(true)}
            className={`py-3 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              assistanceRequested
                ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                : "bg-[#FFFDF9] border-[#E6DCCE] text-[#2B1D18] hover:bg-[#FAF5EC]"
            }`}
          >
            <Phone className="w-3.5 h-3.5 text-[#C58B5B]" />
            <span>{assistanceRequested ? "Server Notified ✓" : "Call Waiter"}</span>
          </button>

          <Link
            href={`/menu/${order.cafe.slug}?table=${order.table.tableNumber}`}
            className="py-3 px-4 rounded-xl bg-[#2B1D18] hover:bg-[#3D2B24] text-[#FAF5EC] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <Coffee className="w-3.5 h-3.5 text-[#C58B5B]" />
            <span>Order More Items</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
