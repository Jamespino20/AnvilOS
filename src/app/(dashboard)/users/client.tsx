/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: May 26, 2026
*/

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  User,
  X,
  Loader2,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { createUser, updateUser, deleteUser } from "@/actions";
import { PageHeader } from "@/components/ui/page-header";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { ExportDialog } from "@/components/export-dialog";
import { toast } from "sonner";

interface UserRow {
  id: number;
  sellerName: string;
  username: string;
  email: string | null;
  role: string;
  isActive: boolean;
  emailVerified: string | null;
  lastLogin: string | null;
  registryDate: string;
  _count: { transactions: number };
}

interface Props {
  users: UserRow[];
}

export function UsersClient({ users: initialUsers }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 15;
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    sellerName: "",
    username: "",
    email: "",
    password: "",
    role: "STAFF" as "ADMIN" | "STAFF",
  });

  function resetForm() {
    setForm({ sellerName: "", username: "", email: "", password: "", role: "STAFF" });
  }

  function openEdit(u: UserRow) {
    setForm({
      sellerName: u.sellerName,
      username: u.username,
      email: u.email || "",
      password: "",
      role: u.role as "ADMIN" | "STAFF",
    });
    setShowEdit(u.id);
  }

  const filtered = initialUsers.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.sellerName.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  function renderPageNumbers() {
    const pages: React.ReactNode[] = [];
    const maxVisible = 7;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <button key={i} onClick={() => setPage(i)}
            className={`min-w-[28px] h-7 text-xs font-semibold rounded-md transition-all ${i === page ? "bg-[#fd761a] text-white shadow-sm" : "text-[#64748b] hover:bg-[#f1f5f9]"}`}>
            {i}
          </button>
        );
      }
    } else {
      let start = Math.max(1, page - 3);
      let end = Math.min(totalPages, page + 3);
      if (start > 1) pages.push(<span key="start-ellipsis" className="px-1 text-[#94a3b8] text-xs">...</span>);
      for (let i = start; i <= end; i++) {
        pages.push(
          <button key={i} onClick={() => setPage(i)}
            className={`min-w-[28px] h-7 text-xs font-semibold rounded-md transition-all ${i === page ? "bg-[#fd761a] text-white shadow-sm" : "text-[#64748b] hover:bg-[#f1f5f9]"}`}>
            {i}
          </button>
        );
      }
      if (end < totalPages) pages.push(<span key="end-ellipsis" className="px-1 text-[#94a3b8] text-xs">...</span>);
    }
    return pages;
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.sellerName || !form.username || !form.password) return;
    setSaving(true);
    try {
      await createUser(form);
      setShowAdd(false);
      resetForm();
      router.refresh();
      toast.success("User created successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to create user");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (showEdit === null) return;
    setSaving(true);
    try {
      const payload: any = { sellerName: form.sellerName, username: form.username, email: form.email, role: form.role };
      if (form.password) payload.password = form.password;
      await updateUser(showEdit, payload);
      setShowEdit(null);
      resetForm();
      router.refresh();
      toast.success("User updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (deleteTarget === null) return;
    setDeleting(true);
    try {
      await deleteUser(deleteTarget);
      setDeleteTarget(null);
      router.refresh();
      toast.success("User deleted successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="User Management" subtitle="Manage system users — add, edit, activate or deactivate accounts. Assign roles and control access." />

      <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex flex-col lg:flex-row gap-3 items-center">
        <div className="relative w-full lg:flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name, username or email..."
            className="w-full h-10 pl-10 pr-4 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10" />
        </div>
        <div className="flex gap-2 w-full lg:w-auto">
          <ExportDialog
            filename={`cwl-hardware-users-${new Date().toISOString().slice(0, 10)}.csv`}
            allColumns={[
              { key: "sellerName", label: "Name" },
              { key: "username", label: "Username" },
              { key: "email", label: "Email" },
              { key: "role", label: "Role" },
              { key: "isActive", label: "Status" },
              { key: "lastLogin", label: "Last Login" },
            ]}
            fetchRows={async (selectedColumns) => filtered.map((u) =>
              selectedColumns.map((key) => {
                if (key === "sellerName") return u.sellerName;
                if (key === "username") return u.username;
                if (key === "email") return u.email || "";
                if (key === "role") return u.role;
                if (key === "isActive") return u.isActive ? "Active" : "Inactive";
                if (key === "lastLogin") return u.lastLogin ? new Date(u.lastLogin).toLocaleString("en-PH", { timeZone: "Asia/Manila" }) : "";
                return "";
              })
            )}
            label="Export" title="Export users"
          />
          <button onClick={() => { resetForm(); setShowAdd(true); }}
            className="h-10 flex items-center justify-center gap-2 px-5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white text-sm font-semibold rounded-lg shadow-lg shadow-[#fd761a]/20 hover:shadow-xl transition-all duration-200 active:scale-[0.98]">
            <Plus className="h-4 w-4" /> Add User
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden relative group">
        <div className="absolute top-1/2 right-4 -translate-y-1/2 px-2 py-4 bg-white/80 border border-[#e2e8f0] rounded-l-lg shadow-sm z-10 lg:hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-[#64748b] uppercase vertical-text">Scroll</span>
            <ChevronDown className="h-3 w-3 text-[#fd761a] -rotate-90" />
          </div>
        </div>
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-sm min-w-[900px] lg:min-w-0">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Name</th>
                <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Username</th>
                <th className="text-left p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Email</th>
                <th className="text-center p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Role</th>
                <th className="text-center p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Status</th>
                <th className="text-center p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Last Login</th>
                <th className="text-center p-4 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {paginated.map((u, i) => (
                <tr key={u.id} className={`${i % 2 === 0 ? "" : "bg-[#fafbfc]"} hover:bg-[#f1f5f9] transition-colors`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-[#94a3b8]" />
                      </div>
                      <div>
                        <p className="font-medium text-[#0e212c]">{u.sellerName}</p>
                        {u._count.transactions > 0 && (
                          <p className="text-[10px] text-[#94a3b8]">{u._count.transactions} transactions</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-[#64748b] font-mono text-sm">{u.username}</td>
                  <td className="p-4 text-[#64748b]">{u.email || <span className="text-[#94a3b8] italic">N/A</span>}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${u.role === "ADMIN" ? "bg-violet-50 text-violet-700 border border-violet-200" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${u.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-4 text-center text-[11px] text-[#94a3b8]">
                    {u.lastLogin
                      ? new Date(u.lastLogin).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" })
                      : <span className="italic">Never</span>}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(u)}
                        className="p-1.5 rounded-md text-[#94a3b8] hover:text-[#fd761a] hover:bg-amber-50 transition-all" title="Edit user">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeleteTarget(u.id)}
                        className="p-1.5 rounded-md text-[#94a3b8] hover:text-rose-500 hover:bg-rose-50 transition-all" title="Delete user">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#94a3b8]">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-[#e2e8f0] p-4 flex items-center justify-between text-sm text-[#64748b]">
          <span>Showing {paginated.length} of {filtered.length} users</span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage(Math.max(1, page - 1))}
                className="p-1.5 rounded-md text-[#64748b] hover:bg-[#f1f5f9] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                <ChevronLeft className="h-4 w-4" />
              </button>
              {renderPageNumbers()}
              <button disabled={page === totalPages} onClick={() => setPage(Math.min(totalPages, page + 1))}
                className="p-1.5 rounded-md text-[#64748b] hover:bg-[#f1f5f9] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e8f0]">
              <h2 className="text-lg font-bold text-[#0e212c]">Add User</h2>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Full Name *</label>
                <input value={form.sellerName} onChange={(e) => setForm({ ...form, sellerName: e.target.value })} required
                  className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Username *</label>
                  <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Password *</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Role</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as "ADMIN" | "STAFF" })}
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a]">
                    <option value="STAFF">Staff</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="px-5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] transition-colors">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white text-sm font-semibold rounded-lg shadow-lg shadow-[#fd761a]/20 hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEdit !== null && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center" onClick={() => { setShowEdit(null); resetForm(); }}>
          <div className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e8f0]">
              <h2 className="text-lg font-bold text-[#0e212c]">Edit User</h2>
              <button onClick={() => { setShowEdit(null); resetForm(); }} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Full Name</label>
                <input value={form.sellerName} onChange={(e) => setForm({ ...form, sellerName: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Username</label>
                  <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">Role</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as "ADMIN" | "STAFF" })}
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#fd761a]">
                    <option value="STAFF">Staff</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">New Password</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Leave blank to keep"
                    className="w-full px-3.5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm text-[#0e212c] focus:outline-none focus:border-[#fd761a]" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowEdit(null); resetForm(); }}
                  className="px-5 py-2.5 border border-[#e2e8f0] rounded-lg text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] transition-colors">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#fd761a] to-[#e56600] text-white text-sm font-semibold rounded-lg shadow-lg shadow-[#fd761a]/20 hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />} Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete User" message="Are you sure you want to delete this user? This action cannot be undone."
        confirmLabel={deleting ? "Deleting..." : "Delete"} variant="danger" />
    </div>
  );
}
