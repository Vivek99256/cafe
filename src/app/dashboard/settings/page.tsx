"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Save,
  Coffee,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  Sparkles,
  Star,
  MessageCircle,
} from "lucide-react";

interface CafeSettings {
  id: string;
  name: string;
  slug: string;
  tagline?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  currency: string;
  currencySymbol: string;
  taxRate: number;
  isAcceptingOrders: boolean;
  openingHours?: string | null;
  tableOrderingEnabled: boolean;
  estimatedPrepTime: number;
  googleReviewUrl?: string | null;
  whatsappNotificationsEnabled: boolean;
  managerWhatsappPhone?: string | null;
  subscription?: {
    status: string;
    isDevMode: boolean;
    currentPeriodEnd: string;
    plan: {
      name: string;
      price: number;
      maxTables: number;
    };
  } | null;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<CafeSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/dashboard/settings");
        if (res.ok) {
          const data = await res.json();
          setSettings(data.cafe);
        }
      } catch (err) {
        console.error("Load settings error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const res = await fetch("/api/dashboard/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        throw new Error("Failed to save settings");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="p-8 text-center py-24">
        <RefreshCw className="w-8 h-8 text-[#C58B5B] animate-spin mx-auto mb-2" />
        <p className="text-xs text-[#24211F]/70">Loading cafe preferences...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#2B1D18]">
          Cafe Settings & Branding
        </h1>
        <p className="text-xs text-[#24211F]/70 mt-1">
          Customize your digital menu identity, operating hours, tax rates, and active subscription.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Ordering Availability Switch */}
        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-6 shadow-xs flex items-center justify-between">
          <div>
            <span className="block font-serif font-bold text-base text-[#2B1D18]">
              Accepting Digital QR Orders
            </span>
            <p className="text-xs text-[#24211F]/70 mt-0.5">
              Pause table ordering temporarily during peak rush or closing hours.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setSettings({ ...settings, isAcceptingOrders: !settings.isAcceptingOrders })
            }
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              settings.isAcceptingOrders
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-stone-300 text-stone-700"
            }`}
          >
            {settings.isAcceptingOrders ? "● OPEN & ACCEPTING" : "○ PAUSED / CLOSED"}
          </button>
        </div>

        {/* Section 2: Branding Information */}
        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-6 shadow-xs space-y-4">
          <h2 className="font-serif font-bold text-base text-[#2B1D18] border-b border-[#E6DCCE] pb-3">
            Branding & Public Profile
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#24211F]/80 mb-1">
                Cafe Name *
              </label>
              <input
                type="text"
                required
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="w-full p-2.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#24211F]/80 mb-1">
                Slug (URL Identifier)
              </label>
              <input
                type="text"
                disabled
                value={settings.slug}
                className="w-full p-2.5 text-xs bg-stone-100 border border-[#E6DCCE] rounded-xl text-stone-500 cursor-not-allowed"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#24211F]/80 mb-1">
                Tagline
              </label>
              <input
                type="text"
                value={settings.tagline || ""}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                placeholder="Single-Origin Pour-Overs & Artisanal Brunch"
                className="w-full p-2.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#24211F]/80 mb-1">
                Description / Story
              </label>
              <textarea
                rows={2}
                value={settings.description || ""}
                onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                className="w-full p-2.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#24211F]/80 mb-1">
                Logo Image URL
              </label>
              <input
                type="url"
                value={settings.logoUrl || ""}
                onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                className="w-full p-2.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#24211F]/80 mb-1">
                Cover Photo URL
              </label>
              <input
                type="url"
                value={settings.coverUrl || ""}
                onChange={(e) => setSettings({ ...settings, coverUrl: e.target.value })}
                className="w-full p-2.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B]"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Operations & Tax */}
        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-6 shadow-xs space-y-4">
          <h2 className="font-serif font-bold text-base text-[#2B1D18] border-b border-[#E6DCCE] pb-3">
            Operations & Financial Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#24211F]/80 mb-1">
                Tax Rate (% GST / VAT)
              </label>
              <input
                type="number"
                step="0.1"
                value={settings.taxRate}
                onChange={(e) =>
                  setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })
                }
                className="w-full p-2.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#24211F]/80 mb-1">
                Opening Hours
              </label>
              <input
                type="text"
                value={settings.openingHours || ""}
                onChange={(e) => setSettings({ ...settings, openingHours: e.target.value })}
                placeholder="07:30 AM – 11:30 PM"
                className="w-full p-2.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#24211F]/80 mb-1">
                Avg Preparation Time (Mins)
              </label>
              <input
                type="number"
                value={settings.estimatedPrepTime}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    estimatedPrepTime: parseInt(e.target.value, 10) || 12,
                  })
                }
                className="w-full p-2.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B]"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Customer Review Booster & WhatsApp Alerts */}
        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-6 shadow-xs space-y-5">
          <div className="border-b border-[#E6DCCE] pb-3">
            <h3 className="font-serif font-bold text-lg text-[#2B1D18] flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span>Google Review Booster & WhatsApp Notifications</span>
            </h3>
            <p className="text-xs text-[#24211F]/70 mt-0.5">
              Automate customer 5-star reviews on Google Maps and configure WhatsApp dispatch notifications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 md:col-span-2">
              <label className="block text-xs font-semibold text-[#24211F]/80">
                Google Maps Review URL (Review Booster)
              </label>
              <input
                type="url"
                value={settings.googleReviewUrl || ""}
                onChange={(e) => setSettings({ ...settings, googleReviewUrl: e.target.value })}
                placeholder="https://g.page/r/your-cafe/review or Google Business link"
                className="w-full p-2.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B]"
              />
              <p className="text-[11px] text-[#24211F]/60">
                ⭐ When customers give 4 or 5 stars on their digital order receipt, they are automatically prompted to share it directly on Google Maps!
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#24211F]/80">
                Kitchen / Manager WhatsApp Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={settings.managerWhatsappPhone || ""}
                  onChange={(e) => setSettings({ ...settings, managerWhatsappPhone: e.target.value })}
                  placeholder="+919876543210 (with country code)"
                  className="w-full p-2.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B]"
                />
              </div>
              <p className="text-[11px] text-[#24211F]/60">
                📱 Receive 1-click WhatsApp order dispatch alerts and notifications directly to staff phone.
              </p>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-[#FAF5EC] rounded-xl border border-[#E6DCCE]">
              <div>
                <span className="block text-xs font-bold text-[#2B1D18] flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>WhatsApp Customer Alerts</span>
                </span>
                <span className="text-[11px] text-[#24211F]/60">
                  Enable 1-click WhatsApp notification to customers when food is ready
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSettings({
                    ...settings,
                    whatsappNotificationsEnabled: !settings.whatsappNotificationsEnabled,
                  })
                }
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  settings.whatsappNotificationsEnabled ? "bg-[#75856B]" : "bg-stone-300"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    settings.whatsappNotificationsEnabled ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Section 5: Subscription Status */}
        {settings.subscription && (
          <div className="bg-[#2B1D18] text-[#FAF5EC] rounded-2xl p-6 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#C58B5B]">
                  Active SaaS Plan
                </span>
                <h3 className="font-serif font-bold text-xl text-[#FAF5EC]">
                  {settings.subscription.plan.name}
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-900 text-emerald-300 text-xs font-bold border border-emerald-700">
                {settings.subscription.status}
              </span>
            </div>

            <div className="text-xs text-[#FAF5EC]/70 pt-2 border-t border-[#3D2B24] flex items-center justify-between">
              <span>
                Plan Limit: Up to {settings.subscription.plan.maxTables} QR tables
              </span>
              <span>
                Current Period Ends:{" "}
                {new Date(settings.subscription.currentPeriodEnd).toLocaleDateString()}
              </span>
            </div>

            {settings.subscription.isDevMode && (
              <div className="p-2 bg-[#3D2B24] rounded-lg text-[11px] text-[#C58B5B] border border-[#C58B5B]/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Development Billing Mode Active: Complete SaaS features unlocked for demonstration.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Feedback message */}
        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Cafe settings saved successfully!</span>
          </div>
        )}

        {saveError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-[#2B1D18] hover:bg-[#3D2B24] text-[#FAF5EC] font-bold rounded-xl text-xs flex items-center gap-2 transition-colors shadow-md"
          >
            <Save className="w-4 h-4 text-[#C58B5B]" />
            <span>{saving ? "Saving Changes..." : "Save Preferences"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
