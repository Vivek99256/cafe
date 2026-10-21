"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  QrCode,
  Plus,
  Download,
  Printer,
  Trash2,
  RefreshCw,
  ExternalLink,
  MapPin,
  Users,
  Check,
  X,
  AlertCircle,
  Eye,
} from "lucide-react";
import PrintableTentCard from "@/components/PrintableTentCard";

interface TableData {
  id: string;
  tableNumber: string;
  label?: string | null;
  capacity: number;
  isActive: boolean;
  qrToken: string;
  orderUrl: string;
  qrDataUrl: string;
  activeOrdersCount: number;
}

interface CafeInfo {
  name: string;
  slug: string;
  logoUrl?: string | null;
}

export default function TablesManagementPage() {
  const [tables, setTables] = useState<TableData[]>([]);
  const [cafe, setCafe] = useState<CafeInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // New Table Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newCapacity, setNewCapacity] = useState("4");
  const [addError, setAddError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Print Tent Card Modal
  const [tentCardTable, setTentCardTable] = useState<TableData | null>(null);

  const fetchTables = async () => {
    try {
      const res = await fetch("/api/dashboard/tables");
      if (res.ok) {
        const data = await res.json();
        setTables(data.tables || []);
        setCafe(data.cafe || null);
      }
    } catch (err) {
      console.error("Fetch tables error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNumber.trim()) {
      setAddError("Table number is required (e.g. T09 or Balcony-2)");
      return;
    }

    setIsSubmitting(true);
    setAddError(null);

    try {
      const res = await fetch("/api/dashboard/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNumber: newTableNumber.trim(),
          label: newLabel.trim() || undefined,
          capacity: parseInt(newCapacity, 10) || 4,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create table");
      }

      setNewTableNumber("");
      setNewLabel("");
      setNewCapacity("4");
      setShowAddModal(false);
      await fetchTables();
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : "Failed to create table");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    if (!confirm("Are you sure you want to remove this table?")) return;

    try {
      const res = await fetch(`/api/dashboard/tables/${tableId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Cannot delete table with active orders.");
        return;
      }
      await fetchTables();
    } catch (err) {
      console.error("Delete table error:", err);
    }
  };

  const handleDownloadPNG = (table: TableData) => {
    if (!table.qrDataUrl) return;
    const link = document.createElement("a");
    link.href = table.qrDataUrl;
    link.download = `QR-Table-${table.tableNumber}-${cafe?.slug || "cafe"}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="p-8 text-center py-24">
        <RefreshCw className="w-8 h-8 text-[#C58B5B] animate-spin mx-auto mb-2" />
        <p className="text-xs text-[#24211F]/70">Generating table QR codes and cryptographic tokens...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#2B1D18]">
            Tables & Dynamic QR Codes
          </h1>
          <p className="text-xs text-[#24211F]/70 mt-1">
            Generate tamper-proof QR codes, print branded table tent cards, and monitor active seating.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[#2B1D18] hover:bg-[#3D2B24] text-[#FAF5EC] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#C58B5B]" />
            <span>Add New Table</span>
          </button>
        </div>
      </div>

      {/* TABLES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tables.map((table) => (
          <div
            key={table.id}
            className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#C58B5B] transition-all group"
          >
            {/* Header info */}
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif font-bold text-xl text-[#2B1D18]">
                    Table {table.tableNumber}
                  </h3>
                  {table.label && (
                    <span className="text-xs text-[#24211F]/60 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-[#C58B5B]" />
                      {table.label}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[11px] text-[#75856B] bg-[#FAF5EC] px-2 py-0.5 rounded-md border border-[#E6DCCE]">
                  <Users className="w-3 h-3" />
                  <span>{table.capacity} seats</span>
                </div>
              </div>

              {/* QR Code Container */}
              <div className="my-4 p-3 bg-[#FAF5EC] rounded-xl border border-[#E6DCCE] flex flex-col items-center justify-center">
                {table.qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={table.qrDataUrl}
                    alt={`Table ${table.tableNumber} QR`}
                    className="w-36 h-36 rounded-lg shadow-xs"
                  />
                ) : (
                  <div className="w-36 h-36 flex items-center justify-center bg-stone-200 text-stone-400">
                    <QrCode className="w-8 h-8" />
                  </div>
                )}

                <div className="mt-2 text-[10px] text-[#24211F]/60 font-mono text-center truncate max-w-[200px]">
                  Token: {table.qrToken.substring(0, 10)}...
                </div>
              </div>

              {/* Active orders indicator */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#24211F]/70">Active Dining:</span>
                {table.activeOrdersCount > 0 ? (
                  <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                    {table.activeOrdersCount} in kitchen
                  </span>
                ) : (
                  <span className="text-emerald-700 font-medium">Table Available</span>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-[#FAF5EC] space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleDownloadPNG(table)}
                  className="py-1.5 px-2 bg-[#FAF5EC] hover:bg-[#F2E9DB] border border-[#E6DCCE] rounded-lg text-xs font-semibold text-[#2B1D18] flex items-center justify-center gap-1 transition-colors"
                  title="Download PNG QR Code"
                >
                  <Download className="w-3.5 h-3.5 text-[#C58B5B]" />
                  <span>PNG</span>
                </button>

                <button
                  onClick={() => setTentCardTable(table)}
                  className="py-1.5 px-2 bg-[#2B1D18] hover:bg-[#3D2B24] text-[#FAF5EC] rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors shadow-xs"
                  title="Print Table Tent Card"
                >
                  <Printer className="w-3.5 h-3.5 text-[#C58B5B]" />
                  <span>Tent Card</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <Link
                  href={table.orderUrl}
                  target="_blank"
                  className="text-[11px] font-semibold text-[#75856B] hover:underline flex items-center gap-1"
                >
                  <span>Test Menu URL</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>

                <button
                  onClick={() => handleDeleteTable(table.id)}
                  className="text-stone-400 hover:text-rose-600 transition-colors p-1"
                  title="Delete Table"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ADD TABLE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#2B1D18]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-6 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-[#2B1D18]">
                Add Dining Table
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#24211F]/60 hover:text-[#2B1D18]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTable} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#24211F]/80 mb-1">
                  Table Identifier / Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. T09, Rooftop-1, Bar-3"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  className="w-full p-2.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#24211F]/80 mb-1">
                  Seating Location / Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mezzanine Library, Patio Pergola"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full p-2.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#24211F]/80 mb-1">
                  Guest Capacity
                </label>
                <select
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(e.target.value)}
                  className="w-full p-2.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B]"
                >
                  <option value="2">2 Guests (Intimate / Bistro)</option>
                  <option value="4">4 Guests (Standard Dining)</option>
                  <option value="6">6 Guests (Banquette / Booth)</option>
                  <option value="8">8 Guests (Large Party Table)</option>
                </select>
              </div>

              {addError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-[#2B1D18] hover:bg-[#3D2B24] text-[#FAF5EC] font-bold rounded-xl text-xs transition-colors shadow-xs"
                >
                  {isSubmitting ? "Generating QR..." : "Create Table"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 border border-[#E6DCCE] text-[#24211F]/70 hover:bg-[#FAF5EC] rounded-xl text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT TENT CARD PREVIEW MODAL */}
      {tentCardTable && (
        <div className="fixed inset-0 z-50 bg-[#2B1D18]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between no-print border-b pb-3">
              <div>
                <h3 className="font-bold text-sm text-stone-900">
                  Print Table Tent Card
                </h3>
                <p className="text-[11px] text-stone-500">
                  Formatted for standard laser printer & table tent acrylic stands
                </p>
              </div>
              <button
                onClick={() => setTentCardTable(null)}
                className="text-stone-500 hover:text-stone-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[70vh] py-2">
              <PrintableTentCard
                cafeName={cafe?.name || "Aura Specialty Roastery"}
                cafeLogo={cafe?.logoUrl}
                tableNumber={tentCardTable.tableNumber}
                label={tentCardTable.label}
                qrDataUrl={tentCardTable.qrDataUrl}
              />
            </div>

            <div className="flex gap-2 no-print pt-2 border-t">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-[#2B1D18] hover:bg-[#3D2B24] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md"
              >
                <Printer className="w-4 h-4 text-[#C58B5B]" /> Print Card
              </button>
              <button
                onClick={() => handleDownloadPNG(tentCardTable)}
                className="px-4 py-2.5 border border-stone-300 rounded-xl text-xs text-stone-700 flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> PNG
              </button>
              <button
                onClick={() => setTentCardTable(null)}
                className="px-4 py-2.5 text-xs text-stone-500 hover:text-stone-800"
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
