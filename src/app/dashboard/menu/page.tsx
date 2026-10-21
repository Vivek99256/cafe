"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Plus,
  Search,
  Coffee,
  Trash2,
  Edit2,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  Camera,
  UploadCloud,
  Link as LinkIcon,
  Sparkles,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Variant {
  id?: string;
  name: string;
  price: number;
  isDefault?: boolean;
}

interface AddOn {
  id?: string;
  name: string;
  price: number;
}

interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
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
}

interface Category {
  id: string;
  name: string;
  slug: string;
  menuItems: MenuItem[];
}

const isUnoptimized = (url?: string | null) => {
  if (!url) return false;
  if (url.startsWith("data:")) return true;
  if (!url.includes("images.unsplash.com") && !url.includes("images.pexels.com")) return true;
  return false;
};

export default function MenuManagementPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [formData, setFormData] = useState({
    categoryId: "",
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    isVeg: true,
    isVegan: false,
    isSpicy: false,
    isSpecial: false,
    allergens: "",
    preparationTime: "10",
  });

  const [variantsList, setVariantsList] = useState<Variant[]>([]);
  const [newVarName, setNewVarName] = useState("");
  const [newVarPrice, setNewVarPrice] = useState("");

  const [addonsList, setAddonsList] = useState<AddOn[]>([]);
  const [newAddonName, setNewAddonName] = useState("");
  const [newAddonPrice, setNewAddonPrice] = useState("");

  // Photo / Camera States
  const [imageSourceMode, setImageSourceMode] = useState<"file" | "camera" | "url">("file");
  const [isCompressing, setIsCompressing] = useState(false);
  const [isCapturingLive, setIsCapturingLive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchMenu = async () => {
    try {
      const res = await fetch("/api/dashboard/menu");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
        if (data.categories?.length > 0 && !formData.categoryId) {
          setFormData((prev) => ({ ...prev, categoryId: data.categories[0].id }));
        }
      }
    } catch (err) {
      console.error("Fetch menu error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleToggleAvailability = async (itemId: string, current: boolean) => {
    try {
      const res = await fetch(`/api/dashboard/menu/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !current }),
      });
      if (res.ok) {
        await fetchMenu();
      }
    } catch (err) {
      console.error("Toggle availability error:", err);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to remove this dish from the menu?")) return;
    try {
      const res = await fetch(`/api/dashboard/menu/${itemId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchMenu();
      }
    } catch (err) {
      console.error("Delete item error:", err);
    }
  };

  const handleAddVariant = () => {
    if (!newVarName.trim() || !newVarPrice) return;
    setVariantsList((prev) => [
      ...prev,
      { name: newVarName.trim(), price: parseFloat(newVarPrice), isDefault: prev.length === 0 },
    ]);
    setNewVarName("");
    setNewVarPrice("");
  };

  const handleAddAddon = () => {
    if (!newAddonName.trim() || !newAddonPrice) return;
    setAddonsList((prev) => [
      ...prev,
      { name: newAddonName.trim(), price: parseFloat(newAddonPrice) },
    ]);
    setNewAddonName("");
    setNewAddonPrice("");
  };

  // Image Processing Helpers
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/")) {
        reject(new Error("Please select an image file (JPG, PNG, WebP, etc.)."));
        return;
      }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed to read image file."));
      reader.onload = (e) => {
        const img = document.createElement("img");
        img.onerror = () => reject(new Error("Failed to load image."));
        img.onload = () => {
          const maxWidth = 900;
          const maxHeight = 900;
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
          resolve(dataUrl);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressing(true);
    setModalError(null);
    try {
      const dataUrl = await compressImage(file);
      setFormData((prev) => ({ ...prev, imageUrl: dataUrl }));
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : "Failed to process photo");
    } finally {
      setIsCompressing(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleDropFile = async (file: File) => {
    setIsCompressing(true);
    setModalError(null);
    try {
      const dataUrl = await compressImage(file);
      setFormData((prev) => ({ ...prev, imageUrl: dataUrl }));
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : "Failed to process photo");
    } finally {
      setIsCompressing(false);
    }
  };

  const startLiveCamera = async () => {
    setCameraError(null);
    setIsCapturingLive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: unknown) {
      console.error("Camera access error:", err);
      setCameraError(
        "Could not access live camera. Please allow camera permissions, or use 'Take Photo via Camera' or 'Upload File'."
      );
      setIsCapturingLive(false);
    }
  };

  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCapturingLive(false);
  };

  const capturePhotoFromLiveStream = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    const targetWidth = Math.min(video.videoWidth || 800, 900);
    const targetHeight = Math.round(
      (targetWidth * (video.videoHeight || 600)) / (video.videoWidth || 800)
    );
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
      setFormData((prev) => ({ ...prev, imageUrl: dataUrl }));
    }
    stopLiveCamera();
  };

  // Modal Open Handlers
  const handleOpenCreateModal = () => {
    stopLiveCamera();
    setEditingItem(null);
    setFormData({
      categoryId: categories[0]?.id || "",
      name: "",
      description: "",
      price: "",
      imageUrl: "",
      isVeg: true,
      isVegan: false,
      isSpicy: false,
      isSpecial: false,
      allergens: "",
      preparationTime: "10",
    });
    setVariantsList([]);
    setAddonsList([]);
    setImageSourceMode("file");
    setModalError(null);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (item: MenuItem) => {
    stopLiveCamera();
    setEditingItem(item);
    setFormData({
      categoryId: item.categoryId,
      name: item.name,
      description: item.description || "",
      price: item.price.toString(),
      imageUrl: item.imageUrl || "",
      isVeg: item.isVeg,
      isVegan: item.isVegan,
      isSpicy: item.isSpicy,
      isSpecial: item.isSpecial,
      allergens: item.allergens || "",
      preparationTime: (item.preparationTime || 10).toString(),
    });
    setVariantsList(item.variants || []);
    setAddonsList(item.addOns || []);
    setImageSourceMode(
      item.imageUrl
        ? item.imageUrl.startsWith("data:")
          ? "file"
          : "url"
        : "file"
    );
    setModalError(null);
    setShowAddModal(true);
  };

  const closeModal = () => {
    stopLiveCamera();
    setShowAddModal(false);
    setEditingItem(null);
    setModalError(null);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price || !formData.categoryId) {
      setModalError("Category, item name, and price are required.");
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        variants: variantsList,
        addOns: addonsList,
      };

      const url = editingItem
        ? `/api/dashboard/menu/${editingItem.id}`
        : "/api/dashboard/menu";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save menu item");
      }

      closeModal();
      await fetchMenu();
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : "Failed to save item");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center py-24">
        <RefreshCw className="w-8 h-8 text-[#C58B5B] animate-spin mx-auto mb-2" />
        <p className="text-xs text-[#24211F]/70">Loading artisanal menu catalog...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#2B1D18]">
            Menu Catalog & Recipe Engineering
          </h1>
          <p className="text-xs text-[#24211F]/70 mt-1">
            Manage single-origin beans, craft variants, allergen indicators, and real-time 86&apos;d availability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-[#2B1D18] hover:bg-[#3D2B24] text-[#FAF5EC] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#C58B5B]" />
            <span>Create Menu Item</span>
          </button>
        </div>
      </div>

      {/* SEARCH & CATEGORY FILTER */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FFFDF9] p-3 rounded-2xl border border-[#E6DCCE] shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#24211F]/50" />
          <input
            type="text"
            placeholder="Search items by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FAF5EC]/70 border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto text-xs">
          <button
            onClick={() => setSelectedCategoryFilter("all")}
            className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition-colors ${
              selectedCategoryFilter === "all"
                ? "bg-[#2B1D18] text-[#FAF5EC]"
                : "bg-[#FAF5EC] border border-[#E6DCCE] text-[#24211F]/70"
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategoryFilter(c.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition-colors ${
                selectedCategoryFilter === c.id
                  ? "bg-[#2B1D18] text-[#FAF5EC]"
                  : "bg-[#FAF5EC] border border-[#E6DCCE] text-[#24211F]/70"
              }`}
            >
              {c.name} ({c.menuItems.length})
            </button>
          ))}
        </div>
      </div>

      {/* MENU CATEGORIES ACCORDION / SECTIONS */}
      <div className="space-y-8">
        {categories
          .filter((cat) => selectedCategoryFilter === "all" || selectedCategoryFilter === cat.id)
          .map((category) => {
            const filteredItems = category.menuItems.filter((i) => {
              if (!searchQuery) return true;
              return (
                i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                i.description.toLowerCase().includes(searchQuery.toLowerCase())
              );
            });

            if (filteredItems.length === 0 && searchQuery) return null;

            return (
              <div key={category.id} className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#E6DCCE] pb-2">
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif text-lg font-bold text-[#2B1D18]">
                      {category.name}
                    </h2>
                    <span className="text-xs text-[#24211F]/50">
                      ({filteredItems.length} items)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className={`bg-[#FFFDF9] rounded-2xl border p-4 shadow-xs flex flex-col justify-between space-y-3 transition-all ${
                        item.isAvailable ? "border-[#E6DCCE]" : "border-stone-300 opacity-60 bg-stone-50"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          <div className="w-16 h-16 rounded-xl overflow-hidden relative shrink-0 border border-[#E6DCCE]">
                            {item.imageUrl ? (
                              <Image
                                src={item.imageUrl}
                                alt={item.name}
                                fill
                                unoptimized={isUnoptimized(item.imageUrl)}
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-[#FAF5EC] flex items-center justify-center text-[#C58B5B]">
                                <Coffee className="w-6 h-6 opacity-40" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-3 h-3 border flex items-center justify-center p-0.5 rounded-xs shrink-0 ${
                                  item.isVeg ? "border-emerald-600" : "border-rose-700"
                                }`}
                              >
                                <span
                                  className={`w-1 h-1 rounded-full ${
                                    item.isVeg ? "bg-emerald-600" : "bg-rose-700"
                                  }`}
                                />
                              </span>
                              <h3 className="font-serif font-bold text-sm text-[#2B1D18] truncate">
                                {item.name}
                              </h3>
                            </div>
                            <span className="block font-bold text-xs text-[#2B1D18] mt-0.5">
                              {formatCurrency(item.price)}
                            </span>
                            <p className="text-[11px] text-[#24211F]/70 line-clamp-2 mt-1 leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        {/* Variants and add-ons badges */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                          {item.variants.length > 0 && (
                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-800 rounded border border-blue-200">
                              {item.variants.length} Sizes
                            </span>
                          )}
                          {item.addOns.length > 0 && (
                            <span className="px-1.5 py-0.5 bg-purple-50 text-purple-800 rounded border border-purple-200">
                              {item.addOns.length} Add-ons
                            </span>
                          )}
                          {item.isSpecial && (
                            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-800 rounded border border-amber-200 font-bold">
                              Special
                            </span>
                          )}
                          {item.allergens && (
                            <span className="text-[#24211F]/50 italic">
                              ({item.allergens})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="pt-2 border-t border-[#FAF5EC] flex items-center justify-between text-xs">
                        {/* Availability toggle switch */}
                        <button
                          onClick={() => handleToggleAvailability(item.id, item.isAvailable)}
                          className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors ${
                            item.isAvailable
                              ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                              : "bg-stone-200 text-stone-700 hover:bg-stone-300"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              item.isAvailable ? "bg-emerald-600" : "bg-stone-500"
                            }`}
                          />
                          <span>{item.isAvailable ? "In Stock" : "Sold Out (86'd)"}</span>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 text-stone-600 hover:text-[#2B1D18] hover:bg-[#FAF5EC] rounded-lg transition-colors flex items-center gap-1 font-medium text-xs"
                            title="Edit Item & Photo"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#C58B5B]" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
      </div>

      {/* CREATE / EDIT MENU ITEM MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#2B1D18]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-6 max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6DCCE]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C58B5B]" />
                <h3 className="font-serif font-bold text-lg text-[#2B1D18]">
                  {editingItem ? `Edit Dish: ${editingItem.name}` : "Create New Menu Item"}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="text-[#24211F]/60 hover:text-[#2B1D18] p-1 rounded-lg hover:bg-[#FAF5EC]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="overflow-y-auto p-1 space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#24211F]/80 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full p-2.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#24211F]/80 mb-1">
                    Base Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    placeholder="e.g. 240"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full p-2.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#24211F]/80 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Spanish Cortado Velvet, Brioche French Toast"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#24211F]/80 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Appetizing description of ingredients, roast profile, origin..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B]"
                />
              </div>

              {/* PHOTO / PHOTOGRAPHY SELECTION SECTION */}
              <div className="space-y-2.5 pt-2 border-t border-[#E6DCCE]">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#2B1D18]">
                    Food Photography / Dish Photo
                  </label>
                  <span className="text-[11px] text-[#24211F]/60">
                    File, Camera, or Web URL
                  </span>
                </div>

                {/* Tabs to select how to supply photo */}
                <div className="flex p-1 bg-[#FAF5EC] rounded-xl border border-[#E6DCCE] text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      stopLiveCamera();
                      setImageSourceMode("file");
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      imageSourceMode === "file"
                        ? "bg-[#2B1D18] text-[#FAF5EC] shadow-xs"
                        : "text-[#24211F]/70 hover:text-[#2B1D18]"
                    }`}
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-[#C58B5B]" />
                    <span>Upload File</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      stopLiveCamera();
                      setImageSourceMode("camera");
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      imageSourceMode === "camera"
                        ? "bg-[#2B1D18] text-[#FAF5EC] shadow-xs"
                        : "text-[#24211F]/70 hover:text-[#2B1D18]"
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5 text-[#C58B5B]" />
                    <span>Click / Camera</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      stopLiveCamera();
                      setImageSourceMode("url");
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      imageSourceMode === "url"
                        ? "bg-[#2B1D18] text-[#FAF5EC] shadow-xs"
                        : "text-[#24211F]/70 hover:text-[#2B1D18]"
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5 text-[#C58B5B]" />
                    <span>Web URL</span>
                  </button>
                </div>

                {/* Hidden Inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* 1. File Upload Mode */}
                {imageSourceMode === "file" && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleDropFile(file);
                    }}
                    className="border-2 border-dashed border-[#E6DCCE] hover:border-[#C58B5B] bg-[#FAF5EC]/50 hover:bg-[#FAF5EC] rounded-xl p-4 text-center cursor-pointer transition-colors"
                  >
                    <UploadCloud className="w-6 h-6 text-[#C58B5B] mx-auto mb-1.5" />
                    <p className="text-xs font-semibold text-[#2B1D18]">
                      Click to choose photo from device / gallery
                    </p>
                    <p className="text-[10px] text-[#24211F]/60 mt-0.5">
                      Or drag and drop image here (JPG, PNG, WebP)
                    </p>
                  </div>
                )}

                {/* 2. Camera Mode (Mobile direct snap + Desktop Live Viewfinder) */}
                {imageSourceMode === "camera" && (
                  <div className="space-y-3">
                    {isCapturingLive ? (
                      <div className="relative rounded-xl overflow-hidden bg-black border border-[#E6DCCE]">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full h-56 object-cover"
                        />
                        <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={capturePhotoFromLiveStream}
                            className="px-4 py-2 bg-[#C58B5B] hover:bg-[#b0784a] text-[#FAF5EC] rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg"
                          >
                            <Camera className="w-4 h-4" />
                            <span>Capture Photo</span>
                          </button>
                          <button
                            type="button"
                            onClick={stopLiveCamera}
                            className="px-3 py-2 bg-black/70 hover:bg-black text-[#FAF5EC] rounded-xl text-xs font-semibold"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          className="p-3 bg-[#FAF5EC] hover:bg-[#F2E9DB] border border-[#E6DCCE] rounded-xl flex flex-col items-center justify-center text-center gap-1.5 transition-colors"
                        >
                          <Camera className="w-5 h-5 text-[#C58B5B]" />
                          <span className="text-xs font-bold text-[#2B1D18]">
                            Device Camera
                          </span>
                          <span className="text-[10px] text-[#24211F]/60">
                            Opens camera app on phone/tablet
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={startLiveCamera}
                          className="p-3 bg-[#FAF5EC] hover:bg-[#F2E9DB] border border-[#E6DCCE] rounded-xl flex flex-col items-center justify-center text-center gap-1.5 transition-colors"
                        >
                          <Sparkles className="w-5 h-5 text-[#C58B5B]" />
                          <span className="text-xs font-bold text-[#2B1D18]">
                            Live Viewfinder
                          </span>
                          <span className="text-[10px] text-[#24211F]/60">
                            Live webcam snapshot
                          </span>
                        </button>
                      </div>
                    )}

                    {cameraError && (
                      <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                        {cameraError}
                      </p>
                    )}
                  </div>
                )}

                {/* 3. URL Mode */}
                {imageSourceMode === "url" && (
                  <div>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="w-full p-2.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B]"
                    />
                  </div>
                )}

                {/* Optimizing Spinner */}
                {isCompressing && (
                  <div className="p-3 bg-[#FAF5EC] rounded-xl border border-[#E6DCCE] flex items-center justify-center gap-2 text-xs text-[#24211F]/80">
                    <RefreshCw className="w-4 h-4 text-[#C58B5B] animate-spin" />
                    <span>Compressing & optimizing photo...</span>
                  </div>
                )}

                {/* Image Preview Box if set */}
                {formData.imageUrl && !isCompressing && (
                  <div className="flex items-center gap-3 p-2.5 bg-[#FAF5EC] rounded-xl border border-[#E6DCCE]">
                    <div className="w-14 h-14 rounded-lg overflow-hidden relative shrink-0 border border-[#E6DCCE]">
                      <Image
                        src={formData.imageUrl}
                        alt="Photo preview"
                        fill
                        unoptimized={isUnoptimized(formData.imageUrl)}
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block text-xs font-bold text-[#2B1D18] truncate">
                        {formData.imageUrl.startsWith("data:")
                          ? "Photo captured & ready"
                          : "Web photo linked"}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                        <Check className="w-3 h-3" /> Will display on digital QR menu
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: "" })}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-stone-200/50 transition-colors"
                      title="Remove Photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                <label className="flex items-center gap-1.5 p-2 bg-[#FAF5EC] rounded-xl border border-[#E6DCCE] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isVeg}
                    onChange={(e) => setFormData({ ...formData, isVeg: e.target.checked })}
                    className="text-[#75856B] rounded"
                  />
                  <span>Vegetarian</span>
                </label>
                <label className="flex items-center gap-1.5 p-2 bg-[#FAF5EC] rounded-xl border border-[#E6DCCE] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isVegan}
                    onChange={(e) => setFormData({ ...formData, isVegan: e.target.checked })}
                    className="text-[#75856B] rounded"
                  />
                  <span>Vegan</span>
                </label>
                <label className="flex items-center gap-1.5 p-2 bg-[#FAF5EC] rounded-xl border border-[#E6DCCE] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isSpecial}
                    onChange={(e) => setFormData({ ...formData, isSpecial: e.target.checked })}
                    className="text-[#C58B5B] rounded"
                  />
                  <span>Chef Special</span>
                </label>
              </div>

              {/* Preparation Time & Allergens */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-[#24211F]/80 mb-1">
                    Prep Time (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="10"
                    value={formData.preparationTime}
                    onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                    className="w-full p-2.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#24211F]/80 mb-1">
                    Allergens (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dairy, Nuts, Gluten"
                    value={formData.allergens}
                    onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                    className="w-full p-2.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B]"
                  />
                </div>
              </div>

              {/* Variants Builder */}
              <div className="space-y-2 pt-2 border-t border-[#E6DCCE]">
                <span className="block text-xs font-bold text-[#2B1D18]">
                  Product Sizes / Variants (Optional)
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Size name (e.g. Regular 12oz, Large 16oz)"
                    value={newVarName}
                    onChange={(e) => setNewVarName(e.target.value)}
                    className="flex-1 p-2 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl"
                  />
                  <input
                    type="number"
                    placeholder="Price (₹)"
                    value={newVarPrice}
                    onChange={(e) => setNewVarPrice(e.target.value)}
                    className="w-24 p-2 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="px-3 py-2 bg-[#FAF5EC] border border-[#E6DCCE] hover:bg-[#F2E9DB] rounded-xl text-xs font-bold"
                  >
                    + Add Size
                  </button>
                </div>

                {variantsList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {variantsList.map((v, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-stone-100 rounded-lg text-xs font-medium text-[#2B1D18] flex items-center gap-1.5"
                      >
                        {v.name}: ₹{v.price}
                        <button
                          type="button"
                          onClick={() => setVariantsList(variantsList.filter((_, idx) => idx !== i))}
                          className="text-stone-400 hover:text-rose-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Add-ons Builder */}
              <div className="space-y-2 pt-2 border-t border-[#E6DCCE]">
                <span className="block text-xs font-bold text-[#2B1D18]">
                  Extras & Add-ons (Optional)
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Addon (e.g. Oat Milk, Extra Shot, Caramel Drizzle)"
                    value={newAddonName}
                    onChange={(e) => setNewAddonName(e.target.value)}
                    className="flex-1 p-2 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl"
                  />
                  <input
                    type="number"
                    placeholder="Price (₹)"
                    value={newAddonPrice}
                    onChange={(e) => setNewAddonPrice(e.target.value)}
                    className="w-24 p-2 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={handleAddAddon}
                    className="px-3 py-2 bg-[#FAF5EC] border border-[#E6DCCE] hover:bg-[#F2E9DB] rounded-xl text-xs font-bold"
                  >
                    + Add Extra
                  </button>
                </div>

                {addonsList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {addonsList.map((a, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-stone-100 rounded-lg text-xs font-medium text-[#2B1D18] flex items-center gap-1.5"
                      >
                        {a.name}: +₹{a.price}
                        <button
                          type="button"
                          onClick={() => setAddonsList(addonsList.filter((_, idx) => idx !== i))}
                          className="text-stone-400 hover:text-rose-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {modalError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="pt-3 border-t border-[#E6DCCE] flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting || isCompressing}
                  className="flex-1 py-2.5 bg-[#2B1D18] hover:bg-[#3D2B24] text-[#FAF5EC] font-bold rounded-xl text-xs transition-colors shadow-xs disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingItem
                    ? "Save Changes"
                    : "Publish to Menu"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 border border-[#E6DCCE] text-[#24211F]/70 hover:bg-[#FAF5EC] rounded-xl text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
