/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: May 24, 2026
*/

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getCategories as fetchCategories,
  createCategory,
  editCategory,
  deleteCategory,
} from "@/actions";
import {
  Plus,
  X,
  Loader2,
  Pencil,
  Trash2,
  Package,
  FolderTree,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { CardSkeleton } from "@/components/ui/skeleton";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import type { Category } from "@prisma/client";

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<
    (Category & {
      childCategories: Category[];
      _count: { products: number };
    })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [catName, setCatName] = useState("");
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCategories().then((data) => {
      setCategories(data as any);
      setLoading(false);
    });
  }, []);

  async function handleAdd() {
    if (!catName.trim()) return;
    setAdding(true);
    setError("");
    try {
      const cat = await createCategory(catName.trim());
      setCategories((prev) => [cat as any, ...prev]);
      setShowAdd(false);
      setCatName("");
      router.refresh();
    } catch (e: any) {
      setError(e.message || "Failed to create category");
    } finally {
      setAdding(false);
    }
  }

  function openEdit(cat: (typeof categories)[number]) {
    setEditId(cat.id);
    setEditName(cat.name);
    setError("");
  }

  async function handleSaveEdit() {
    if (!editId || !editName.trim()) return;
    setSaving(true);
    setError("");
    try {
      const updated = await editCategory(editId, editName.trim());
      setCategories((prev) =>
        prev.map((c) => (c.id === editId ? { ...c, name: updated.name } : c)),
      );
      setEditId(null);
      setEditName("");
      router.refresh();
    } catch (e: any) {
      setError(e.message || "Failed to update category");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (deleteTarget === null) return;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await deleteCategory(deleteTarget);
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget));
      setDeleteTarget(null);
      router.refresh();
    } catch (e: any) {
      setDeleteError(e.message || "Failed to delete category");
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  if (loading)
    return (
      <div className="space-y-5">
        <PageHeader title="Category Management" subtitle="Loading..." />
        <CardSkeleton count={6} />
      </div>
    );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Category Management"
          subtitle="Organize your product catalog — add, edit, and remove categories."
        />
        <button
          onClick={() => {
            setShowAdd(true);
            setError("");
            setCatName("");
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white text-sm font-semibold rounded-lg shadow-lg shadow-[#fd761a]/20 hover:shadow-xl hover:shadow-[#fd761a]/25 transition-all duration-200 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  Name
                </th>
                <th className="text-center p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  Products
                </th>
                <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  Created
                </th>
                <th className="text-center p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                  Status
                </th>
                <th className="text-center p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider w-28">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {categories.map((cat, i) => (
                <tr
                  key={cat.id}
                  className={`${i % 2 === 0 ? "" : "bg-[#fafbfc]"} hover:bg-[#f1f5f9] transition-colors`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#fd761a]/10 to-[#fd761a]/5 flex items-center justify-center">
                        <FolderTree className="h-4 w-4 text-[#fd761a]" />
                      </div>
                      <span className="font-medium text-[#0e212c]">
                        {cat.name}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#f1f5f9] text-[#64748b] text-xs font-medium">
                      <Package className="h-3 w-3" />
                      {cat._count.products}
                    </span>
                  </td>
                  <td className="p-4 text-[#64748b]">
                    {cat.createdAt
                      ? new Date(cat.createdAt).toLocaleDateString("en-PH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        cat.isAvailable
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {cat.isAvailable ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEdit(cat)}
                        className="p-1.5 rounded-md text-[#94a3b8] hover:text-[#fd761a] hover:bg-amber-50 transition-all"
                        title="Edit Category"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteTarget(cat.id);
                          setDeleteError("");
                        }}
                        className="p-1.5 rounded-md text-[#94a3b8] hover:text-rose-500 hover:bg-rose-50 transition-all"
                        title="Delete Category"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#94a3b8]">
                    No categories found. Click "Add Category" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Category Modal */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center"
          onClick={() => {
            setShowAdd(false);
            setError("");
            setCatName("");
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e8f0]">
              <h2 className="text-lg font-bold text-[#0e212c]">Add Category</h2>
              <button
                onClick={() => {
                  setShowAdd(false);
                  setError("");
                  setCatName("");
                }}
                className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="px-3.5 py-2.5 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                  Category Name *
                </label>
                <input
                  value={catName}
                  onChange={(e) => {
                    setCatName(e.target.value);
                    setError("");
                  }}
                  placeholder="e.g. Power Tools"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdd();
                  }}
                  autoFocus
                  className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowAdd(false);
                    setError("");
                    setCatName("");
                  }}
                  className="flex-1 py-2.5 border border-[#e2e8f0] text-sm font-medium text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!catName.trim() || adding}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white text-sm font-semibold rounded-lg shadow-lg shadow-[#fd761a]/20 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {adding ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Adding...
                    </>
                  ) : (
                    "Add Category"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editId !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center"
          onClick={() => {
            setEditId(null);
            setError("");
            setEditName("");
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e8f0]">
              <h2 className="text-lg font-bold text-[#0e212c]">
                Edit Category
              </h2>
              <button
                onClick={() => {
                  setEditId(null);
                  setError("");
                  setEditName("");
                }}
                className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="px-3.5 py-2.5 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                  Category Name *
                </label>
                <input
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                    setError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit();
                  }}
                  autoFocus
                  className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setEditId(null);
                    setError("");
                    setEditName("");
                  }}
                  className="flex-1 py-2.5 border border-[#e2e8f0] text-sm font-medium text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={!editName.trim() || saving}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white text-sm font-semibold rounded-lg shadow-lg shadow-[#fd761a]/20 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => {
          setDeleteTarget(null);
          setDeleteError("");
        }}
        onConfirm={handleDelete}
        title="Delete Category"
        message={
          deleteError ||
          "Are you sure you want to delete this category? This action cannot be undone."
        }
        confirmLabel={deleteLoading ? "Deleting..." : "Delete"}
        variant="danger"
      />
    </div>
  );
}
