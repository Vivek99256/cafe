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
  FileText,
  Printer,
  X,
  Star,
  MessageCircle,
  Bell,
  ExternalLink,
  ThumbsUp,
} from "lucide-react";
import confetti from "canvas-confetti";
import { formatCurrency, getStatusDetails } from "@/lib/utils";
import PrintableReceipt from "@/components/PrintableReceipt";

interface FeedbackData {
  id: string;
  rating: number;
  foodRating?: number | null;
  serviceRating?: number | null;
  comment?: string | null;
  googleReviewClicked: boolean;
}

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
    address?: string | null;
    logoUrl?: string | null;
    currencySymbol: string;
    estimatedPrepTime: number;
    googleReviewUrl?: string | null;
    whatsappNotificationsEnabled?: boolean;
  };
  table: {
    id: string;
    tableNumber: string;
    label?: string | null;
  };
  items: OrderItem[];
  statusHistory: StatusHistory[];
  feedback?: FeedbackData | null;
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
  const [tableOrders, setTableOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [assistanceRequested, setAssistanceRequested] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [viewCombinedBill, setViewCombinedBill] = useState(true);

  // Feedback & Review Booster States
  const [userRating, setUserRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [foodRating, setFoodRating] = useState<number>(5);
  const [serviceRating, setServiceRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState<string>("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [googleReviewOpened, setGoogleReviewOpened] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [hasPromptedReadyNotification, setHasPromptedReadyNotification] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${orderNumber}`);
      if (!res.ok) throw new Error("Order not found");
      const data = await res.json();
      setOrder(data.order);
      setTableOrders(data.tableOrders || []);
      setLastRefreshed(new Date());
      if (data.order?.feedback) {
        setFeedbackSubmitted(true);
        setUserRating(data.order.feedback.rating);
        if (data.order.feedback.foodRating) setFoodRating(data.order.feedback.foodRating);
        if (data.order.feedback.serviceRating) setServiceRating(data.order.feedback.serviceRating);
        if (data.order.feedback.comment) setFeedbackComment(data.order.feedback.comment);
      }
    } catch (err) {
      setError("Unable to find order details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();

    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted");
    }

    // Auto poll every 4 seconds to reflect status changes in real time
    const interval = setInterval(() => {
      fetchOrder();
    }, 4000);

    return () => clearInterval(interval);
  }, [orderNumber]);

  // Trigger web notification when status switches to READY
  useEffect(() => {
    if (
      order?.status === "READY" &&
      !hasPromptedReadyNotification &&
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      setHasPromptedReadyNotification(true);
      try {
        new Notification(`☕ Order #${order.orderNumber} is Ready!`, {
          body: `Your order from ${order.cafe.name} is ready for Table ${order.table.tableNumber}.`,
          icon: "/favicon.ico",
        });
      } catch (err) {
        console.error("Browser notification trigger error:", err);
      }
    }
  }, [order?.status, hasPromptedReadyNotification, order?.orderNumber, order?.cafe.name, order?.table.tableNumber]);

  const requestNotificationPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          setNotificationsEnabled(true);
          new Notification("🔔 Table Alerts Enabled", {
            body: `You will be alerted the moment Order #${orderNumber} is ready!`,
          });
        }
      } catch (err) {
        console.error("Permission request error:", err);
      }
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setIsSubmittingFeedback(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: order.orderNumber,
          rating: userRating,
          foodRating,
          serviceRating,
          comment: feedbackComment,
        }),
      });
      if (res.ok) {
        setFeedbackSubmitted(true);
        if (userRating >= 4) {
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.7 },
          });
        }
        await fetchOrder();
      }
    } catch (err) {
      console.error("Feedback submit error:", err);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleOpenGoogleReview = async () => {
    if (!order) return;
    setGoogleReviewOpened(true);
    const targetUrl =
      order.cafe.googleReviewUrl ||
      `https://www.google.com/search?q=${encodeURIComponent(order.cafe.name + " review")}`;
    window.open(targetUrl, "_blank");

    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: order.orderNumber,
          rating: userRating,
          googleReviewClicked: true,
        }),
      });
    } catch {
      // ignore
    }
  };

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

  // Consolidated table orders calculations
  const isMultiOrderTable = tableOrders.length > 1;
  const combinedSubtotal = tableOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const combinedTax = tableOrders.reduce((sum, o) => sum + o.taxAmount, 0);
  const combinedTotal = tableOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const allOrdersPaid = tableOrders.length > 0 && tableOrders.every((o) => o.paymentStatus === "PAID");
  const combinedItems = tableOrders.flatMap((o) => o.items);
  const orderRounds = tableOrders.map((o, idx) => ({
    roundNumber: idx + 1,
    orderNumber: o.orderNumber,
    createdAt: o.createdAt,
    items: o.items,
  }));

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
        {/* Table Multi-Order Consolidated Tab Banner */}
        {isMultiOrderTable && (
          <div className="bg-[#FFFDF9] rounded-2xl border-2 border-[#C58B5B]/30 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[#E6DCCE] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="font-serif font-bold text-sm text-[#2B1D18]">
                    Table {order.table.tableNumber} Running Tab ({tableOrders.length} Orders)
                  </h3>
                </div>
                <p className="text-[11px] text-[#24211F]/60 mt-0.5">
                  All rounds placed from this table are combined into one consolidated bill.
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-[#24211F]/50 block">Combined Total</span>
                <span className="font-serif font-bold text-base text-[#C58B5B]">
                  {formatCurrency(combinedTotal, "INR", order.cafe.currencySymbol)}
                </span>
              </div>
            </div>

            {/* List of Rounds */}
            <div className="space-y-1.5">
              {tableOrders.map((tOrder, idx) => {
                const tMeta = getStatusDetails(tOrder.status);
                const isThisOrder = tOrder.orderNumber === order.orderNumber;

                return (
                  <div
                    key={tOrder.id}
                    className={`flex items-center justify-between text-xs p-2.5 rounded-xl border transition-all ${
                      isThisOrder
                        ? "bg-[#FAF5EC] border-[#C58B5B] font-semibold"
                        : "bg-[#FFFDF9] border-[#E6DCCE]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#2B1D18] text-[#FAF5EC] text-[10px] flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span>Order #{tOrder.orderNumber}</span>
                          {isThisOrder && (
                            <span className="text-[10px] text-[#C58B5B] font-bold">(Current Ticket)</span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#24211F]/50 font-normal">
                          {tOrder.items.reduce((s, i) => s + i.quantity, 0)} items • {new Date(tOrder.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                        style={{ backgroundColor: tMeta.badgeBg, color: tMeta.badgeColor }}
                      >
                        {tMeta.label}
                      </span>
                      <span className="font-bold text-[#2B1D18]">
                        {formatCurrency(tOrder.totalAmount, "INR", order.cafe.currencySymbol)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  setViewCombinedBill(true);
                  setShowReceiptModal(true);
                }}
                className="flex-1 py-2.5 bg-[#2B1D18] hover:bg-[#3D2B24] text-[#FAF5EC] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-[#C58B5B]" />
                <span>View Combined Table Bill ({formatCurrency(combinedTotal, "INR", order.cafe.currencySymbol)})</span>
              </button>
            </div>
          </div>
        )}

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

            <button
              onClick={() => setShowReceiptModal(true)}
              className="w-full mt-3 py-2.5 bg-[#2B1D18] hover:bg-[#3D2B24] text-[#FAF5EC] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 text-[#C58B5B]" />
              <span>View & Print Tax Invoice Bill</span>
            </button>
          </div>
        </div>

        {/* Real-time Order Alerts & WhatsApp Updates Card */}
        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-xs text-[#2B1D18]">
                Instant Updates on WhatsApp & Browser
              </h4>
              <p className="text-[11px] text-[#24211F]/60">
                {notificationsEnabled
                  ? "✓ Push alerts enabled for this ticket"
                  : "Never miss when your coffee or food is ready"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!notificationsEnabled && (
              <button
                onClick={requestNotificationPermission}
                className="flex-1 sm:flex-initial px-3 py-2 bg-[#FAF5EC] hover:bg-[#F2E9DB] border border-[#E6DCCE] rounded-xl text-xs font-semibold text-[#2B1D18] flex items-center justify-center gap-1.5 transition-colors"
              >
                <Bell className="w-3.5 h-3.5 text-[#C58B5B]" />
                <span>Enable Alerts</span>
              </button>
            )}

            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `My Order #${order.orderNumber} at ${order.cafe.name} (Table ${order.table.tableNumber}): Track live at ${typeof window !== "undefined" ? window.location.href : ""}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Share Ticket</span>
            </a>
          </div>
        </div>

        {/* CUSTOMER FEEDBACK & GOOGLE REVIEW BOOSTER */}
        <div className="bg-[#FFFDF9] rounded-2xl border-2 border-[#C58B5B]/30 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E6DCCE] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500">
                <Star className="w-4 h-4 fill-amber-500" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm text-[#2B1D18]">
                  Rate Your Experience
                </h3>
                <p className="text-[11px] text-[#24211F]/60">
                  Help {order.cafe.name} serve you even better!
                </p>
              </div>
            </div>

            {feedbackSubmitted && (
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                ✓ Feedback Submitted
              </span>
            )}
          </div>

          {!feedbackSubmitted ? (
            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              {/* Overall Star Rating */}
              <div className="text-center py-2 space-y-2">
                <label className="text-xs font-semibold text-[#24211F]/80 block">
                  Overall Dining Satisfaction
                </label>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (hoverRating || userRating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setUserRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-transform hover:scale-125 cursor-pointer"
                        aria-label={`${star} Stars`}
                      >
                        <Star
                          className={`w-7 h-7 transition-colors ${
                            isFilled
                              ? "text-amber-500 fill-amber-500"
                              : "text-stone-300"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="text-[11px] font-bold text-[#C58B5B]">
                  {userRating === 5 && "⭐ Outstanding / Loved it!"}
                  {userRating === 4 && "⭐ Very Good & Pleasing"}
                  {userRating === 3 && "⭐ Good / Decent"}
                  {userRating === 2 && "⭐ Could be better"}
                  {userRating === 1 && "⭐ Needs Improvement"}
                </div>
              </div>

              {/* Specific Food & Service Ratings */}
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#FAF5EC] text-xs">
                <div className="p-2.5 bg-[#FAF5EC] rounded-xl border border-[#E6DCCE] space-y-1.5">
                  <span className="text-[11px] font-semibold text-[#24211F]/70 block">
                    Food & Brew Quality
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFoodRating(s)}
                        className="p-0.5 cursor-pointer"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            foodRating >= s
                              ? "text-amber-500 fill-amber-500"
                              : "text-stone-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-2.5 bg-[#FAF5EC] rounded-xl border border-[#E6DCCE] space-y-1.5">
                  <span className="text-[11px] font-semibold text-[#24211F]/70 block">
                    Staff & Table Service
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setServiceRating(s)}
                        className="p-0.5 cursor-pointer"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            serviceRating >= s
                              ? "text-amber-500 fill-amber-500"
                              : "text-stone-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Optional Comment */}
              <div>
                <textarea
                  rows={2}
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Share a quick note or compliment for the barista/kitchen (optional)..."
                  className="w-full p-2.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B] text-[#2B1D18]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingFeedback}
                className="w-full py-2.5 bg-[#2B1D18] hover:bg-[#3D2B24] text-[#FAF5EC] rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <ThumbsUp className="w-3.5 h-3.5 text-[#C58B5B]" />
                <span>{isSubmittingFeedback ? "Submitting..." : "Send Feedback"}</span>
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              {/* 4 or 5 Star Google Review Booster */}
              {userRating >= 4 ? (
                <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-300/60 text-center space-y-2.5 animate-in fade-in zoom-in-95">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-500 text-white shadow-sm">
                    <Star className="w-6 h-6 fill-white" />
                  </div>
                  <h4 className="font-serif font-bold text-sm text-[#2B1D18]">
                    Thank You for the 5-Star Love! 🎉
                  </h4>
                  <p className="text-xs text-[#24211F]/80 leading-relaxed max-w-sm mx-auto">
                    Would you take 10 seconds to share your review on Google Maps? It genuinely helps our small artisanal team grow!
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenGoogleReview}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <Star className="w-4 h-4 fill-white text-white" />
                    <span>Post 5-Star Review on Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  {googleReviewOpened && (
                    <p className="text-[11px] text-emerald-800 font-semibold pt-1">
                      ✓ Thank you so much for supporting us on Google!
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-[#FAF5EC] rounded-xl border border-[#E6DCCE] text-center space-y-1">
                  <p className="text-xs font-bold text-[#2B1D18]">
                    Thank you for your feedback!
                  </p>
                  <p className="text-[11px] text-[#24211F]/70">
                    We appreciate your honesty. Our store manager has received your comments and will work hard to make your next visit even better.
                  </p>
                </div>
              )}
            </div>
          )}
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

      {/* CUSTOMER RECEIPT MODAL */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 bg-[#2B1D18]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between no-print border-b border-stone-200 pb-3">
              <div>
                <h3 className="font-bold text-sm text-stone-900">
                  Tax Invoice / Receipt
                </h3>
                <span className="text-[11px] text-stone-500">
                  #{order.orderNumber} • Table {order.table.tableNumber}
                </span>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-stone-500 hover:text-stone-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Multi-Order Combined Bill Toggle */}
            {isMultiOrderTable && (
              <div className="flex bg-[#FAF5EC] p-1 rounded-xl border border-[#E6DCCE] text-xs no-print">
                <button
                  onClick={() => setViewCombinedBill(true)}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                    viewCombinedBill
                      ? "bg-[#2B1D18] text-[#FAF5EC] shadow-xs"
                      : "text-[#24211F]/70 hover:text-[#2B1D18]"
                  }`}
                >
                  Combined Table Bill ({tableOrders.length} Orders)
                </button>
                <button
                  onClick={() => setViewCombinedBill(false)}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                    !viewCombinedBill
                      ? "bg-[#2B1D18] text-[#FAF5EC] shadow-xs"
                      : "text-[#24211F]/70 hover:text-[#2B1D18]"
                  }`}
                >
                  This Order (#{order.orderNumber})
                </button>
              </div>
            )}

            <div className="overflow-y-auto max-h-[60vh]">
              {viewCombinedBill && isMultiOrderTable ? (
                <PrintableReceipt
                  cafeName={order.cafe.name}
                  cafeAddress={order.cafe.address || "Heritage Quarter, Lavelle Boulevard"}
                  cafePhone={order.cafe.phone || ""}
                  orderNumber={tableOrders.map((o) => o.orderNumber).join(", #")}
                  tableNumber={order.table.tableNumber}
                  customerName={order.customerName}
                  createdAt={order.createdAt}
                  items={combinedItems}
                  subtotal={combinedSubtotal}
                  taxAmount={combinedTax}
                  totalAmount={combinedTotal}
                  paymentMethod={order.paymentMethod}
                  paymentStatus={allOrdersPaid ? "PAID" : "UNPAID"}
                  isCombinedTableBill={true}
                  orderNumbers={tableOrders.map((o) => o.orderNumber)}
                  orderRounds={orderRounds}
                />
              ) : (
                <PrintableReceipt
                  cafeName={order.cafe.name}
                  cafeAddress={order.cafe.address || "Heritage Quarter, Lavelle Boulevard"}
                  cafePhone={order.cafe.phone || ""}
                  orderNumber={order.orderNumber}
                  tableNumber={order.table.tableNumber}
                  customerName={order.customerName}
                  createdAt={order.createdAt}
                  items={order.items}
                  subtotal={order.subtotal}
                  taxAmount={order.taxAmount}
                  totalAmount={order.totalAmount}
                  paymentMethod={order.paymentMethod}
                  paymentStatus={order.paymentStatus}
                />
              )}
            </div>

            <div className="flex gap-2 no-print pt-2 border-t border-stone-200">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-[#2B1D18] hover:bg-[#3D2B24] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4 text-[#C58B5B]" /> Print / Save Bill
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2 border border-stone-300 rounded-xl text-xs text-stone-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
