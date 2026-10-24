"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BellRing,
  CheckCircle2,
  Clock,
  Printer,
  RefreshCw,
  Search,
  Volume2,
  Check,
  X,
  Play,
  Filter,
  Eye,
  AlertCircle,
  FileText,
  RotateCcw,
  CreditCard,
  DollarSign,
  Receipt,
  Copy,
  Calendar,
  Coffee,
  CheckCheck,
  Layers,
  UtensilsCrossed,
  LayoutGrid,
  MessageCircle,
} from "lucide-react";
import { formatCurrency, formatTimeAgo, getStatusDetails } from "@/lib/utils";
import { playOrderNotificationSound } from "@/lib/audio";
import PrintableKOT from "@/components/PrintableKOT";
import PrintableReceipt from "@/components/PrintableReceipt";

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

interface CafeInfo {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  currencySymbol?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string | null;
  status: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  notes?: string | null;
  createdAt: string;
  cafe?: CafeInfo;
  table: {
    id: string;
    tableNumber: string;
    label?: string | null;
  };
  items: OrderItem[];
}

interface TableTab {
  id: string;
  tableId: string;
  tableNumber: string;
  label?: string | null;
  customerName: string;
  customerPhone?: string | null;
  customerNames: string[];
  orders: Order[];
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  itemsCount: number;
  hasUnpaid: boolean;
  allServed: boolean;
  orderRounds: Array<{
    roundNumber: number;
    orderNumber: string;
    createdAt: string;
    status: string;
    paymentStatus: string;
    totalAmount: number;
    items: OrderItem[];
  }>;
}

// Normalization helpers for customer session grouping
const getCleanPhone = (phone?: string | null) => {
  if (!phone) return "";
  const cleaned = phone.replace(/[^0-9]/g, "");
  return cleaned.length >= 10 ? cleaned.slice(-10) : cleaned;
};
const getCleanName = (name?: string | null) => (name || "").trim().toLowerCase();

