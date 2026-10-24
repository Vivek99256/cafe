"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BellRing,
  UtensilsCrossed,
  Tags,
  QrCode,
  TrendingUp,
  Settings,
  LogOut,
  Coffee,
  Volume2,
  VolumeX,
  ExternalLink,
  Menu,
  X,
  Shield,
  Users,
} from "lucide-react";
import { playOrderNotificationSound } from "@/lib/audio";

interface UserSession {
  userId: string;
  name: string;
  email: string;
  role: string;
  cafeId?: string;
  cafeSlug?: string;
  cafeName?: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  // Check authentication
  useEffect(() => {
    async function checkAuth() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("cafe_token") : null;
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const res = await fetch("/api/auth/me", { headers });
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        setSession(data.user);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  // Real-time listener for audio chime on new orders
  useEffect(() => {
    if (!session?.cafeId) return;

    // Connect to SSE stream
    const eventSource = new EventSource(`/api/realtime/orders?cafeId=${session.cafeId}`);

    eventSource.addEventListener("order", (e) => {
      try {
        const eventData = JSON.parse(e.data);
        if (eventData.type === "NEW_ORDER") {
          setPendingOrdersCount((c) => c + 1);
          if (audioEnabled) {
            playOrderNotificationSound();
          }
        }
      } catch (err) {
        console.error("SSE parse error:", err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, [session?.cafeId, audioEnabled]);

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("cafe_token");
    }
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const navLinks = [
    {
      name: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Live Orders",
      href: "/dashboard/orders",
      icon: BellRing,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
    },
    {
      name: "Menu Items",
      href: "/dashboard/menu",
      icon: UtensilsCrossed,
    },
    {
      name: "Categories",
      href: "/dashboard/categories",
      icon: Tags,
    },
    {
      name: "Tables & QR",
      href: "/dashboard/tables",
      icon: QrCode,
    },
    {
      name: "Analytics",
      href: "/dashboard/analytics",
      icon: TrendingUp,
    },
    {
      name: "Staff & Team",
      href: "/dashboard/staff",
      icon: Users,
    },
    {
      name: "Cafe Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  const isKitchenStaff = session?.role === "KITCHEN_STAFF";
  const displayedNavLinks = navLinks.filter((link) => {
    if (isKitchenStaff) {
      return ["Live Orders", "Menu Items", "Categories"].includes(link.name);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF5EC] flex flex-col items-center justify-center p-6 text-center">
        <Coffee className="w-10 h-10 text-[#C58B5B] animate-spin mb-3" />
        <h2 className="font-serif text-lg font-bold text-[#2B1D18]">
          Verifying Cafe Session...
        </h2>
      </div>
    );
  }

  const cafeSlug = session?.cafeSlug || "aura-cafe";

  return (
    <div className="min-h-screen bg-[#FAF5EC] flex flex-col md:flex-row text-[#24211F]">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-[#2B1D18] text-[#FAF5EC] border-r border-[#3D2B24] shrink-0 sticky top-0 h-screen justify-between p-4">
        <div className="space-y-6">
          {/* Logo / Cafe header */}
          <div className="px-2 pt-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#C58B5B] flex items-center justify-center text-[#2B1D18]">
                <Coffee className="w-5 h-5 text-[#FAF5EC]" />
              </div>
              <div>
                <span className="font-serif text-lg font-bold tracking-tight text-[#FAF5EC]">
                  {session?.cafeName || "Aura Cafe"}
                </span>
                <span className="block text-[10px] text-[#C58B5B] uppercase tracking-wider font-semibold">
                  {isKitchenStaff ? "Kitchen KDS Display" : "Manager Hub"}
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {displayedNavLinks.map((link) => {
              const isActive =
                link.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(link.href);
              const Icon = link.icon;

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-[#C58B5B] text-[#2B1D18] shadow-sm font-bold"
                      : "text-[#FAF5EC]/75 hover:bg-[#3D2B24] hover:text-[#FAF5EC]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{link.name}</span>
                  </div>
                  {link.badge !== undefined && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="space-y-3 pt-4 border-t border-[#3D2B24]">
          {/* Audio Chime Notification Toggle */}
          <button
            onClick={() => {
              setAudioEnabled(!audioEnabled);
              if (!audioEnabled) playOrderNotificationSound();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#3D2B24]/60 text-xs text-[#FAF5EC]/80 hover:bg-[#3D2B24] transition-colors"
          >
            <div className="flex items-center gap-2">
              {audioEnabled ? (
                <Volume2 className="w-4 h-4 text-[#C58B5B]" />
              ) : (
                <VolumeX className="w-4 h-4 text-stone-400" />
              )}
              <span>Kitchen Chime</span>
            </div>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                audioEnabled ? "bg-emerald-950 text-emerald-400" : "bg-stone-800 text-stone-400"
              }`}
            >
              {audioEnabled ? "ON" : "OFF"}
            </span>
          </button>

          {/* Customer Menu Direct Link */}
          <Link
            href={`/menu/${cafeSlug}?table=T01`}
            target="_blank"
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#3D2B24]/40 text-xs text-[#75856B] hover:text-[#FAF5EC] hover:bg-[#3D2B24] transition-colors"
          >
            <span>Customer Menu Preview</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          {session?.role === "SUPER_ADMIN" && (
            <Link
              href="/admin"
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-purple-950/60 border border-purple-800/40 text-xs text-purple-200 hover:bg-purple-900/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" />
                <span>Super Admin Hub</span>
              </div>
            </Link>
          )}

          {/* User Profile & Logout */}
          <div className="pt-2 flex items-center justify-between px-2">
            <div className="truncate">
              <span className="block text-xs font-bold text-[#FAF5EC] truncate">
                {session?.name}
              </span>
              <span className="block text-[10px] text-[#FAF5EC]/50 truncate">
                {session?.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-[#FAF5EC]/60 hover:text-rose-400 hover:bg-[#3D2B24] transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <div className="md:hidden bg-[#2B1D18] text-[#FAF5EC] p-3 flex items-center justify-between sticky top-0 z-40 border-b border-[#3D2B24]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#C58B5B] flex items-center justify-center text-[#2B1D18]">
            <Coffee className="w-4 h-4 text-[#FAF5EC]" />
          </div>
          <span className="font-serif font-bold text-sm text-[#FAF5EC]">
            {session?.cafeName || "Aura Cafe"}
          </span>
        </div>

        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-1.5 rounded-lg text-[#FAF5EC] hover:bg-[#3D2B24]"
        >
          {mobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* MOBILE DRAWER */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-[#2B1D18]/80 backdrop-blur-xs flex">
          <div className="bg-[#2B1D18] text-[#FAF5EC] w-64 h-full p-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#3D2B24]">
                <span className="font-serif font-bold text-base">Dashboard Menu</span>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1 rounded text-[#FAF5EC]/60"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {displayedNavLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileSidebarOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#FAF5EC]/80 hover:bg-[#3D2B24]"
                  >
                    <link.icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </Link>
                ))}
              </nav>
            </div>

            <div className="pt-4 border-t border-[#3D2B24] space-y-2">
              <button
                onClick={handleLogout}
                className="w-full py-2 bg-rose-900/60 text-rose-200 rounded-xl text-xs font-semibold"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN DASHBOARD CONTENT AREA */}
      <main className="flex-1 overflow-y-auto min-h-screen">
        {children}
      </main>
    </div>
  );
}
