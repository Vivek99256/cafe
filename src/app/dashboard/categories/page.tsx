"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  X,
  AlertCircle,
  ArrowRight,
  Search,
  Layers,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface MenuItemSummary {
  id: string;
  name: string;
  price?: number;
  isAvailable?: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  sortOrder: number;
  menuItems: MenuItemSummary[];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Add Category Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [newSortOrder, setNewSortOrder] = useState("0");
  const [addModalError, setAddModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Category Modal State
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatDesc, setEditCatDesc] = useState("");
  const [editSortOrder, setEditSortOrder] = useState("0");
  const [editModalError, setEditModalError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Delete Category Modal State
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deleteModalError, setDeleteModalError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast / Feedback State
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/dashboard/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      } else {
        // Fallback to menu API if needed
        const menuRes = await fetch("/api/dashboard/menu");
        if (menuRes.ok) {
          const menuData = await menuRes.json();
          setCategories(menuData.categories || []);
        }
      }
    } catch (err) {
      console.error("Fetch categories error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Filter categories by search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const query = searchQuery.toLowerCase().trim();
    return categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(query) ||
        (cat.description && cat.description.toLowerCase().includes(query)) ||
        cat.menuItems.some((item) => item.name.toLowerCase().includes(query))
    );
  }, [categories, searchQuery]);

  const totalMenuItems = useMemo(() => {
    return categories.reduce((sum, cat) => sum + (cat.menuItems?.length || 0), 0);
  }, [categories]);

  // Handle Create Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setAddModalError("Category name is required");
      return;
    }

    setIsSubmitting(true);
    setAddModalError(null);

    try {
      const res = await fetch("/api/dashboard/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCatName.trim(),
          description: newCatDesc.trim() || undefined,
          sortOrder: parseInt(newSortOrder, 10) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create category");

      setNewCatName("");
      setNewCatDesc("");
      setNewSortOrder("0");
      setShowAddModal(false);
      showToast("success", `Category "${newCatName.trim()}" created successfully!`);
      await fetchCategories();
    } catch (err: unknown) {
      setAddModalError(err instanceof Error ? err.message : "Failed to create category");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setEditCatName(cat.name);
    setEditCatDesc(cat.description || "");
    setEditSortOrder(cat.sortOrder.toString());
    setEditModalError(null);
  };

  // Handle Update Category
  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    if (!editCatName.trim()) {
      setEditModalError("Category name is required");
      return;
    }

    setIsEditing(true);
    setEditModalError(null);

    try {
      const res = await fetch(`/api/dashboard/categories/${editingCategory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editCatName.trim(),
          description: editCatDesc.trim() || undefined,
          sortOrder: parseInt(editSortOrder, 10) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update category");

      const updatedName = editCatName.trim();
      setEditingCategory(null);
      showToast("success", `Category "${updatedName}" updated successfully!`);
      await fetchCategories();
    } catch (err: unknown) {
      setEditModalError(err instanceof Error ? err.message : "Failed to update category");
    } finally {
      setIsEditing(false);
    }
  };

  // Open Delete Modal
  const openDeleteModal = (cat: Category) => {
    setDeletingCategory(cat);
    setDeleteModalError(null);
  };

  // Handle Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;

    setIsDeleting(true);
    setDeleteModalError(null);

    try {
      const res = await fetch(`/api/dashboard/categories/${deletingCategory.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete category");

      const deletedName = deletingCategory.name;
      setDeletingCategory(null);
      showToast("success", `Category "${deletedName}" deleted successfully!`);
      await fetchCategories();
    } catch (err: unknown) {
      setDeleteModalError(err instanceof Error ? err.message : "Failed to delete category");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center py-24">
        <RefreshCw className="w-8 h-8 text-[#C58B5B] animate-spin mx-auto mb-2" />
        <p className="text-xs text-[#24211F]/70">Loading menu categories...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-medium animate-in fade-in slide-in-from-bottom-2 ${
            toastMessage.type === "success"
              ? "bg-[#2B1D18] text-[#FAF5EC] border-[#C58B5B]/30"
              : "bg-rose-600 text-white border-rose-700"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-[#C58B5B]" />
          ) : (
            <AlertCircle className="w-4 h-4 text-white" />
          )}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 opacity-70 hover:opacity-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#2B1D18]">
            Menu Categories
          </h1>
          <p className="text-xs text-[#24211F]/70 mt-1">
            Organize digital menu sections, edit descriptions, change sort order, or manage items.
          </p>
        </div>

        <button
          onClick={() => {
            setAddModalError(null);
            setShowAddModal(true);
          }}
          className="px-4 py-2.5 bg-[#2B1D18] hover:bg-[#3D2B24] text-[#FAF5EC] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#C58B5B]" />
          <span>New Category</span>
        </button>
      </div>

      {/* Filter and overview banner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#FAF5EC] p-3 rounded-2xl border border-[#E6DCCE]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#24211F]/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search categories or menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-[#FFFDF9] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B] text-[#2B1D18]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#24211F]/40 hover:text-[#2B1D18]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-[#24211F]/70 px-2">
          <span className="flex items-center gap-1 font-medium">
            <Layers className="w-3.5 h-3.5 text-[#C58B5B]" />
            <span>{categories.length} Categories</span>
          </span>
          <span className="text-stone-300">•</span>
          <span className="text-[#75856B] font-semibold">{totalMenuItems} Total Items</span>
        </div>
      </div>

      {/* Empty State */}
      {filteredCategories.length === 0 ? (
        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-[#FAF5EC] rounded-2xl border border-[#E6DCCE] flex items-center justify-center mx-auto text-[#C58B5B]">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="font-serif font-bold text-lg text-[#2B1D18]">
            {searchQuery ? "No matching categories" : "No categories yet"}
          </h3>
          <p className="text-xs text-[#24211F]/70 max-w-sm mx-auto">
            {searchQuery
              ? `No categories or items found for "${searchQuery}". Try a different search keyword.`
              : "Create your first menu category to organize your drinks, bakery, and food items."}
          </p>
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery("")}
              className="px-3.5 py-1.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] hover:bg-[#F2E9DB] rounded-xl font-medium text-[#2B1D18]"
            >
              Clear Search
            </button>
          ) : (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-[#2B1D18] hover:bg-[#3D2B24] text-[#FAF5EC] rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-[#C58B5B]" />
              <span>Add First Category</span>
            </button>
          )}
        </div>
      ) : (
        /* Categories Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#C58B5B] transition-all group"
            >
              <div className="space-y-3">
                {/* Header with Title and Action buttons */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif font-bold text-lg text-[#2B1D18] truncate">
                        {cat.name}
                      </h3>
                      <span className="text-[10px] font-mono text-[#24211F]/60 bg-[#FAF5EC] px-2 py-0.5 rounded-md border border-[#E6DCCE] shrink-0">
                        Order #{cat.sortOrder}
                      </span>
                    </div>
                  </div>

                  {/* Edit and Delete Action Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="p-1.5 text-[#24211F]/60 hover:text-[#C58B5B] hover:bg-[#FAF5EC] rounded-lg border border-transparent hover:border-[#E6DCCE] transition-colors cursor-pointer"
                      title="Edit Category"
                      aria-label={`Edit ${cat.name}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => openDeleteModal(cat)}
                      className="p-1.5 text-[#24211F]/60 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                      title="Delete Category"
                      aria-label={`Delete ${cat.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                {cat.description ? (
                  <p className="text-xs text-[#24211F]/70 leading-relaxed line-clamp-2">
                    {cat.description}
                  </p>
                ) : (
                  <p className="text-xs text-[#24211F]/40 italic">No description provided</p>
                )}

                {/* Items Preview Chips */}
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-[#24211F]/60">Items:</span>
                    <span className="text-[11px] font-bold text-[#75856B] bg-[#FAF5EC] px-2 py-0.5 rounded-full border border-[#E6DCCE]">
                      {cat.menuItems?.length || 0} {cat.menuItems?.length === 1 ? "item" : "items"}
                    </span>
                  </div>

                  {cat.menuItems && cat.menuItems.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {cat.menuItems.slice(0, 4).map((item) => (
                        <span
                          key={item.id}
                          className="text-[11px] bg-[#FAF5EC] border border-[#E6DCCE] text-[#2B1D18]/80 px-2 py-0.5 rounded-lg truncate max-w-[150px]"
                        >
                          {item.name}
                        </span>
                      ))}
                      {cat.menuItems.length > 4 && (
                        <span className="text-[11px] text-[#C58B5B] font-medium bg-[#FAF5EC] border border-[#E6DCCE] px-2 py-0.5 rounded-lg">
                          +{cat.menuItems.length - 4} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#24211F]/40 italic">No items in this category yet</p>
                  )}
                </div>
              </div>

              {/* Bottom footer */}
              <div className="pt-3 border-t border-[#FAF5EC] flex items-center justify-between text-xs">
                <span className="text-[#24211F]/50 text-[11px]">
                  Slug: <span className="font-mono text-[#2B1D18]">{cat.slug}</span>
                </span>

                <Link
                  href="/dashboard/menu"
                  className="text-[#C58B5B] font-semibold hover:underline flex items-center gap-1 transition-colors"
                >
                  <span>Manage Menu Items</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================================================= */}
      {/* ADD CATEGORY MODAL */}
      {/* ================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#2B1D18]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-6 max-w-sm w-full space-y-4 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-[#2B1D18]">
                Add Menu Category
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#24211F]/60 hover:text-[#2B1D18] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#24211F]/80 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Specialty Cold Brews"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full p-2.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B] text-[#2B1D18]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#24211F]/80 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional section description for digital menu"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full p-2.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B] text-[#2B1D18]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#24211F]/80 mb-1">
                  Sort Priority (Lower numbers appear first)
                </label>
                <input
                  type="number"
                  value={newSortOrder}
                  onChange={(e) => setNewSortOrder(e.target.value)}
                  className="w-full p-2.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B] text-[#2B1D18]"
                />
              </div>

              {addModalError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{addModalError}</span>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-[#2B1D18] hover:bg-[#3D2B24] text-[#FAF5EC] font-bold rounded-xl text-xs transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Creating..." : "Save Category"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 border border-[#E6DCCE] text-[#24211F]/70 hover:bg-[#FAF5EC] rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* EDIT CATEGORY MODAL */}
      {/* ================================================= */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-[#2B1D18]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] rounded-2xl border border-[#E6DCCE] p-6 max-w-sm w-full space-y-4 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#2B1D18]">
                  Edit Category
                </h3>
                <p className="text-[11px] text-[#24211F]/60">
                  Updating &quot;{editingCategory.name}&quot;
                </p>
              </div>
              <button
                onClick={() => setEditingCategory(null)}
                className="text-[#24211F]/60 hover:text-[#2B1D18] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#24211F]/80 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Specialty Cold Brews"
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                  className="w-full p-2.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B] text-[#2B1D18]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#24211F]/80 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional section description for digital menu"
                  value={editCatDesc}
                  onChange={(e) => setEditCatDesc(e.target.value)}
                  className="w-full p-2.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B] text-[#2B1D18]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#24211F]/80 mb-1">
                  Sort Priority (Lower numbers appear first)
                </label>
                <input
                  type="number"
                  value={editSortOrder}
                  onChange={(e) => setEditSortOrder(e.target.value)}
                  className="w-full p-2.5 text-xs bg-[#FAF5EC] border border-[#E6DCCE] rounded-xl focus:outline-none focus:border-[#C58B5B] text-[#2B1D18]"
                />
              </div>

              {editModalError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editModalError}</span>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={isEditing}
                  className="flex-1 py-2.5 bg-[#2B1D18] hover:bg-[#3D2B24] text-[#FAF5EC] font-bold rounded-xl text-xs transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isEditing ? "Saving Changes..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2.5 border border-[#E6DCCE] text-[#24211F]/70 hover:bg-[#FAF5EC] rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ================================================= */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 bg-[#2B1D18]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] rounded-2xl border border-rose-200 p-6 max-w-sm w-full space-y-4 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-[#2B1D18]">
                  Delete Category
                </h3>
                <p className="text-xs text-[#24211F]/70">
                  Are you sure you want to delete this category?
                </p>
              </div>
            </div>

            <div className="bg-[#FAF5EC] p-3 rounded-xl border border-[#E6DCCE] text-xs space-y-1">
              <div className="font-bold text-[#2B1D18]">{deletingCategory.name}</div>
              {deletingCategory.description && (
                <div className="text-[#24211F]/60 line-clamp-2">
                  {deletingCategory.description}
                </div>
              )}
            </div>

            {/* Warning if category contains items */}
            {deletingCategory.menuItems && deletingCategory.menuItems.length > 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-amber-800">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Warning: Contains Menu Items</span>
                </div>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  This category currently contains{" "}
                  <strong className="font-bold">{deletingCategory.menuItems.length}</strong> menu item
                  {deletingCategory.menuItems.length > 1 ? "s" : ""}. Deleting this category will also
                  permanently remove these items from your menu.
                </p>
              </div>
            ) : (
              <p className="text-xs text-[#24211F]/60">
                This category has no items. It can be safely removed.
              </p>
            )}

            {deleteModalError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteModalError}</span>
              </div>
            )}

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete Category</span>
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingCategory(null)}
                className="px-4 py-2.5 border border-[#E6DCCE] text-[#24211F]/70 hover:bg-[#FAF5EC] rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