export default function LiveOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [statusFilter, setStatusFilter] = useState<string>("live"); // "live" | "tabs" | "SERVED" | "active" | "PENDING" | ""
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"today" | "all">("today");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "PAID" | "UNPAID">("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Print Modals
  const [printKOTOrder, setPrintKOTOrder] = useState<Order | null>(null);
  const [printReceiptOrder, setPrintReceiptOrder] = useState<Order | null>(null);
  const [isCombinedBillModal, setIsCombinedBillModal] = useState<boolean>(true);
  const [selectedTableTabModal, setSelectedTableTabModal] = useState<TableTab | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      // When viewing tabs or live board, fetch all live orders
      if (statusFilter === "tabs") {
        params.append("status", "live");
      } else if (statusFilter) {
        params.append("status", statusFilter);
      }
      if (searchQuery) params.append("search", searchQuery);
      if (dateFilter) params.append("dateRange", dateFilter);

      const url = `/api/dashboard/orders?${params.toString()}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error("Fetch orders error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, [statusFilter, searchQuery, dateFilter]);

  // Group Orders by Customer Session on Table (Consolidated Table Tabs)
  // Only combine orders if they belong to the SAME table AND SAME customer group (matching name & phone)
  const tableTabs: TableTab[] = useMemo(() => {
    const tabs: TableTab[] = [];

    orders.forEach((order) => {
      if (order.status === "CANCELLED") return;

      const orderPhone = getCleanPhone(order.customerPhone);
      const orderName = getCleanName(order.customerName);

      // Find an existing tab for this table and this specific customer group
      let tab = tabs.find((t) => {
        if (t.tableId !== order.table.id) return false;

        // If an existing tab was already fully settled (paid & served) and current order is active/unpaid,
        // create a fresh tab rather than merging into the completed session
        if (order.paymentStatus !== "PAID" && !t.hasUnpaid && t.allServed) {
          return false;
        }

        const tabPhone = getCleanPhone(t.customerPhone);
        const tabName = getCleanName(t.customerName);

        // If both have phone numbers, both phone (last 10 digits) AND name must match
        if (orderPhone && tabPhone) {
          return orderPhone === tabPhone && orderName === tabName;
        }
        // If phone is missing on either, matching name is required
        return orderName.length > 0 && orderName === tabName;
      });

      if (!tab) {
        tab = {
          id: `${order.table.id}::${orderPhone || "nophone"}::${orderName || "noname"}::${order.id}`,
          tableId: order.table.id,
          tableNumber: order.table.tableNumber,
          label: order.table.label,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerNames: [order.customerName],
          orders: [],
          totalAmount: 0,
          subtotal: 0,
          taxAmount: 0,
          itemsCount: 0,
          hasUnpaid: false,
          allServed: true,
          orderRounds: [],
        };
        tabs.push(tab);
      }

      tab.orders.push(order);
      tab.totalAmount += order.totalAmount;
      tab.subtotal += order.subtotal;
      tab.taxAmount += order.taxAmount;
      tab.itemsCount += order.items.reduce((s, i) => s + i.quantity, 0);
      if (order.paymentStatus !== "PAID") tab.hasUnpaid = true;
      if (order.status !== "SERVED") tab.allServed = false;
      if (order.customerName && !tab.customerNames.includes(order.customerName)) {
        tab.customerNames.push(order.customerName);
      }
    });

    // Build chronological order rounds for each customer table tab
    tabs.forEach((tab) => {
      tab.orders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      tab.orderRounds = tab.orders.map((o, idx) => ({
        roundNumber: idx + 1,
        orderNumber: o.orderNumber,
        createdAt: o.createdAt,
        status: o.status,
        paymentStatus: o.paymentStatus,
        totalAmount: o.totalAmount,
        items: o.items,
      }));
    });

    return tabs.sort((a, b) =>
      a.tableNumber.localeCompare(b.tableNumber, undefined, { numeric: true })
    );
  }, [orders]);

  // Fast map to lookup tableTab for any order by its order.id
  const orderTabMap = useMemo(() => {
    const map = new Map<string, TableTab>();
    tableTabs.forEach((tab) => {
      tab.orders.forEach((o) => {
        map.set(o.id, tab);
      });
    });
    return map;
  }, [tableTabs]);

  const handleUpdateStatus = async (
    orderId: string,
    status?: string,
    note?: string,
    paymentStatus?: string,
    paymentMethod?: string
  ) => {
    setUpdatingId(orderId);
    try {
      const payload: Record<string, unknown> = {};
      if (status) payload.status = status;
      if (note) payload.note = note;
      if (paymentStatus) payload.paymentStatus = paymentStatus;
      if (paymentMethod) payload.paymentMethod = paymentMethod;

      const res = await fetch(`/api/dashboard/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (printReceiptOrder && printReceiptOrder.id === orderId) {
          setPrintReceiptOrder((prev) =>
            prev
              ? {
                  ...prev,
                  status: status || prev.status,
                  paymentStatus: paymentStatus || prev.paymentStatus,
                  paymentMethod: paymentMethod || prev.paymentMethod,
                }
              : null
          );
        }
        await fetchOrders();
      }
    } catch (err) {
      console.error("Status update error:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Settle all active/unpaid orders of an entire table or specific customer group tab
  const handleSettleTable = async (
    tableId: string,
    paymentStatus: string = "PAID",
    paymentMethod: string = "CASH",
    orderIds?: string[]
  ) => {
    setUpdatingId(orderIds && orderIds.length > 0 ? `tab-${orderIds[0]}` : `table-${tableId}`);
    try {
      const res = await fetch(`/api/dashboard/tables/${tableId}/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus, paymentMethod, markServed: false, orderIds }),
      });
      if (res.ok) {
        await fetchOrders();
        // If modal open for this table, refresh it
        if (printReceiptOrder) {
          setPrintReceiptOrder((prev) => (prev ? { ...prev, paymentStatus: "PAID" } : null));
        }
      }
    } catch (err) {
      console.error("Settle table error:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Open modal with Combined Table Bill
  const openTableCombinedBill = (tab: TableTab) => {
    if (tab.orders.length === 0) return;
    const latestOrder = tab.orders[tab.orders.length - 1];
    setPrintReceiptOrder(latestOrder);
    setSelectedTableTabModal(tab);
    setIsCombinedBillModal(true);
  };

  // Open modal for single order (with customer group tab fallback)
  const openOrderBill = (order: Order) => {
    const tab = orderTabMap.get(order.id) || null;
    setPrintReceiptOrder(order);
    setSelectedTableTabModal(tab);
    // If this specific customer has multiple orders, default to combined bill
    setIsCombinedBillModal(tab ? tab.orders.length > 1 : false);
  };

  const copyBillSummary = (order: Order, tab?: TableTab | null, isCombined?: boolean) => {
    if (isCombined && tab && tab.orders.length > 1) {
      const roundsText = tab.orderRounds
        .map(
          (r) =>
            `-- Round ${r.roundNumber} (#${r.orderNumber}) --\n` +
            r.items.map((i) => `  ${i.quantity}x ${i.name}: ₹${i.totalPrice}`).join("\n")
        )
        .join("\n\n");

      const summary = `🧾 CONSOLIDATED TABLE BILL: Table ${tab.tableNumber}\nGuest: ${tab.customerName || tab.customerNames.join(", ")}\nOrders Combined: ${tab.orders.length} Rounds\n\n${roundsText}\n\nSubtotal: ₹${tab.subtotal}\nTaxes: ₹${tab.taxAmount}\nGRAND TOTAL: ₹${tab.totalAmount}\nPayment: ${tab.hasUnpaid ? "UNPAID" : "PAID"}\nDate: ${new Date(tab.orders[0].createdAt).toLocaleDateString()}`;
      navigator.clipboard.writeText(summary);
      setCopiedOrderId(`tab-${tab.id}`);
      setTimeout(() => setCopiedOrderId(null), 2500);
      return;
    }

    const itemsText = order.items
      .map(
        (i) =>
          `- ${i.quantity}x ${i.name}${i.variantName ? ` (${i.variantName})` : ""}: ₹${i.totalPrice}`
      )
      .join("\n");
    const summary = `🧾 Bill for Order #${order.orderNumber}\nTable: ${order.table.tableNumber}\nCustomer: ${order.customerName}\n\n${itemsText}\n\nSubtotal: ₹${order.subtotal}\nTaxes: ₹${order.taxAmount}\nTotal Amount: ₹${order.totalAmount}\nStatus: ${order.status} | Payment: ${order.paymentStatus} (${order.paymentMethod === "PAY_AT_COUNTER" ? "Cash/Counter" : order.paymentMethod})\nDate: ${new Date(order.createdAt).toLocaleString()}`;
    navigator.clipboard.writeText(summary);
    setCopiedOrderId(order.id);
    setTimeout(() => setCopiedOrderId(null), 2500);
  };

  // Group into Kanban Columns
  const pendingOrders = orders.filter((o) => o.status === "PENDING");
  const acceptedOrders = orders.filter((o) => o.status === "ACCEPTED");
  const preparingOrders = orders.filter((o) => o.status === "PREPARING");
  const readyOrders = orders.filter((o) => o.status === "READY");
  const servedOrders = orders.filter((o) => o.status === "SERVED");

  // Multi-order tables metrics
  const multiOrderTables = tableTabs.filter((t) => t.orders.length > 1);
  const unpaidTables = tableTabs.filter((t) => t.hasUnpaid);
  const totalTableRevenue = tableTabs.reduce((s, t) => s + t.totalAmount, 0);
  const totalUnpaidTableDues = unpaidTables.reduce((s, t) => s + t.totalAmount, 0);

  // Served Orders metrics
  const totalServedRevenue = servedOrders.reduce((acc, o) => acc + o.totalAmount, 0);
  const paidServedCount = servedOrders.filter((o) => o.paymentStatus === "PAID").length;
  const unpaidServedCount = servedOrders.filter((o) => o.paymentStatus !== "PAID").length;

  const displayServedOrders = servedOrders.filter((o) => {
    if (paymentFilter === "PAID") return o.paymentStatus === "PAID";
    if (paymentFilter === "UNPAID") return o.paymentStatus !== "PAID";
    return true;
  });

  // Current active modal table tab (specific to current order's customer group)
  const activeModalTab = selectedTableTabModal || (printReceiptOrder ? orderTabMap.get(printReceiptOrder.id) || null : null);
  const modalHasMultiOrders = activeModalTab ? activeModalTab.orders.length > 1 : false;

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#2B1D18]">
              Live Order & Consolidated Table Billing
            </h1>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-xs text-[#24211F]/70 mt-1">
            Real-time kitchen order tickets, barista prep queues, multi-order table tabs, and unified tax invoice receipts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Audio Chime Test */}
          <button
            onClick={() => playOrderNotificationSound()}
            className="px-3 py-2 bg-[#FAF5EC] border border-[#E6DCCE] text-[#2B1D18] hover:bg-[#F2E9DB] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Test audio chime"
          >
            <Volume2 className="w-3.5 h-3.5 text-[#C58B5B]" />
            <span>Test Bell</span>
          </button>

          {/* Date Range Toggle */}
          <div className="flex items-center bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl p-1 text-xs">
            <button
              onClick={() => setDateFilter("today")}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all ${
                dateFilter === "today"
                  ? "bg-[#2B1D18] text-[#FAF5EC] shadow-xs"
                  : "text-[#24211F]/70 hover:text-[#2B1D18]"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateFilter("all")}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all ${
                dateFilter === "all"
                  ? "bg-[#2B1D18] text-[#FAF5EC] shadow-xs"
                  : "text-[#24211F]/70 hover:text-[#2B1D18]"
              }`}
            >
              All Time
            </button>
          </div>

          {/* View toggle */}
          <div className="flex items-center bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl p-1 text-xs">
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                viewMode === "kanban"
                  ? "bg-[#2B1D18] text-[#FAF5EC] shadow-xs"
                  : "text-[#24211F]/70 hover:text-[#2B1D18]"
              }`}
            >
              Board View
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                viewMode === "table"
                  ? "bg-[#2B1D18] text-[#FAF5EC] shadow-xs"
                  : "text-[#24211F]/70 hover:text-[#2B1D18]"
              }`}
            >
              List View
            </button>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FFFDF9] p-3 rounded-2xl border border-[#E6DCCE] shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#24211F]/50" />
          <input
            type="text"
            placeholder="Search order #, customer, table..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FAF5EC]/70 border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto text-xs pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter("live")}
            className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition-colors ${
              statusFilter === "live"
                ? "bg-[#2B1D18] text-[#FAF5EC]"
                : "bg-[#FAF5EC] border border-[#E6DCCE] text-[#24211F]/70 hover:text-[#2B1D18]"
            }`}
          >
            Live Board (All 5 Stages)
          </button>

          {/* Dedicated Table Tabs & Combined Bills Filter Button */}
          <button
            onClick={() => setStatusFilter("tabs")}
            className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition-colors flex items-center gap-1.5 ${
              statusFilter === "tabs"
                ? "bg-[#C58B5B] text-white shadow-xs font-bold"
                : "bg-[#FAF5EC] border border-[#E6DCCE] text-[#24211F]/70 hover:text-[#2B1D18]"
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5 text-[#2B1D18]" />
            <span>Table Bills / Tabs ({tableTabs.length})</span>
            {multiOrderTables.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {multiOrderTables.length} Multi
              </span>
            )}
          </button>

          <button
            onClick={() => setStatusFilter("SERVED")}
            className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition-colors flex items-center gap-1.5 ${
              statusFilter === "SERVED"
                ? "bg-stone-800 text-white shadow-xs"
                : "bg-[#FAF5EC] border border-[#E6DCCE] text-[#24211F]/70 hover:text-[#2B1D18]"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-[#C58B5B]" />
            <span>Served Orders ({servedOrders.length})</span>
          </button>

          <button
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition-colors ${
              statusFilter === "active"
                ? "bg-[#2B1D18] text-[#FAF5EC]"
                : "bg-[#FAF5EC] border border-[#E6DCCE] text-[#24211F]/70 hover:text-[#2B1D18]"
            }`}
          >
            Kitchen Queue ({pendingOrders.length + acceptedOrders.length + preparingOrders.length + readyOrders.length})
          </button>

          <button
            onClick={() => setStatusFilter("PENDING")}
            className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition-colors ${
              statusFilter === "PENDING"
                ? "bg-amber-700 text-white"
                : "bg-[#FAF5EC] border border-[#E6DCCE] text-[#24211F]/70 hover:text-[#2B1D18]"
            }`}
          >
            Pending ({pendingOrders.length})
          </button>

          <button
            onClick={() => setStatusFilter("")}
            className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition-colors ${
              statusFilter === ""
                ? "bg-[#2B1D18] text-[#FAF5EC]"
                : "bg-[#FAF5EC] border border-[#E6DCCE] text-[#24211F]/70 hover:text-[#2B1D18]"
            }`}
          >
            All Orders History
          </button>
        </div>
      </div>

      {/* DEDICATED TABLE TABS & CONSOLIDATED BILLS VIEW */}
      {statusFilter === "tabs" ? (
        <div className="space-y-6">
          {/* Table KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-[#E6DCCE] shadow-xs">
              <span className="block text-[11px] font-semibold text-[#24211F]/60">Occupied Tables</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-serif font-bold text-[#2B1D18]">{tableTabs.length}</span>
                <span className="text-[10px] text-stone-500 font-medium">Tables Active</span>
              </div>
            </div>

            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-[#E6DCCE] shadow-xs">
              <span className="block text-[11px] font-semibold text-[#24211F]/60">Multi-Order Tables (Rounds)</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-serif font-bold text-amber-700">{multiOrderTables.length}</span>
                <span className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded-md font-bold">Re-ordered</span>
              </div>
            </div>

            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-[#E6DCCE] shadow-xs">
              <span className="block text-[11px] font-semibold text-[#24211F]/60">Unpaid Table Dues</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-serif font-bold text-rose-700">
                  {formatCurrency(totalUnpaidTableDues)}
                </span>
                <span className="text-[10px] text-stone-500">({unpaidTables.length} tables)</span>
              </div>
            </div>

            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-[#E6DCCE] shadow-xs">
              <span className="block text-[11px] font-semibold text-[#24211F]/60">Total Table Sales</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-serif font-bold text-[#C58B5B]">
                  {formatCurrency(totalTableRevenue)}
                </span>
              </div>
            </div>
          </div>

          {/* Table Cards Grid */}
          {tableTabs.length === 0 ? (
            <div className="bg-[#FFFDF9] border border-dashed border-[#E6DCCE] rounded-2xl p-12 text-center space-y-3">
              <UtensilsCrossed className="w-10 h-10 text-stone-400 mx-auto" />
              <h3 className="font-serif font-bold text-base text-[#2B1D18]">No Active Dining Tables</h3>
              <p className="text-xs text-[#24211F]/60 max-w-sm mx-auto">
                When customers place orders from dining table QR codes, their running tabs and combined table bills will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {tableTabs.map((tab) => (
                <TableTabCard
                  key={tab.id}
                  tab={tab}
                  updatingId={updatingId}
                  onOpenCombinedBill={() => openTableCombinedBill(tab)}
                  onSettleTable={handleSettleTable}
                  onCopySummary={() => copyBillSummary(tab.orders[0], tab, true)}
                  isCopied={copiedOrderId === `tab-${tab.id}`}
                />
              ))}
            </div>
          )}
        </div>
      ) : statusFilter === "SERVED" ? (
        /* DEDICATED SERVED ORDERS & BILLS VIEW */
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-[#E6DCCE] shadow-xs">
              <span className="block text-[11px] font-semibold text-[#24211F]/60">Total Served</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-serif font-bold text-[#2B1D18]">{servedOrders.length}</span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md">Delivered</span>
              </div>
            </div>

            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-[#E6DCCE] shadow-xs">
              <span className="block text-[11px] font-semibold text-[#24211F]/60">Total Billed Revenue</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-serif font-bold text-[#C58B5B]">
                  {formatCurrency(totalServedRevenue)}
                </span>
              </div>
            </div>

            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-[#E6DCCE] shadow-xs">
              <span className="block text-[11px] font-semibold text-[#24211F]/60">Paid In Full</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-serif font-bold text-emerald-700">{paidServedCount}</span>
                <span className="text-[10px] text-stone-500 font-medium">Orders</span>
              </div>
            </div>

            <div className="bg-[#FFFDF9] p-4 rounded-2xl border border-[#E6DCCE] shadow-xs">
              <span className="block text-[11px] font-semibold text-[#24211F]/60">Unpaid / Counter Due</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-serif font-bold text-amber-700">{unpaidServedCount}</span>
                <span className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded-md font-bold">Pending</span>
              </div>
            </div>
          </div>

          {/* Payment Status Filter Sub-bar */}
          <div className="flex items-center justify-between gap-3 bg-[#FFFDF9] px-4 py-2.5 rounded-xl border border-[#E6DCCE]">
            <span className="text-xs font-bold text-[#2B1D18]">Filter Served Orders:</span>
            <div className="flex items-center gap-1.5 text-xs">
              <button
                onClick={() => setPaymentFilter("all")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  paymentFilter === "all" ? "bg-[#2B1D18] text-[#FAF5EC]" : "text-[#24211F]/70 hover:bg-[#FAF5EC]"
                }`}
              >
                All ({servedOrders.length})
              </button>
              <button
                onClick={() => setPaymentFilter("PAID")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  paymentFilter === "PAID" ? "bg-emerald-700 text-white" : "text-[#24211F]/70 hover:bg-[#FAF5EC]"
                }`}
              >
                Paid ({paidServedCount})
              </button>
              <button
                onClick={() => setPaymentFilter("UNPAID")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  paymentFilter === "UNPAID" ? "bg-amber-700 text-white" : "text-[#24211F]/70 hover:bg-[#FAF5EC]"
                }`}
              >
                Unpaid ({unpaidServedCount})
              </button>
            </div>
          </div>

          {/* Served Orders Display: Grid vs Table */}
          {displayServedOrders.length === 0 ? (
            <div className="bg-[#FFFDF9] border border-dashed border-[#E6DCCE] rounded-2xl p-12 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-stone-400 mx-auto" />
              <h3 className="font-serif font-bold text-base text-[#2B1D18]">No Served Orders Found</h3>
              <p className="text-xs text-[#24211F]/60 max-w-sm mx-auto">
                Orders that are served to dining tables will appear here with full customer bills, itemized receipts, and payment controls.
              </p>
            </div>
          ) : viewMode === "kanban" ? (
            /* Cards Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayServedOrders.map((order) => (
                <ServedOrderCard
                  key={order.id}
                  order={order}
                  tableTab={orderTabMap.get(order.id)}
                  updatingId={updatingId}
                  onStatusUpdate={handleUpdateStatus}
                  onViewBill={() => openOrderBill(order)}
                  onPrintReceipt={() => openOrderBill(order)}
                  onCopyBill={() => copyBillSummary(order)}
                  isCopied={copiedOrderId === order.id}
                />
              ))}
            </div>
          ) : (
            /* Table View */
            <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF5EC] text-[#24211F]/70 border-b border-[#E6DCCE] font-semibold">
                    <tr>
                      <th className="p-3">Order Number</th>
                      <th className="p-3">Table</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Items & Customizations</th>
                      <th className="p-3">Total Amount</th>
                      <th className="p-3">Payment Status</th>
                      <th className="p-3">Time</th>
                      <th className="p-3 text-right">Bill & Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#FAF5EC]">
                    {displayServedOrders.map((order) => {
                      const tab = orderTabMap.get(order.id);
                      const isMulti = tab && tab.orders.length > 1;

                      return (
                        <tr key={order.id} className="hover:bg-[#FAF5EC]/40">
                          <td className="p-3 font-serif font-bold text-[#2B1D18]">
                            #{order.orderNumber}
                          </td>
                          <td className="p-3 font-bold text-[#2B1D18]">
                            Table {order.table.tableNumber}
                            {isMulti && (
                              <span className="block text-[10px] text-amber-700 font-normal">
                                ({tab.orders.length} Orders Combined)
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-medium text-[#24211F]">
                            {order.customerName}
                          </td>
                          <td className="p-3 max-w-sm">
                            <div className="space-y-0.5">
                              {order.items.map((i) => (
                                <div key={i.id} className="text-[#24211F]/80">
                                  <span className="font-semibold">{i.quantity}x</span> {i.name}
                                  {i.variantName && ` (${i.variantName})`}
                                  {i.selectedAddOns.length > 0 && ` + ${i.selectedAddOns.map((a) => a.name).join(", ")}`}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="p-3 font-bold text-[#2B1D18]">
                            {formatCurrency(order.totalAmount)}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-block ${
                                order.paymentStatus === "PAID"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : "bg-amber-50 text-amber-800 border-amber-200"
                              }`}
                            >
                              {order.paymentStatus === "PAID" ? "PAID" : "UNPAID"} • {order.paymentMethod === "PAY_AT_COUNTER" ? "Cash" : order.paymentMethod}
                            </span>
                          </td>
                          <td className="p-3 text-[#24211F]/60">
                            {formatTimeAgo(order.createdAt)}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openOrderBill(order)}
                                className="px-2.5 py-1 bg-[#2B1D18] hover:bg-[#3D2B24] text-[#FAF5EC] rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                                title="View & Print Bill"
                              >
                                <FileText className="w-3.5 h-3.5 text-[#C58B5B]" />
                                <span>{isMulti ? "Table Bill" : "Bill"}</span>
                              </button>
                              {order.paymentStatus !== "PAID" && (
                                <button
                                  onClick={() => handleUpdateStatus(order.id, undefined, undefined, "PAID", "CASH")}
                                  disabled={updatingId === order.id}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold"
                                >
                                  Mark Paid
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : viewMode === "kanban" ? (
        /* 5-COLUMN KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-start">
          {/* Column 1: Pending */}
          <div className="space-y-3 min-w-0">
            <div className="flex items-center justify-between p-2.5 bg-amber-50 rounded-xl border border-amber-200">
              <span className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
                1. New Pending
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-xs font-bold">
                {pendingOrders.length}
              </span>
            </div>

            <div className="space-y-3">
              {pendingOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  tableTab={orderTabMap.get(order.id)}
                  updatingId={updatingId}
                  onStatusUpdate={handleUpdateStatus}
                  onPrintKOT={() => setPrintKOTOrder(order)}
                  onPrintReceipt={() => openOrderBill(order)}
                />
              ))}
              {pendingOrders.length === 0 && (
                <div className="text-center py-8 text-xs text-[#24211F]/40 border border-dashed border-[#E6DCCE] rounded-xl">
                  No new pending orders
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Accepted & Queued */}
          <div className="space-y-3 min-w-0">
            <div className="flex items-center justify-between p-2.5 bg-blue-50 rounded-xl border border-blue-200">
              <span className="font-bold text-xs text-blue-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                2. Accepted
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-200 text-blue-900 text-xs font-bold">
                {acceptedOrders.length}
              </span>
            </div>

            <div className="space-y-3">
              {acceptedOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  tableTab={orderTabMap.get(order.id)}
                  updatingId={updatingId}
                  onStatusUpdate={handleUpdateStatus}
                  onPrintKOT={() => setPrintKOTOrder(order)}
                  onPrintReceipt={() => openOrderBill(order)}
                />
              ))}
              {acceptedOrders.length === 0 && (
                <div className="text-center py-8 text-xs text-[#24211F]/40 border border-dashed border-[#E6DCCE] rounded-xl">
                  Queue is clear
                </div>
              )}
            </div>
          </div>

          {/* Column 3: In Prep */}
          <div className="space-y-3 min-w-0">
            <div className="flex items-center justify-between p-2.5 bg-purple-50 rounded-xl border border-purple-200">
              <span className="font-bold text-xs text-purple-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                3. Kitchen Prep
              </span>
              <span className="px-2 py-0.5 rounded-full bg-purple-200 text-purple-900 text-xs font-bold">
                {preparingOrders.length}
              </span>
            </div>

            <div className="space-y-3">
              {preparingOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  tableTab={orderTabMap.get(order.id)}
                  updatingId={updatingId}
                  onStatusUpdate={handleUpdateStatus}
                  onPrintKOT={() => setPrintKOTOrder(order)}
                  onPrintReceipt={() => openOrderBill(order)}
                />
              ))}
              {preparingOrders.length === 0 && (
                <div className="text-center py-8 text-xs text-[#24211F]/40 border border-dashed border-[#E6DCCE] rounded-xl">
                  No active prep tickets
                </div>
              )}
            </div>
          </div>

          {/* Column 4: Ready for Table */}
          <div className="space-y-3 min-w-0">
            <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="font-bold text-xs text-emerald-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                4. Ready to Serve
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-xs font-bold">
                {readyOrders.length}
              </span>
            </div>

            <div className="space-y-3">
              {readyOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  tableTab={orderTabMap.get(order.id)}
                  updatingId={updatingId}
                  onStatusUpdate={handleUpdateStatus}
                  onPrintKOT={() => setPrintKOTOrder(order)}
                  onPrintReceipt={() => openOrderBill(order)}
                />
              ))}
              {readyOrders.length === 0 && (
                <div className="text-center py-8 text-xs text-[#24211F]/40 border border-dashed border-[#E6DCCE] rounded-xl">
                  No staged orders
                </div>
              )}
            </div>
          </div>

          {/* Column 5: Served & Billed */}
          <div className="space-y-3 min-w-0">
            <div className="flex items-center justify-between p-2.5 bg-stone-100 rounded-xl border border-stone-300">
              <span className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-stone-700" />
                5. Served & Billed
              </span>
              <span className="px-2 py-0.5 rounded-full bg-stone-300 text-stone-900 text-xs font-bold">
                {servedOrders.length}
              </span>
            </div>

            <div className="space-y-3 max-h-[80vh] overflow-y-auto pr-1">
              {servedOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  tableTab={orderTabMap.get(order.id)}
                  updatingId={updatingId}
                  onStatusUpdate={handleUpdateStatus}
                  onPrintKOT={() => setPrintKOTOrder(order)}
                  onPrintReceipt={() => openOrderBill(order)}
                />
              ))}
              {servedOrders.length === 0 && (
                <div className="text-center py-8 text-xs text-[#24211F]/40 border border-dashed border-[#E6DCCE] rounded-xl">
                  No served orders yet
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* TABLE LIST VIEW */
        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF5EC] text-[#24211F]/70 border-b border-[#E6DCCE] font-semibold">
                <tr>
                  <th className="p-3">Order Number</th>
                  <th className="p-3">Table</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Items & Customizations</th>
                  <th className="p-3">Total Amount</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Elapsed Time</th>
                  <th className="p-3">Current Status</th>
                  <th className="p-3 text-right">Actions & Bill</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FAF5EC]">
                {orders.map((order) => {
                  const meta = getStatusDetails(order.status);
                  const tab = orderTabMap.get(order.id);
                  const isMulti = tab && tab.orders.length > 1;

                  return (
                    <tr key={order.id} className="hover:bg-[#FAF5EC]/40">
                      <td className="p-3 font-serif font-bold text-[#2B1D18]">
                        #{order.orderNumber}
                      </td>
                      <td className="p-3 font-bold text-[#2B1D18]">
                        Table {order.table.tableNumber}
                        {isMulti && (
                          <span className="block text-[10px] text-amber-700 font-normal">
                            ({tab.orders.length} Rounds Combined)
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-medium text-[#24211F]">
                        {order.customerName}
                      </td>
                      <td className="p-3 max-w-sm">
                        <div className="space-y-0.5">
                          {order.items.map((i) => (
                            <div key={i.id} className="text-[#24211F]/80">
                              <span className="font-semibold">{i.quantity}x</span> {i.name}
                              {i.variantName && ` (${i.variantName})`}
                              {i.selectedAddOns.length > 0 && ` + ${i.selectedAddOns.map((a) => a.name).join(", ")}`}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 font-bold text-[#2B1D18]">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border inline-block ${
                            order.paymentStatus === "PAID"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          {order.paymentStatus === "PAID" ? "PAID" : "UNPAID"}
                        </span>
                      </td>
                      <td className="p-3 text-[#24211F]/60">
                        {formatTimeAgo(order.createdAt)}
                      </td>
                      <td className="p-3">
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
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPrintKOTOrder(order)}
                            title="Print KOT"
                            className="p-1.5 rounded-lg text-[#24211F]/60 hover:text-[#2B1D18] hover:bg-[#E6DCCE]"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openOrderBill(order)}
                            title="View / Print Tax Invoice Bill"
                            className="px-2 py-1 bg-[#2B1D18] hover:bg-[#3D2B24] text-[#FAF5EC] rounded-lg text-xs font-semibold flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#C58B5B]" />
                            <span>{isMulti ? "Table Bill" : "Bill"}</span>
                          </button>

                          {order.status === "PENDING" && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, "ACCEPTED")}
                              className="px-2 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold"
                            >
                              Accept
                            </button>
                          )}
                          {order.status === "ACCEPTED" && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, "PREPARING")}
                              className="px-2 py-1 bg-purple-600 text-white rounded-lg text-[10px] font-bold"
                            >
                              Start Prep
                            </button>
                          )}
                          {order.status === "PREPARING" && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, "READY")}
                              className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold"
                            >
                              Ready
                            </button>
                          )}
                          {order.status === "READY" && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, "SERVED")}
                              className="px-2 py-1 bg-stone-800 text-white rounded-lg text-[10px] font-bold"
                            >
                              Serve
                            </button>
                          )}
                          {order.status === "SERVED" && order.paymentStatus !== "PAID" && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, undefined, undefined, "PAID", "CASH")}
                              className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold"
                            >
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PRINT KOT MODAL */}
      {printKOTOrder && (
        <div className="fixed inset-0 z-50 bg-[#2B1D18]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between no-print">
              <h3 className="font-bold text-sm text-stone-900">
                Kitchen Order Ticket (KOT)
              </h3>
              <button
                onClick={() => setPrintKOTOrder(null)}
                className="text-stone-500 hover:text-stone-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[70vh]">
              <PrintableKOT
                orderNumber={printKOTOrder.orderNumber}
                tableNumber={printKOTOrder.table.tableNumber}
                customerName={printKOTOrder.customerName}
                createdAt={printKOTOrder.createdAt}
                items={printKOTOrder.items}
                notes={printKOTOrder.notes}
              />
            </div>

            <div className="flex gap-2 no-print pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-stone-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Ticket
              </button>
              <button
                onClick={() => setPrintKOTOrder(null)}
                className="px-4 py-2 border border-stone-300 rounded-xl text-xs text-stone-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT RECEIPT / CONSOLIDATED TABLE BILL MODAL */}
      {printReceiptOrder && (
        <div className="fixed inset-0 z-50 bg-[#2B1D18]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between no-print border-b border-stone-200 pb-3">
              <div>
                <h3 className="font-bold text-sm text-stone-900">
                  {isCombinedBillModal && modalHasMultiOrders
                    ? "Consolidated Table Invoice"
                    : "Tax Invoice / Receipt"}
                </h3>
                <span className="text-[11px] text-stone-500">
                  Table {printReceiptOrder.table.tableNumber}
                  {isCombinedBillModal && modalHasMultiOrders
                    ? ` • ${activeModalTab?.orders.length} Orders Combined`
                    : ` • #${printReceiptOrder.orderNumber}`}
                </span>
              </div>
              <button
                onClick={() => {
                  setPrintReceiptOrder(null);
                  setSelectedTableTabModal(null);
                }}
                className="text-stone-500 hover:text-stone-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Toggle between Combined Table Bill & Single Order Ticket */}
            {modalHasMultiOrders && activeModalTab && (
              <div className="flex bg-[#FAF5EC] p-1 rounded-xl border border-[#E6DCCE] text-xs no-print">
                <button
                  onClick={() => setIsCombinedBillModal(true)}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                    isCombinedBillModal
                      ? "bg-[#2B1D18] text-[#FAF5EC] shadow-xs"
                      : "text-[#24211F]/70 hover:text-[#2B1D18]"
                  }`}
                >
                  Combined Table Bill ({activeModalTab.orders.length} Orders)
                </button>
                <button
                  onClick={() => setIsCombinedBillModal(false)}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                    !isCombinedBillModal
                      ? "bg-[#2B1D18] text-[#FAF5EC] shadow-xs"
                      : "text-[#24211F]/70 hover:text-[#2B1D18]"
                  }`}
                >
                  Ticket #{printReceiptOrder.orderNumber} Only
                </button>
              </div>
            )}

            {/* In-Modal Payment Control: Handles single order or entire table settlement */}
            <div className="no-print">
              {(isCombinedBillModal && activeModalTab ? activeModalTab.hasUnpaid : printReceiptOrder.paymentStatus !== "PAID") ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-amber-900 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      {isCombinedBillModal && modalHasMultiOrders
                        ? "Table Balance Due: UNPAID"
                        : "Payment: UNPAID"}
                    </span>
                    <span className="text-[11px] font-bold text-amber-900">
                      Due: {formatCurrency(isCombinedBillModal && activeModalTab ? activeModalTab.totalAmount : printReceiptOrder.totalAmount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        if (isCombinedBillModal && activeModalTab) {
                          handleSettleTable(activeModalTab.tableId, "PAID", "CASH", activeModalTab.orders.map((o) => o.id));
                        } else {
                          handleUpdateStatus(printReceiptOrder.id, undefined, undefined, "PAID", "CASH");
                        }
                      }}
                      disabled={updatingId !== null}
                      className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition-colors"
                    >
                      ✓ {isCombinedBillModal && modalHasMultiOrders ? "Settle Table (Cash)" : "Mark Paid (Cash)"}
                    </button>
                    <button
                      onClick={() => {
                        if (isCombinedBillModal && activeModalTab) {
                          handleSettleTable(activeModalTab.tableId, "PAID", "UPI_ONLINE", activeModalTab.orders.map((o) => o.id));
                        } else {
                          handleUpdateStatus(printReceiptOrder.id, undefined, undefined, "PAID", "UPI_ONLINE");
                        }
                      }}
                      disabled={updatingId !== null}
                      className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition-colors"
                    >
                      ✓ {isCombinedBillModal && modalHasMultiOrders ? "Settle Table (UPI)" : "Mark Paid (UPI)"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between text-xs text-emerald-800">
                  <span className="font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {isCombinedBillModal && modalHasMultiOrders
                      ? "Entire Table Bill Settled ✓"
                      : `Payment Settled (${printReceiptOrder.paymentMethod === "PAY_AT_COUNTER" ? "Cash" : printReceiptOrder.paymentMethod})`}
                  </span>
                  <button
                    onClick={() => {
                      if (isCombinedBillModal && activeModalTab) {
                        handleSettleTable(activeModalTab.tableId, "UNPAID", "CASH", activeModalTab.orders.map((o) => o.id));
                      } else {
                        handleUpdateStatus(printReceiptOrder.id, undefined, undefined, "UNPAID");
                      }
                    }}
                    className="text-[10px] text-stone-500 hover:underline"
                  >
                    Mark Unpaid
                  </button>
                </div>
              )}
            </div>

            <div className="overflow-y-auto max-h-[55vh]">
              {isCombinedBillModal && activeModalTab && modalHasMultiOrders ? (
                <PrintableReceipt
                  cafeName={printReceiptOrder.cafe?.name || "Aura Specialty Roastery"}
                  cafeAddress={printReceiptOrder.cafe?.address || "Plot 42, Heritage Quarter, Lavelle Boulevard, Bengaluru"}
                  cafePhone={printReceiptOrder.cafe?.phone || "+91 22 4920 8800"}
                  orderNumber={activeModalTab.orders.map((o) => o.orderNumber).join(", #")}
                  tableNumber={activeModalTab.tableNumber}
                  customerName={activeModalTab.customerName || activeModalTab.customerNames.join(", ")}
                  createdAt={activeModalTab.orders[0].createdAt}
                  items={activeModalTab.orders.flatMap((o) => o.items)}
                  subtotal={activeModalTab.subtotal}
                  taxAmount={activeModalTab.taxAmount}
                  totalAmount={activeModalTab.totalAmount}
                  paymentMethod={printReceiptOrder.paymentMethod}
                  paymentStatus={activeModalTab.hasUnpaid ? "UNPAID" : "PAID"}
                  isCombinedTableBill={true}
                  orderNumbers={activeModalTab.orders.map((o) => o.orderNumber)}
                  orderRounds={activeModalTab.orderRounds}
                />
              ) : (
                <PrintableReceipt
                  cafeName={printReceiptOrder.cafe?.name || "Aura Specialty Roastery"}
                  cafeAddress={printReceiptOrder.cafe?.address || "Plot 42, Heritage Quarter, Lavelle Boulevard, Bengaluru"}
                  cafePhone={printReceiptOrder.cafe?.phone || "+91 22 4920 8800"}
                  orderNumber={printReceiptOrder.orderNumber}
                  tableNumber={printReceiptOrder.table.tableNumber}
                  customerName={printReceiptOrder.customerName}
                  createdAt={printReceiptOrder.createdAt}
                  items={printReceiptOrder.items}
                  subtotal={printReceiptOrder.subtotal}
                  taxAmount={printReceiptOrder.taxAmount}
                  totalAmount={printReceiptOrder.totalAmount}
                  paymentMethod={printReceiptOrder.paymentMethod}
                  paymentStatus={printReceiptOrder.paymentStatus}
                />
              )}
            </div>

            <div className="flex gap-2 no-print pt-2 border-t border-stone-200">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-[#2B1D18] hover:bg-[#3D2B24] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4 text-[#C58B5B]" />
                <span>Print {isCombinedBillModal && modalHasMultiOrders ? "Table Bill" : "Receipt"}</span>
              </button>
              <button
                onClick={() =>
                  copyBillSummary(
                    printReceiptOrder,
                    activeModalTab,
                    isCombinedBillModal && modalHasMultiOrders
                  )
                }
                className="px-3 py-2 border border-stone-300 hover:bg-stone-50 rounded-xl text-xs text-stone-700 font-semibold flex items-center gap-1"
                title="Copy Bill Summary to Clipboard"
              >
                {copiedOrderId === printReceiptOrder.id ||
                (activeModalTab && copiedOrderId === `tab-${activeModalTab.id}`) ? (
                  <>
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-stone-500" />
                    <span>Copy</span>
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setPrintReceiptOrder(null);
                  setSelectedTableTabModal(null);
                }}
                className="px-3 py-2 border border-stone-300 rounded-xl text-xs text-stone-700"
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

// Table Tab Card for Dedicated Table Tabs & Combined Bills Center
function TableTabCard({
  tab,
  updatingId,
  onOpenCombinedBill,
  onSettleTable,
  onCopySummary,
  isCopied,
}: {
  tab: TableTab;
  updatingId: string | null;
  onOpenCombinedBill: () => void;
  onSettleTable: (
    tableId: string,
    paymentStatus?: string,
    paymentMethod?: string,
    orderIds?: string[]
  ) => void;
  onCopySummary: () => void;
  isCopied: boolean;
}) {
  const isUpdating = updatingId === `tab-${tab.id}` || (tab.orders[0] && updatingId === `tab-${tab.orders[0].id}`);
  const isMulti = tab.orders.length > 1;

  return (
    <div
      className={`rounded-2xl border p-5 shadow-xs space-y-4 transition-all relative ${
        tab.hasUnpaid
          ? "bg-[#FFFDF9] border-[#E6DCCE] hover:border-[#C58B5B]"
          : "bg-[#FAF5EC]/40 border-stone-300"
      }`}
    >
      {/* Card Header: Table # and Total Bill */}
      <div className="flex items-start justify-between border-b border-[#FAF5EC] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-lg text-[#2B1D18]">
              Table {tab.tableNumber}
            </span>
            {isMulti && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                {tab.orders.length} Rounds
              </span>
            )}
          </div>
          <div className="text-xs text-[#24211F]/70 mt-0.5">
            <span>Guest: <strong className="text-[#2B1D18]">{tab.customerName || tab.customerNames.join(", ")}</strong></span>
            {tab.customerPhone && (
              <span className="block text-[11px] text-[#24211F]/50 font-mono mt-0.5">
                📞 {tab.customerPhone}
              </span>
            )}
          </div>
        </div>

        <div className="text-right">
          <span className="block font-serif font-bold text-lg text-[#C58B5B]">
            {formatCurrency(tab.totalAmount)}
          </span>
          <span className="text-[10px] text-[#24211F]/50">
            {tab.itemsCount} total items
          </span>
        </div>
      </div>

      {/* Chronological Order Rounds Breakdown */}
      <div className="space-y-2 bg-[#FAF5EC]/70 p-3 rounded-xl border border-[#E6DCCE]/60 max-h-48 overflow-y-auto">
        {tab.orderRounds.map((round) => {
          const rMeta = getStatusDetails(round.status);
          return (
            <div key={round.orderNumber} className="space-y-1 text-xs border-b border-[#E6DCCE]/40 pb-2 last:border-b-0 last:pb-0">
              <div className="flex items-center justify-between font-semibold text-[#2B1D18]">
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#2B1D18] text-[#FAF5EC] text-[9px] flex items-center justify-center font-bold">
                    {round.roundNumber}
                  </span>
                  <span>#{round.orderNumber}</span>
                  <span className="text-[10px] text-[#24211F]/50 font-normal">
                    ({formatTimeAgo(round.createdAt)})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                    style={{ backgroundColor: rMeta.badgeBg, color: rMeta.badgeColor }}
                  >
                    {rMeta.label}
                  </span>
                  <span className="font-bold text-[#2B1D18]">
                    {formatCurrency(round.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Items in this round */}
              <div className="pl-5 text-[11px] text-[#24211F]/70 space-y-0.5">
                {round.items.map((i) => (
                  <div key={i.id} className="flex justify-between">
                    <span>
                      {i.quantity}x {i.name} {i.variantName && `(${i.variantName})`}
                    </span>
                    <span>{formatCurrency(i.totalPrice)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <div className="pt-2 border-t border-[#E6DCCE] flex justify-between text-[11px] font-bold text-[#2B1D18]">
          <span>Combined Grand Total:</span>
          <span className="text-[#C58B5B]">{formatCurrency(tab.totalAmount)}</span>
        </div>
      </div>

      {/* Payment Settlement Status Bar */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1 ${
              !tab.hasUnpaid
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
            }`}
          >
            {!tab.hasUnpaid ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>TABLE SETTLED (PAID)</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>UNPAID DUE</span>
              </>
            )}
          </span>
        </div>

        {tab.hasUnpaid && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onSettleTable(tab.tableId, "PAID", "CASH", tab.orders.map((o) => o.id))}
              disabled={isUpdating}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              Pay Cash
            </button>
            <button
              onClick={() => onSettleTable(tab.tableId, "PAID", "UPI_ONLINE", tab.orders.map((o) => o.id))}
              disabled={isUpdating}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              Pay UPI
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons: View Combined Bill, Print, Copy */}
      <div className="pt-2 border-t border-[#FAF5EC] flex items-center justify-between gap-2">
        <button
          onClick={onOpenCombinedBill}
          className="flex-1 py-2 px-3 bg-[#2B1D18] hover:bg-[#3D2B24] text-[#FAF5EC] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
        >
          <FileText className="w-3.5 h-3.5 text-[#C58B5B]" />
          <span>View & Print Combined Bill</span>
        </button>

        <button
          onClick={onCopySummary}
          title="Copy Consolidated Bill Summary"
          className="p-2 bg-[#FAF5EC] hover:bg-[#F2E9DB] border border-[#E6DCCE] text-[#24211F]/70 rounded-xl text-xs"
        >
          {isCopied ? (
            <CheckCheck className="w-4 h-4 text-emerald-600" />
          ) : (
            <Copy className="w-4 h-4 text-[#24211F]/60" />
          )}
        </button>
      </div>
    </div>
  );
}

// Reusable Order Card for Kanban Columns
function OrderCard({
  order,
  tableTab,
  updatingId,
  onStatusUpdate,
  onPrintKOT,
  onPrintReceipt,
}: {
  order: Order;
  tableTab?: TableTab;
  updatingId: string | null;
  onStatusUpdate: (
    orderId: string,
    status?: string,
    note?: string,
    paymentStatus?: string,
    paymentMethod?: string
  ) => void;
  onPrintKOT: () => void;
  onPrintReceipt: () => void;
}) {
  const isUpdating = updatingId === order.id;
  const isServed = order.status === "SERVED";
  const isMulti = tableTab && tableTab.orders.length > 1;

  return (
    <div
      className={`rounded-2xl border p-3.5 sm:p-4 shadow-xs space-y-3 transition-colors relative overflow-hidden min-w-0 ${
        isServed
          ? "bg-[#FAF5EC]/40 border-stone-300 hover:border-stone-500"
          : "bg-[#FFFDF9] border-[#E6DCCE] hover:border-[#C58B5B]"
      }`}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between border-b border-[#FAF5EC] pb-2.5">
        <div>
          <span className="block font-serif font-bold text-sm text-[#2B1D18]">
            #{order.orderNumber}
          </span>
          <span className="text-[11px] font-bold text-[#C58B5B]">
            Table {order.table.tableNumber}
          </span>
        </div>

        <div className="text-right">
          <span className="block font-bold text-xs text-[#2B1D18]">
            {formatCurrency(order.totalAmount)}
          </span>
          <span className="text-[10px] text-[#24211F]/50 flex items-center justify-end gap-1">
            <Clock className="w-3 h-3" />
            {formatTimeAgo(order.createdAt)}
          </span>
        </div>
      </div>

      {/* Multi-Order Table Tag */}
      {isMulti && (
        <div className="bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg flex items-center justify-between text-[10px] text-amber-900 font-semibold">
          <span>Table {order.table.tableNumber}: {tableTab.orders.length} Rounds Placed</span>
          <span>Combined: {formatCurrency(tableTab.totalAmount)}</span>
        </div>
      )}

      {/* Guest Name & Payment Status */}
      <div className="flex items-center justify-between text-xs">
        <div>
          <span className="text-[#24211F]/60">Guest:</span>{" "}
          <strong className="text-[#2B1D18]">{order.customerName}</strong>
        </div>
        <span
          className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${
            order.paymentStatus === "PAID"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-amber-50 text-amber-800 border-amber-200"
          }`}
        >
          {order.paymentStatus}
        </span>
      </div>

      {/* Item List */}
      <div className="space-y-1.5 text-xs bg-[#FAF5EC]/60 p-2.5 rounded-xl border border-[#E6DCCE]/60">
        {order.items.map((item) => (
          <div key={item.id} className="space-y-0.5">
            <div className="flex justify-between font-medium text-[#2B1D18]">
              <span>
                <strong className="text-[#C58B5B]">{item.quantity}x</strong> {item.name}
              </span>
            </div>
            {item.variantName && (
              <span className="block text-[10px] text-[#24211F]/60 pl-3">
                Size: {item.variantName}
              </span>
            )}
            {item.selectedAddOns.length > 0 && (
              <span className="block text-[10px] text-[#75856B] pl-3">
                + {item.selectedAddOns.map((a) => a.name).join(", ")}
              </span>
            )}
            {item.specialInstructions && (
              <span className="block text-[10px] text-amber-800 bg-amber-50 p-1 rounded-xs font-semibold">
                ⚠️ Note: {item.specialInstructions}
              </span>
            )}
          </div>
        ))}

        {order.notes && (
          <div className="pt-1 text-[10px] text-purple-900 border-t border-[#E6DCCE] font-medium">
            Order Note: &quot;{order.notes}&quot;
          </div>
        )}
      </div>

      {/* Action Buttons: Clean 2-Row Layout to prevent horizontal blowout/overlap */}
      <div className="pt-2.5 border-t border-[#FAF5EC] space-y-2">
        {/* Row 1: Auxiliary / Utility Actions (KOT, Bill receipt) & Served status */}
        <div className="flex items-center justify-between gap-1.5 text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              onClick={onPrintKOT}
              title="Print Kitchen Ticket (KOT)"
              className="px-2 py-1 rounded-lg border border-[#E6DCCE] hover:bg-[#FAF5EC] text-[#24211F]/70 text-[11px] font-medium flex items-center gap-1 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-[#24211F]/60" />
              <span>KOT</span>
            </button>
            <button
              onClick={onPrintReceipt}
              title={isMulti ? "View Combined Table Bill" : "View Bill Receipt"}
              className="px-2 py-1 rounded-lg border border-[#E6DCCE] bg-[#2B1D18] hover:bg-[#3D2B24] text-[#FAF5EC] text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-[#C58B5B]" />
              <span>{isMulti ? "Table Bill" : "Bill"}</span>
            </button>
          </div>

          {/* Quick status / reopen indicator for served */}
          {order.status === "SERVED" && (
            <div className="flex items-center gap-1">
              {order.paymentStatus === "PAID" ? (
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  Paid ✓
                </span>
              ) : null}
              <button
                onClick={() => onStatusUpdate(order.id, "READY", "Reopened by staff")}
                disabled={isUpdating}
                className="p-1 text-stone-500 hover:bg-stone-200 rounded-md text-xs transition-colors"
                title="Move back to Ready"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Row 2: Primary Workflow Action Button (Full width, clear touch-targets, zero overflow) */}
        <div className="w-full">
          {order.status === "PENDING" && (
            <div className="flex items-center gap-1.5 w-full">
              <button
                onClick={() => onStatusUpdate(order.id, "ACCEPTED")}
                disabled={isUpdating}
                className="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>Accept Order</span>
              </button>
              <button
                onClick={() => onStatusUpdate(order.id, "CANCELLED", "Declined by kitchen")}
                disabled={isUpdating}
                className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 hover:border-rose-300 rounded-xl text-xs transition-colors shrink-0"
                title="Decline / Reject order"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {order.status === "ACCEPTED" && (
            <button
              onClick={() => onStatusUpdate(order.id, "PREPARING")}
              disabled={isUpdating}
              className="w-full py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <Play className="w-3.5 h-3.5 shrink-0" />
              <span>Start Prep</span>
            </button>
          )}

          {order.status === "PREPARING" && (
            <button
              onClick={() => onStatusUpdate(order.id, "READY")}
              disabled={isUpdating}
              className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>Mark Ready</span>
            </button>
          )}

          {order.status === "READY" && (
            <div className="flex items-center gap-1.5 w-full">
              {order.customerPhone ? (
                <a
                  href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                    `Hello ${order.customerName}! ☕ Your order #${order.orderNumber} at ${order.cafe?.name || "our cafe"} for Table ${order.table.tableNumber} is FRESHLY PREPARED & READY! Please enjoy your food.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors text-center min-w-0"
                  title="Notify customer on WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">WhatsApp</span>
                </a>
              ) : null}
              <button
                onClick={() => onStatusUpdate(order.id, "SERVED")}
                disabled={isUpdating}
                className={`${order.customerPhone ? "flex-1" : "w-full"} py-1.5 px-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors min-w-0`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Serve</span>
              </button>
            </div>
          )}

          {order.status === "SERVED" && (
            <div>
              {order.paymentStatus !== "PAID" ? (
                <button
                  onClick={() => onStatusUpdate(order.id, undefined, undefined, "PAID", "CASH")}
                  disabled={isUpdating}
                  className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  title="Mark as Paid"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Collect Payment (Paid)</span>
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Card for Dedicated Served Orders & Bills Center
function ServedOrderCard({
  order,
  tableTab,
  updatingId,
  onStatusUpdate,
  onViewBill,
  onPrintReceipt,
  onCopyBill,
  isCopied,
}: {
  order: Order;
  tableTab?: TableTab;
  updatingId: string | null;
  onStatusUpdate: (
    orderId: string,
    status?: string,
    note?: string,
    paymentStatus?: string,
    paymentMethod?: string
  ) => void;
  onViewBill: () => void;
  onPrintReceipt: () => void;
  onCopyBill: () => void;
  isCopied: boolean;
}) {
  const isUpdating = updatingId === order.id;
  const isMulti = tableTab && tableTab.orders.length > 1;

  return (
    <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] hover:border-[#C58B5B] transition-all p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-[#FAF5EC] pb-3">
        <div>
          <span className="font-serif font-bold text-base text-[#2B1D18]">
            #{order.orderNumber}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-bold text-[#C58B5B]">
              Table {order.table.tableNumber}
            </span>
            <span className="text-[11px] text-[#24211F]/50">• {order.customerName}</span>
          </div>
        </div>

        <div className="text-right">
          <span className="font-serif font-bold text-base text-[#2B1D18]">
            {formatCurrency(order.totalAmount)}
          </span>
          <span className="block text-[10px] text-[#24211F]/50">
            {formatTimeAgo(order.createdAt)}
          </span>
        </div>
      </div>

      {/* Multi-Order Table Running Tab Notice */}
      {isMulti && (
        <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center justify-between text-xs text-amber-900 font-semibold">
          <span>Table {order.table.tableNumber}: {tableTab.orders.length} Rounds Placed</span>
          <span>Combined Bill: {formatCurrency(tableTab.totalAmount)}</span>
        </div>
      )}

      {/* Items Breakdown */}
      <div className="space-y-1 text-xs bg-[#FAF5EC]/70 p-3 rounded-xl border border-[#E6DCCE]/60">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between items-center text-[#24211F]/80">
            <span>
              <strong className="text-[#2B1D18]">{item.quantity}x</strong> {item.name}
              {item.variantName && ` (${item.variantName})`}
              {item.selectedAddOns.length > 0 && ` + ${item.selectedAddOns.map((a) => a.name).join(", ")}`}
            </span>
            <span className="font-medium text-[#2B1D18]">{formatCurrency(item.totalPrice)}</span>
          </div>
        ))}

        <div className="pt-2 border-t border-[#E6DCCE] flex justify-between text-[11px] text-[#24211F]/60">
          <span>Subtotal: {formatCurrency(order.subtotal)} | Tax: {formatCurrency(order.taxAmount)}</span>
          <span className="font-bold text-[#2B1D18]">Ticket Total: {formatCurrency(order.totalAmount)}</span>
        </div>
      </div>

      {/* Payment & Status Bar */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1 ${
              order.paymentStatus === "PAID"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
            }`}
          >
            {order.paymentStatus === "PAID" ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>PAID</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>UNPAID</span>
              </>
            )}
          </span>
          <span className="text-[11px] text-[#24211F]/60">
            {order.paymentMethod === "PAY_AT_COUNTER" ? "Cash/Counter" : order.paymentMethod}
          </span>
        </div>

        {order.paymentStatus !== "PAID" && (
          <button
            onClick={() => onStatusUpdate(order.id, undefined, undefined, "PAID", "CASH")}
            disabled={isUpdating}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            Mark Paid
          </button>
        )}
      </div>

      {/* Primary Actions: Bill Receipt, Print, Copy */}
      <div className="pt-2 border-t border-[#FAF5EC] flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-1">
          <button
            onClick={onViewBill}
            className="flex-1 py-2 px-3 bg-[#2B1D18] hover:bg-[#3D2B24] text-[#FAF5EC] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-[#C58B5B]" />
            <span>{isMulti ? "View Table Bill" : "View Bill"}</span>
          </button>
          <button
            onClick={onPrintReceipt}
            title="Print Tax Invoice"
            className="p-2 bg-[#FAF5EC] hover:bg-[#F2E9DB] border border-[#E6DCCE] text-[#2B1D18] rounded-xl text-xs"
          >
            <Printer className="w-4 h-4 text-[#C58B5B]" />
          </button>
          <button
            onClick={onCopyBill}
            title="Copy Receipt Summary"
            className="p-2 bg-[#FAF5EC] hover:bg-[#F2E9DB] border border-[#E6DCCE] text-[#24211F]/70 rounded-xl text-xs"
          >
            {isCopied ? (
              <CheckCheck className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4 text-[#24211F]/60" />
            )}
          </button>
        </div>

        <button
          onClick={() => onStatusUpdate(order.id, "READY", "Reopened by staff")}
          disabled={isUpdating}
          className="p-2 text-stone-500 hover:bg-stone-100 rounded-xl text-xs"
          title="Move back to Ready queue"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
