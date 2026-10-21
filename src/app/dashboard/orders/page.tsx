"use client";

import { useState, useEffect } from "react";
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
  table: {
    id: string;
    tableNumber: string;
    label?: string | null;
  };
  items: OrderItem[];
}

export default function LiveOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Print Modals
  const [printKOTOrder, setPrintKOTOrder] = useState<Order | null>(null);
  const [printReceiptOrder, setPrintReceiptOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    try {
      const url = `/api/dashboard/orders?status=${statusFilter}${searchQuery ? `&search=${searchQuery}` : ""}`;
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
  }, [statusFilter, searchQuery]);

  const handleUpdateStatus = async (orderId: string, status: string, note?: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/dashboard/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note }),
      });
      if (res.ok) {
        await fetchOrders();
      }
    } catch (err) {
      console.error("Status update error:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Group into Kanban Columns
  const pendingOrders = orders.filter((o) => o.status === "PENDING");
  const acceptedOrders = orders.filter((o) => o.status === "ACCEPTED");
  const preparingOrders = orders.filter((o) => o.status === "PREPARING");
  const readyOrders = orders.filter((o) => o.status === "READY");
  const servedOrders = orders.filter((o) => o.status === "SERVED");

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#2B1D18]">
              Live Order Manager
            </h1>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-xs text-[#24211F]/70 mt-1">
            Real-time kitchen order tickets, barista prep queues, and service table dispatch.
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
              Kitchen Board
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

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto text-xs">
          <button
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition-colors ${
              statusFilter === "active"
                ? "bg-[#2B1D18] text-[#FAF5EC]"
                : "bg-[#FAF5EC] border border-[#E6DCCE] text-[#24211F]/70"
            }`}
          >
            Active In-Kitchen ({pendingOrders.length + acceptedOrders.length + preparingOrders.length + readyOrders.length})
          </button>
          <button
            onClick={() => setStatusFilter("PENDING")}
            className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition-colors ${
              statusFilter === "PENDING"
                ? "bg-amber-700 text-white"
                : "bg-[#FAF5EC] border border-[#E6DCCE] text-[#24211F]/70"
            }`}
          >
            Pending ({pendingOrders.length})
          </button>
          <button
            onClick={() => setStatusFilter("SERVED")}
            className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition-colors ${
              statusFilter === "SERVED"
                ? "bg-stone-800 text-white"
                : "bg-[#FAF5EC] border border-[#E6DCCE] text-[#24211F]/70"
            }`}
          >
            Served
          </button>
          <button
            onClick={() => setStatusFilter("")}
            className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition-colors ${
              statusFilter === ""
                ? "bg-[#2B1D18] text-[#FAF5EC]"
                : "bg-[#FAF5EC] border border-[#E6DCCE] text-[#24211F]/70"
            }`}
          >
            All Orders
          </button>
        </div>
      </div>

      {/* KANBAN BOARD VIEW */}
      {viewMode === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {/* Column 1: Pending */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2.5 bg-amber-50 rounded-xl border border-amber-200">
              <span className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
                1. New Pending Orders
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
                  updatingId={updatingId}
                  onStatusUpdate={handleUpdateStatus}
                  onPrintKOT={() => setPrintKOTOrder(order)}
                  onPrintReceipt={() => setPrintReceiptOrder(order)}
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
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2.5 bg-blue-50 rounded-xl border border-blue-200">
              <span className="font-bold text-xs text-blue-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                2. Accepted / Queued
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
                  updatingId={updatingId}
                  onStatusUpdate={handleUpdateStatus}
                  onPrintKOT={() => setPrintKOTOrder(order)}
                  onPrintReceipt={() => setPrintReceiptOrder(order)}
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
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2.5 bg-purple-50 rounded-xl border border-purple-200">
              <span className="font-bold text-xs text-purple-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                3. Kitchen Preparing
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
                  updatingId={updatingId}
                  onStatusUpdate={handleUpdateStatus}
                  onPrintKOT={() => setPrintKOTOrder(order)}
                  onPrintReceipt={() => setPrintReceiptOrder(order)}
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
          <div className="space-y-3">
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
                  updatingId={updatingId}
                  onStatusUpdate={handleUpdateStatus}
                  onPrintKOT={() => setPrintKOTOrder(order)}
                  onPrintReceipt={() => setPrintReceiptOrder(order)}
                />
              ))}
              {readyOrders.length === 0 && (
                <div className="text-center py-8 text-xs text-[#24211F]/40 border border-dashed border-[#E6DCCE] rounded-xl">
                  No staged orders
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
                  <th className="p-3">Elapsed Time</th>
                  <th className="p-3">Current Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FAF5EC]">
                {orders.map((order) => {
                  const meta = getStatusDetails(order.status);
                  return (
                    <tr key={order.id} className="hover:bg-[#FAF5EC]/40">
                      <td className="p-3 font-serif font-bold text-[#2B1D18]">
                        #{order.orderNumber}
                      </td>
                      <td className="p-3 font-bold text-[#2B1D18]">
                        Table {order.table.tableNumber}
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
                              {i.specialInstructions && (
                                <span className="block text-[10px] text-amber-800 italic">
                                  &quot;{i.specialInstructions}&quot;
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 font-bold text-[#2B1D18]">
                        {formatCurrency(order.totalAmount)}
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

      {/* PRINT RECEIPT MODAL */}
      {printReceiptOrder && (
        <div className="fixed inset-0 z-50 bg-[#2B1D18]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between no-print">
              <h3 className="font-bold text-sm text-stone-900">
                Customer Tax Invoice / Receipt
              </h3>
              <button
                onClick={() => setPrintReceiptOrder(null)}
                className="text-stone-500 hover:text-stone-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[70vh]">
              <PrintableReceipt
                cafeName="Aura Specialty Roastery"
                cafeAddress="Plot 42, Heritage Quarter, Lavelle Boulevard, Bengaluru"
                cafePhone="+91 22 4920 8800"
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
            </div>

            <div className="flex gap-2 no-print pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-stone-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
              <button
                onClick={() => setPrintReceiptOrder(null)}
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

// Reusable Order Card for Kanban Columns
function OrderCard({
  order,
  updatingId,
  onStatusUpdate,
  onPrintKOT,
  onPrintReceipt,
}: {
  order: Order;
  updatingId: string | null;
  onStatusUpdate: (orderId: string, status: string, note?: string) => void;
  onPrintKOT: () => void;
  onPrintReceipt: () => void;
}) {
  const isUpdating = updatingId === order.id;

  return (
    <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-4 shadow-xs space-y-3 hover:border-[#C58B5B] transition-colors relative">
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

      {/* Guest Name & Notes */}
      <div className="text-xs">
        <span className="text-[#24211F]/60">Guest:</span>{" "}
        <strong className="text-[#2B1D18]">{order.customerName}</strong>
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

      {/* Action Buttons */}
      <div className="pt-2 border-t border-[#FAF5EC] flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1">
          <button
            onClick={onPrintKOT}
            title="Print Kitchen Ticket (KOT)"
            className="p-1.5 rounded-lg border border-[#E6DCCE] hover:bg-[#FAF5EC] text-[#24211F]/70 text-[11px] flex items-center gap-1"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>KOT</span>
          </button>
          <button
            onClick={onPrintReceipt}
            title="Print Bill Receipt"
            className="p-1.5 rounded-lg border border-[#E6DCCE] hover:bg-[#FAF5EC] text-[#24211F]/70 text-[11px] flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* State Transition Actions */}
        <div className="flex items-center gap-1">
          {order.status === "PENDING" && (
            <>
              <button
                onClick={() => onStatusUpdate(order.id, "ACCEPTED")}
                disabled={isUpdating}
                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
              >
                <Check className="w-3 h-3" /> Accept
              </button>
              <button
                onClick={() => onStatusUpdate(order.id, "CANCELLED", "Declined by kitchen")}
                disabled={isUpdating}
                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs"
                title="Reject order"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {order.status === "ACCEPTED" && (
            <button
              onClick={() => onStatusUpdate(order.id, "PREPARING")}
              disabled={isUpdating}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
            >
              <Play className="w-3 h-3" /> Start Prep
            </button>
          )}

          {order.status === "PREPARING" && (
            <button
              onClick={() => onStatusUpdate(order.id, "READY")}
              disabled={isUpdating}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
            >
              <Check className="w-3 h-3" /> Ready
            </button>
          )}

          {order.status === "READY" && (
            <button
              onClick={() => onStatusUpdate(order.id, "SERVED")}
              disabled={isUpdating}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-900 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
            >
              <CheckCircle2 className="w-3 h-3" /> Served
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
