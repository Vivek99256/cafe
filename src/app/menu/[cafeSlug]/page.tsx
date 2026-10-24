"use client";

import { useState, useEffect, useMemo, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";
import {
  Search,
  ShoppingBag,
  Sparkles,
  Flame,
  Plus,
  Minus,
  X,
  ChevronRight,
  Clock,
  MapPin,
  Phone,
  Check,
  AlertCircle,
  ArrowRight,
  Coffee,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Variant {
  id: string;
  name: string;
  price: number;
  isDefault: boolean;
}

interface AddOn {
  id: string;
  name: string;
  price: number;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
  isSpecial: boolean;
  isVeg: boolean;
  isVegan: boolean;
  isSpicy: boolean;
  allergens?: string | null;
  preparationTime: number;
  variants: Variant[];
  addOns: AddOn[];
  trackStock?: boolean;
  stockQuantity?: number | null;
}

interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  menuItems: MenuItem[];
}

interface Cafe {
  id: string;
  name: string;
  slug: string;
  tagline?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  currency: string;
  currencySymbol: string;
  taxRate: number;
  isAcceptingOrders: boolean;
  openingHours?: string | null;
  estimatedPrepTime: number;
}

interface Table {
  id: string;
  tableNumber: string;
  label?: string | null;
}

interface CartItem {
  id: string; // unique cart entry id
  menuItemId: string;
  name: string;
  imageUrl?: string | null;
  variantId?: string;
  variantName?: string;
  unitPrice: number;
  quantity: number;
  specialInstructions?: string;
  addOns: Array<{ id: string; name: string; price: number }>;
  totalPrice: number;
}

export default function CustomerMenuPage({
  params,
}: {
  params: Promise<{ cafeSlug: string }>;
}) {
  const { cafeSlug } = use(params);
  const searchParams = useSearchParams();
  const tableParam = searchParams.get("table");
  const tokenParam = searchParams.get("token");
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [allTables, setAllTables] = useState<Table[]>([]);
  const [currentTable, setCurrentTable] = useState<Table | null>(null);

  // Filters
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterType, setFilterType] = useState<"all" | "veg" | "vegan" | "spicy" | "special">("all");

  // Customization Modal State
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState<string>("");
  const [itemQuantity, setItemQuantity] = useState<number>(1);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"PAY_AT_COUNTER" | "UPI_ONLINE">("PAY_AT_COUNTER");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Table Selector Modal (if QR was scanned without table param)
  const [showTableModal, setShowTableModal] = useState(false);

  // Load menu data
  useEffect(() => {
    async function loadMenu() {
      setLoading(true);
      setError(null);
      try {
        const url = `/api/menu/${cafeSlug}?${tableParam ? `table=${tableParam}` : ""}${tokenParam ? `&token=${tokenParam}` : ""}`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error("Unable to load cafe menu");
        }
        const data = await res.json();
        setCafe(data.cafe);
        setCategories(data.categories || []);
        setAllTables(data.tables || []);

        if (data.currentTable) {
          setCurrentTable(data.currentTable);
        } else if (data.tables && data.tables.length > 0) {
          // If no table in URL, default to first or prompt
          if (tableParam) {
            setCurrentTable({ id: "custom", tableNumber: tableParam });
          } else {
            setCurrentTable(data.tables[0]);
          }
        }
      } catch (err) {
        setError("Failed to load cafe menu. Please check the QR code or link.");
      } finally {
        setLoading(false);
      }
    }
    loadMenu();
  }, [cafeSlug, tableParam, tokenParam]);

  // Open item customization modal
  const handleOpenCustomization = (item: MenuItem) => {
    setSelectedItem(item);
    // Find default variant or first
    const defVariant = item.variants.find((v) => v.isDefault) || item.variants[0] || null;
    setSelectedVariant(defVariant);
    setSelectedAddOns([]);
    setSpecialInstructions("");
    setItemQuantity(1);
  };

  // Calculate live price inside customization modal
  const modalItemPrice = useMemo(() => {
    if (!selectedItem) return 0;
    const base = selectedVariant ? selectedVariant.price : selectedItem.price;
    const addOnsTotal = selectedAddOns.reduce((sum, a) => sum + a.price, 0);
    return (base + addOnsTotal) * itemQuantity;
  }, [selectedItem, selectedVariant, selectedAddOns, itemQuantity]);

  // Add customized item to cart
  const handleAddToCart = () => {
    if (!selectedItem) return;

    const basePrice = selectedVariant ? selectedVariant.price : selectedItem.price;
    const addOnsTotal = selectedAddOns.reduce((sum, a) => sum + a.price, 0);
    const unitPrice = basePrice + addOnsTotal;

    const newCartItem: CartItem = {
      id: `${selectedItem.id}-${selectedVariant?.id || "base"}-${selectedAddOns.map((a) => a.id).sort().join("_")}-${Date.now()}`,
      menuItemId: selectedItem.id,
      name: selectedItem.name,
      imageUrl: selectedItem.imageUrl,
      variantId: selectedVariant?.id,
      variantName: selectedVariant?.name,
      unitPrice,
      quantity: itemQuantity,
      specialInstructions: specialInstructions.trim() || undefined,
      addOns: selectedAddOns.map((a) => ({ id: a.id, name: a.name, price: a.price })),
      totalPrice: unitPrice * itemQuantity,
    };

    setCart((prev) => [...prev, newCartItem]);
    setSelectedItem(null);
  };

  // Cart calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [cart]);

  const taxAmount = useMemo(() => {
    const rate = cafe?.taxRate || 5.0;
    return Math.round(((cartSubtotal * rate) / 100) * 100) / 100;
  }, [cartSubtotal, cafe?.taxRate]);

  const grandTotal = useMemo(() => {
    return Math.round((cartSubtotal + taxAmount) * 100) / 100;
  }, [cartSubtotal, taxAmount]);

  const cartTotalItemsCount = useMemo(() => {
    return cart.reduce((sum, i) => sum + i.quantity, 0);
  }, [cart]);

  // Update cart item quantity
  const updateCartQuantity = (cartId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === cartId) {
            const menuItem = categories.flatMap((c) => c.menuItems).find((m) => m.id === item.menuItemId);
            if (delta > 0 && menuItem?.trackStock && item.quantity + delta > (menuItem.stockQuantity ?? 0)) {
              alert(`Only ${menuItem.stockQuantity} remaining in stock.`);
              return item;
            }
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              totalPrice: item.unitPrice * newQty,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // Submit Order
  const handlePlaceOrder = async () => {
    if (!customerName.trim()) {
      setOrderError("Please enter your name so the server knows who to serve.");
      return;
    }
    if (!currentTable) {
      setOrderError("Dining table is required.");
      return;
    }
    if (cart.length === 0) {
      setOrderError("Your cart is empty.");
      return;
    }

    setIsSubmitting(true);
    setOrderError(null);

    try {
      const payload = {
        cafeId: cafe?.id,
        tableId: currentTable.id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        notes: customerNotes.trim() || undefined,
        paymentMethod,
        items: cart.map((item) => ({
          menuItemId: item.menuItemId,
          variantId: item.variantId,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions,
          addOnIds: item.addOns.map((a) => a.id),
        })),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Order submission failed");
      }

      // Celebrate with confetti!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#C58B5B", "#2B1D18", "#75856B", "#FAF5EC"],
        });
      } catch (e) {
        // confetti fallback
      }

      // Redirect directly to the live customer order tracking page
      router.push(`/order/${data.orderNumber}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to place order";
      setOrderError(msg);
      setIsSubmitting(false);
    }
  };

  // Filtered menu items
  const filteredCategories = useMemo(() => {
    return categories
      .map((cat) => {
        // filter category if activeCategory !== all
        if (activeCategory !== "all" && cat.slug !== activeCategory) {
          return null;
        }

        const items = cat.menuItems.filter((item) => {
          // Search query filter
          if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const matchName = item.name.toLowerCase().includes(query);
            const matchDesc = item.description.toLowerCase().includes(query);
            if (!matchName && !matchDesc) return false;
          }

          // Dietary filters
          if (filterType === "veg" && !item.isVeg) return false;
          if (filterType === "vegan" && !item.isVegan) return false;
          if (filterType === "spicy" && !item.isSpicy) return false;
          if (filterType === "special" && !item.isSpecial && !item.isFeatured) return false;

          return true;
        });

        if (items.length === 0) return null;

        return {
          ...cat,
          menuItems: items,
        };
      })
      .filter(Boolean) as MenuCategory[];
  }, [categories, activeCategory, searchQuery, filterType]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF5EC] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#2B1D18] flex items-center justify-center shadow-lg mb-4 animate-bounce">
          <Coffee className="w-8 h-8 text-[#C58B5B]" />
        </div>
        <h2 className="font-serif text-xl font-bold text-[#2B1D18]">
          Brewing your digital menu...
        </h2>
        <p className="text-xs text-[#24211F]/60 mt-1">Connecting to cafe table stream</p>
      </div>
    );
  }

  if (error || !cafe) {
    return (
      <div className="min-h-screen bg-[#FAF5EC] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#2B1D18]">
          Menu Unavailable
        </h2>
        <p className="text-sm text-[#24211F]/70 max-w-sm mt-2">
          {error || "The requested cafe or table QR code could not be verified."}
        </p>
        <Link
          href="/"
          className="mt-6 px-5 py-2.5 bg-[#2B1D18] text-[#FAF5EC] rounded-xl text-sm font-semibold"
        >
          Return to Aura Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF5EC] text-[#24211F] pb-28">
      {/* CAFE HERO HEADER */}
      <div className="relative bg-[#2B1D18] text-[#FAF5EC] overflow-hidden">
        {/* Cover Photo */}
        <div className="relative h-44 sm:h-56 w-full">
          {cafe.coverUrl ? (
            <Image
              src={cafe.coverUrl}
              alt={cafe.name}
              fill
              priority
              className="object-cover opacity-60"
            />
          ) : (
            <div className="absolute inset-0 bg-[#3D2B24]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#2B1D18] via-[#2B1D18]/40 to-transparent" />
        </div>

        {/* Cafe Information Bar */}
        <div className="max-w-4xl mx-auto px-4 -mt-14 relative z-10 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-3.5">
              <div className="w-20 h-20 rounded-2xl bg-[#FFFDF9] border-2 border-[#FAF5EC] overflow-hidden relative shadow-lg shrink-0">
                {cafe.logoUrl ? (
                  <Image
                    src={cafe.logoUrl}
                    alt={cafe.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#2B1D18] flex items-center justify-center text-[#C58B5B]">
                    <Coffee className="w-10 h-10" />
                  </div>
                )}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#FAF5EC]">
                    {cafe.name}
                  </h1>
                </div>
                <p className="text-xs text-[#FAF5EC]/80 line-clamp-1 max-w-md">
                  {cafe.tagline || cafe.description}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-[#FAF5EC]/70 pt-0.5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#C58B5B]" />
                    {cafe.openingHours || "08:00 AM – 11:00 PM"}
                  </span>
                  <span>•</span>
                  <span>{cafe.city || "Bangalore"}</span>
                </div>
              </div>
            </div>

            {/* Table Badge */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTableModal(true)}
                className="px-3.5 py-1.5 rounded-full bg-[#3D2B24]/90 border border-[#C58B5B]/50 text-xs font-semibold text-[#FAF5EC] flex items-center gap-1.5 shadow-sm hover:border-[#C58B5B] transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-[#C58B5B]" />
                <span>
                  {currentTable
                    ? `Table ${currentTable.tableNumber}${currentTable.label ? ` • ${currentTable.label}` : ""}`
                    : "Select Table"}
                </span>
                <span className="text-[10px] text-[#C58B5B]">Change</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* STICKY SEARCH & CATEGORY CONTROLS */}
      <div className="sticky top-0 z-30 bg-[#FAF5EC]/95 backdrop-blur-md border-b border-[#E6DCCE] shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3 space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#24211F]/50" />
            <input
              type="text"
              placeholder="Search espresso, toasts, croissants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-[#FFFDF9] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B] text-[#24211F] placeholder:text-[#24211F]/40 shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#24211F]/50 hover:text-[#24211F]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Pills (Horizontal Scroll) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs font-semibold">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-3.5 py-1.5 rounded-full shrink-0 transition-all ${
                activeCategory === "all"
                  ? "bg-[#2B1D18] text-[#FAF5EC] shadow-xs"
                  : "bg-[#FFFDF9] border border-[#E6DCCE] text-[#24211F]/80 hover:bg-[#F2E9DB]"
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.slug)}
                className={`px-3.5 py-1.5 rounded-full shrink-0 transition-all ${
                  activeCategory === cat.slug
                    ? "bg-[#2B1D18] text-[#FAF5EC] shadow-xs"
                    : "bg-[#FFFDF9] border border-[#E6DCCE] text-[#24211F]/80 hover:bg-[#F2E9DB]"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Quick Dietary Tags */}
          <div className="flex items-center gap-2 text-[11px] font-medium text-[#24211F]/80 overflow-x-auto no-scrollbar">
            <span className="text-[#24211F]/50 text-[10px] uppercase font-bold shrink-0">
              Filter:
            </span>
            <button
              onClick={() => setFilterType(filterType === "veg" ? "all" : "veg")}
              className={`px-2.5 py-1 rounded-lg border shrink-0 transition-colors flex items-center gap-1 ${
                filterType === "veg"
                  ? "bg-emerald-100 border-emerald-400 text-emerald-800 font-bold"
                  : "bg-[#FFFDF9] border-[#E6DCCE]"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              Vegetarian
            </button>
            <button
              onClick={() => setFilterType(filterType === "vegan" ? "all" : "vegan")}
              className={`px-2.5 py-1 rounded-lg border shrink-0 transition-colors flex items-center gap-1 ${
                filterType === "vegan"
                  ? "bg-green-100 border-green-400 text-green-800 font-bold"
                  : "bg-[#FFFDF9] border-[#E6DCCE]"
              }`}
            >
              🌱 Vegan
            </button>
            <button
              onClick={() => setFilterType(filterType === "spicy" ? "all" : "spicy")}
              className={`px-2.5 py-1 rounded-lg border shrink-0 transition-colors flex items-center gap-1 ${
                filterType === "spicy"
                  ? "bg-amber-100 border-amber-400 text-amber-800 font-bold"
                  : "bg-[#FFFDF9] border-[#E6DCCE]"
              }`}
            >
              <Flame className="w-3 h-3 text-red-500" />
              Spicy
            </button>
            <button
              onClick={() => setFilterType(filterType === "special" ? "all" : "special")}
              className={`px-2.5 py-1 rounded-lg border shrink-0 transition-colors flex items-center gap-1 ${
                filterType === "special"
                  ? "bg-amber-100 border-amber-400 text-amber-800 font-bold"
                  : "bg-[#FFFDF9] border-[#E6DCCE]"
              }`}
            >
              <Sparkles className="w-3 h-3 text-[#C58B5B]" />
              Chef Specials
            </button>
          </div>
        </div>
      </div>

      {/* MENU LISTINGS */}
      <main className="max-w-4xl mx-auto px-4 mt-6 space-y-10">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-16 bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-8">
            <Coffee className="w-10 h-10 text-[#C58B5B] mx-auto mb-3 opacity-60" />
            <h3 className="font-serif text-lg font-bold text-[#2B1D18]">
              No menu items match your filter
            </h3>
            <p className="text-xs text-[#24211F]/60 mt-1">
              Try adjusting your search query or dietary filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setFilterType("all");
                setActiveCategory("all");
              }}
              className="mt-4 px-4 py-2 bg-[#2B1D18] text-[#FAF5EC] text-xs font-semibold rounded-xl"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <section key={category.id} className="space-y-4">
              <div className="border-b border-[#E6DCCE] pb-2">
                <h2 className="font-serif text-xl font-bold tracking-tight text-[#2B1D18]">
                  {category.name}
                </h2>
                {category.description && (
                  <p className="text-xs text-[#24211F]/70 mt-0.5">
                    {category.description}
                  </p>
                )}
              </div>

              {/* Items in Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {category.menuItems.map((item) => {
                  const hasCustomizations = item.variants.length > 0 || item.addOns.length > 0;
                  return (
                    <div
                      key={item.id}
                      className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-4 flex gap-4 hover:border-[#C58B5B]/60 transition-all shadow-xs group"
                    >
                      {/* Left: Info */}
                      <div className="flex-1 flex flex-col justify-between space-y-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Veg / Non-veg square */}
                            <span
                              className={`w-3.5 h-3.5 border flex items-center justify-center p-0.5 rounded-xs shrink-0 ${
                                item.isVeg
                                  ? "border-emerald-600"
                                  : "border-rose-700"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  item.isVeg ? "bg-emerald-600" : "bg-rose-700"
                                }`}
                              />
                            </span>

                            {item.isSpecial && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-bold uppercase tracking-wider">
                                Special
                              </span>
                            )}
                            {item.isVegan && (
                              <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-800 text-[9px] font-bold">
                                Vegan
                              </span>
                            )}
                            {item.trackStock && (item.stockQuantity ?? 0) > 0 && (item.stockQuantity ?? 0) <= 5 && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-bold">
                                🔥 Only {item.stockQuantity} left!
                              </span>
                            )}
                          </div>

                          <h3 className="font-serif font-bold text-sm text-[#2B1D18] leading-tight group-hover:text-[#C58B5B] transition-colors">
                            {item.name}
                          </h3>

                          <p className="text-xs text-[#24211F]/70 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>

                          {item.allergens && (
                            <span className="inline-block text-[10px] text-[#24211F]/60 italic">
                              ({item.allergens})
                            </span>
                          )}
                        </div>

                        {/* Price and Add CTA */}
                        <div className="flex items-center justify-between pt-2">
                          <div className="text-sm font-bold text-[#2B1D18]">
                            {formatCurrency(item.price, cafe.currency, cafe.currencySymbol)}
                            {item.variants.length > 1 && (
                              <span className="text-[10px] text-[#24211F]/60 font-normal ml-1">
                                onwards
                              </span>
                            )}
                          </div>

                          {item.isAvailable && (!item.trackStock || (item.stockQuantity ?? 0) > 0) ? (
                            <button
                              onClick={() => handleOpenCustomization(item)}
                              className="px-3 py-1.5 rounded-xl bg-[#2B1D18] text-[#FAF5EC] hover:bg-[#3D2B24] text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 shadow-xs cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5 text-[#C58B5B]" />
                              <span>{hasCustomizations ? "Customize" : "Add"}</span>
                            </button>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-500 text-[11px] font-semibold border border-stone-200">
                              Sold Out
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Food Photography */}
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden relative shrink-0 border border-[#E6DCCE]">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            unoptimized={Boolean(item.imageUrl?.startsWith("data:") || (!item.imageUrl?.includes("images.unsplash.com") && !item.imageUrl?.includes("images.pexels.com")))}
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#FAF5EC] flex items-center justify-center text-[#C58B5B]">
                            <Coffee className="w-8 h-8 opacity-40" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </main>

      {/* FLOATING CART BAR (WHEN CART HAS ITEMS) */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-xl mx-auto">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-[#2B1D18] text-[#FAF5EC] p-4 rounded-2xl shadow-xl border border-[#C58B5B]/50 flex items-center justify-between hover:bg-[#3D2B24] transition-all transform active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C58B5B] flex items-center justify-center text-[#2B1D18] font-bold">
                <ShoppingBag className="w-5 h-5 text-[#FAF5EC]" />
              </div>
              <div className="text-left">
                <span className="block text-xs font-semibold text-[#FAF5EC]/80">
                  {cartTotalItemsCount} {cartTotalItemsCount === 1 ? "item" : "items"} added
                </span>
                <span className="block font-bold text-sm text-[#FAF5EC]">
                  View Order Summary
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-lg text-[#C58B5B]">
                {formatCurrency(grandTotal, cafe.currency, cafe.currencySymbol)}
              </span>
              <ChevronRight className="w-5 h-5 text-[#FAF5EC]/70" />
            </div>
          </button>
        </div>
      )}

      {/* CUSTOMIZATION MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-[#2B1D18]/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-[#FFFDF9] w-full max-w-lg rounded-t-3xl sm:rounded-2xl border border-[#E6DCCE] shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Modal Header Image */}
            <div className="relative h-44 w-full shrink-0">
              {selectedItem.imageUrl ? (
                <Image
                  src={selectedItem.imageUrl}
                  alt={selectedItem.name}
                  fill
                  unoptimized={Boolean(selectedItem.imageUrl?.startsWith("data:") || (!selectedItem.imageUrl?.includes("images.unsplash.com") && !selectedItem.imageUrl?.includes("images.pexels.com")))}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#2B1D18] flex items-center justify-center text-[#C58B5B]">
                  <Coffee className="w-12 h-12" />
                </div>
              )}
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#2B1D18]/80 text-[#FAF5EC] flex items-center justify-center hover:bg-[#2B1D18]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-xl font-bold text-[#2B1D18]">
                    {selectedItem.name}
                  </h3>
                  <span className="font-bold text-base text-[#2B1D18]">
                    {formatCurrency(selectedItem.price, cafe.currency, cafe.currencySymbol)}
                  </span>
                </div>
                <p className="text-xs text-[#24211F]/70 mt-1 leading-relaxed">
                  {selectedItem.description}
                </p>
              </div>

              {/* Variants Section */}
              {selectedItem.variants.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#E6DCCE]">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#2B1D18]">
                    Choose Size / Style
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedItem.variants.map((v) => (
                      <label
                        key={v.id}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                          selectedVariant?.id === v.id
                            ? "border-[#C58B5B] bg-[#F7EFE8]"
                            : "border-[#E6DCCE] bg-[#FAF5EC]/50 hover:bg-[#FAF5EC]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="variant"
                            checked={selectedVariant?.id === v.id}
                            onChange={() => setSelectedVariant(v)}
                            className="text-[#C58B5B] focus:ring-[#C58B5B]"
                          />
                          <span className="text-xs font-medium text-[#2B1D18]">{v.name}</span>
                        </div>
                        <span className="text-xs font-semibold text-[#2B1D18]">
                          {formatCurrency(v.price, cafe.currency, cafe.currencySymbol)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Add-ons Section */}
              {selectedItem.addOns.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#E6DCCE]">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#2B1D18]">
                    Craft Add-ons & Extras
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedItem.addOns.map((addon) => {
                      const isChecked = selectedAddOns.some((a) => a.id === addon.id);
                      return (
                        <label
                          key={addon.id}
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                            isChecked
                              ? "border-[#C58B5B] bg-[#F7EFE8]"
                              : "border-[#E6DCCE] bg-[#FAF5EC]/50 hover:bg-[#FAF5EC]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedAddOns((prev) =>
                                    prev.filter((a) => a.id !== addon.id)
                                  );
                                } else {
                                  setSelectedAddOns((prev) => [...prev, addon]);
                                }
                              }}
                              className="text-[#C58B5B] rounded focus:ring-[#C58B5B]"
                            />
                            <span className="text-xs font-medium text-[#2B1D18]">
                              {addon.name}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-[#75856B]">
                            +{formatCurrency(addon.price, cafe.currency, cafe.currencySymbol)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Special Instructions */}
              <div className="space-y-1.5 pt-2 border-t border-[#E6DCCE]">
                <label className="text-xs font-bold uppercase tracking-wider text-[#2B1D18]">
                  Special Instructions
                </label>
                <textarea
                  placeholder="e.g. Less ice, extra hot milk, dressing on the side..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 text-xs bg-[#FAF5EC]/60 border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B]"
                />
              </div>

              {/* Quantity Stepper */}
              <div className="flex items-center justify-between pt-2 border-t border-[#E6DCCE]">
                <span className="text-xs font-bold text-[#2B1D18]">Quantity</span>
                <div className="flex items-center gap-3 bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl px-2 py-1">
                  <button
                    onClick={() => setItemQuantity((q) => Math.max(1, q - 1))}
                    className="p-1 rounded text-[#2B1D18] hover:bg-[#E6DCCE]"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center text-xs font-bold text-[#2B1D18]">
                    {itemQuantity}
                  </span>
                  <button
                    onClick={() => setItemQuantity((q) => q + 1)}
                    className="p-1 rounded text-[#2B1D18] hover:bg-[#E6DCCE]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Bottom CTA */}
            <div className="p-4 border-t border-[#E6DCCE] bg-[#FFFDF9]">
              <button
                onClick={handleAddToCart}
                className="w-full py-3 bg-[#2B1D18] hover:bg-[#3D2B24] text-[#FAF5EC] font-bold rounded-xl text-xs flex items-center justify-between px-4 transition-colors"
              >
                <span>Add to Table Order</span>
                <span className="text-[#C58B5B] font-bold">
                  {formatCurrency(modalItemPrice, cafe.currency, cafe.currencySymbol)}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CART DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-[#2B1D18]/70 backdrop-blur-xs flex justify-end animate-in fade-in">
          <div className="bg-[#FFFDF9] w-full max-w-md h-full flex flex-col border-l border-[#E6DCCE] shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-4 border-b border-[#E6DCCE] flex items-center justify-between bg-[#FAF5EC]">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#C58B5B]" />
                <h3 className="font-serif font-bold text-base text-[#2B1D18]">
                  Table {currentTable?.tableNumber} Order
                </h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-lg text-[#24211F]/60 hover:text-[#24211F] hover:bg-[#E6DCCE]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#FAF5EC]/70 rounded-xl p-3 border border-[#E6DCCE] flex gap-3"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-xs text-[#2B1D18]">
                        {item.name}
                      </h4>
                      <span className="font-bold text-xs text-[#2B1D18]">
                        {formatCurrency(item.totalPrice, cafe.currency, cafe.currencySymbol)}
                      </span>
                    </div>

                    {item.variantName && (
                      <div className="text-[11px] text-[#C58B5B] font-medium">
                        Size: {item.variantName}
                      </div>
                    )}

                    {item.addOns.length > 0 && (
                      <div className="text-[11px] text-[#75856B]">
                        + {item.addOns.map((a) => a.name).join(", ")}
                      </div>
                    )}

                    {item.specialInstructions && (
                      <div className="text-[11px] text-[#24211F]/60 italic">
                        Note: &quot;{item.specialInstructions}&quot;
                      </div>
                    )}

                    {/* Quantity controls */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2 bg-[#FFFDF9] border border-[#E6DCCE] rounded-lg px-2 py-0.5">
                        <button
                          onClick={() => updateCartQuantity(item.id, -1)}
                          className="text-xs text-[#2B1D18] hover:text-rose-600"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-[#2B1D18] px-1">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.id, 1)}
                          className="text-xs text-[#2B1D18] hover:text-[#C58B5B]"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Guest Information Form */}
              <div className="pt-4 border-t border-[#E6DCCE] space-y-3">
                <span className="block text-xs font-bold uppercase tracking-wider text-[#2B1D18]">
                  Guest Details
                </span>

                <div>
                  <label className="block text-[11px] font-semibold text-[#24211F]/70 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Liam or Table Contact"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-2.5 text-xs bg-[#FAF5EC]/70 border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#24211F]/70 mb-1">
                    Phone Number (Optional for order updates)
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full p-2.5 text-xs bg-[#FAF5EC]/70 border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B]"
                  />
                </div>

                {/* Payment preference */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#24211F]/70 mb-1">
                    Payment Preference
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("PAY_AT_COUNTER")}
                      className={`p-2.5 rounded-xl border text-center font-medium transition-colors ${
                        paymentMethod === "PAY_AT_COUNTER"
                          ? "bg-[#2B1D18] text-[#FAF5EC] border-[#2B1D18]"
                          : "bg-[#FAF5EC]/60 border-[#E6DCCE] text-[#24211F]"
                      }`}
                    >
                      Pay at Counter / Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("UPI_ONLINE")}
                      className={`p-2.5 rounded-xl border text-center font-medium transition-colors ${
                        paymentMethod === "UPI_ONLINE"
                          ? "bg-[#2B1D18] text-[#FAF5EC] border-[#2B1D18]"
                          : "bg-[#FAF5EC]/60 border-[#E6DCCE] text-[#24211F]"
                      }`}
                    >
                      UPI / Online QR
                    </button>
                  </div>
                </div>

                {orderError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{orderError}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bill Summary & Order Submit */}
            <div className="p-4 border-t border-[#E6DCCE] bg-[#FAF5EC] space-y-3">
              <div className="space-y-1.5 text-xs text-[#24211F]/80">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(cartSubtotal, cafe.currency, cafe.currencySymbol)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax ({cafe.taxRate}% GST)</span>
                  <span>{formatCurrency(taxAmount, cafe.currency, cafe.currencySymbol)}</span>
                </div>
                <div className="flex justify-between font-serif font-bold text-sm text-[#2B1D18] pt-1.5 border-t border-[#E6DCCE]">
                  <span>Total Amount</span>
                  <span className="text-[#C58B5B]">
                    {formatCurrency(grandTotal, cafe.currency, cafe.currencySymbol)}
                  </span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className="w-full py-3 bg-[#2B1D18] hover:bg-[#3D2B24] disabled:opacity-50 text-[#FAF5EC] font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                {isSubmitting ? (
                  <span>Transmitting to Kitchen...</span>
                ) : (
                  <>
                    <span>Confirm & Send Order to Kitchen</span>
                    <ArrowRight className="w-4 h-4 text-[#C58B5B]" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABLE SELECTOR MODAL */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 bg-[#2B1D18]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] w-full max-w-sm rounded-2xl border border-[#E6DCCE] p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-base text-[#2B1D18]">
                Select Dining Table
              </h3>
              <button
                onClick={() => setShowTableModal(false)}
                className="text-[#24211F]/60 hover:text-[#24211F]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#24211F]/70">
              Please choose the table number where you are seated:
            </p>

            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {allTables.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setCurrentTable(t);
                    setShowTableModal(false);
                  }}
                  className={`p-3 rounded-xl border text-left transition-colors ${
                    currentTable?.id === t.id
                      ? "border-[#C58B5B] bg-[#F7EFE8]"
                      : "border-[#E6DCCE] bg-[#FAF5EC] hover:bg-[#F2E9DB]"
                  }`}
                >
                  <span className="block font-bold text-xs text-[#2B1D18]">
                    {t.tableNumber}
                  </span>
                  {t.label && (
                    <span className="block text-[10px] text-[#24211F]/60 truncate">
                      {t.label}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
