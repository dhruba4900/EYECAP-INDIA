"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Users,
  KeyRound,
  FileText,
  Search,
  UserPlus,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Lock,
  Mail,
  UserCheck,
  UserX,
  Clock,
  Eye,
  SlidersHorizontal,
} from "lucide-react";

type UserItem = {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  adminProfile?: {
    id: string;
    department: string;
    isSuperAdmin: boolean;
    accessLevel: number;
  } | null;
  deliveryPartner?: {
    id: string;
    vehicleType: string;
    vehiclePlate: string;
    isAvailable: boolean;
    currentZone: string;
    rating: number;
  } | null;
};

type AuditItem = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  createdAt: string;
  actor?: {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  } | null;
};

export default function SecurityConsolePage() {
  const [activeTab, setActiveTab] = useState<"accounts" | "audit">("accounts");
  const [users, setUsers] = useState<UserItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserItem | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserItem | null>(null);

  // Form states
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newRole, setNewRole] = useState("CUSTOMER");
  const [newIsSuperAdmin, setNewIsSuperAdmin] = useState(false);
  const [newDepartment, setNewDepartment] = useState("Security Operations");

  // Edit states
  const [editEmail, setEditEmail] = useState("");
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editIsSuperAdmin, setEditIsSuperAdmin] = useState(false);

  // Password reset state
  const [resetPasswordValue, setResetPasswordValue] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);

      const res = await fetch(`/api/admin/security/users?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load accounts");
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message || "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  const loadAuditLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/security/audit-logs");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load audit logs");
      setAuditLogs(data.logs || []);
    } catch (err: any) {
      setError(err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "accounts") {
      void loadUsers();
    } else {
      void loadAuditLogs();
    }
  }, [activeTab, loadUsers, loadAuditLogs]);

  // Handle Create Account
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/security/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          firstName: newFirstName,
          lastName: newLastName,
          role: newRole,
          isSuperAdmin: newRole === "ADMIN" ? newIsSuperAdmin : false,
          department: newDepartment,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create user");

      setSuccess("Authorized account created successfully.");
      setCreateModalOpen(false);
      setNewEmail("");
      setNewPassword("");
      setNewFirstName("");
      setNewLastName("");
      await loadUsers();
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    }
  };

  // Handle Edit Account
  const handleEditAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/security/users/${editUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: editEmail,
          firstName: editFirstName,
          lastName: editLastName,
          isSuperAdmin: editUser.role === "ADMIN" ? editIsSuperAdmin : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update user");

      setSuccess("Account updated successfully.");
      setEditUser(null);
      await loadUsers();
    } catch (err: any) {
      setError(err.message || "Failed to update account");
    }
  };

  // Handle Password Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser) return;
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/security/users/${resetPasswordUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPassword: resetPasswordValue,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");

      setSuccess(`Password for ${resetPasswordUser.email} has been updated.`);
      setResetPasswordUser(null);
      setResetPasswordValue("");
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    }
  };

  // Handle Toggle Activation
  const handleToggleActivation = async (user: UserItem) => {
    const action = user.isActive ? "deactivate" : "activate";
    if (!window.confirm(`Are you sure you want to ${action} ${user.email}?`)) return;

    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/security/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to toggle status");

      setSuccess(`Account status updated for ${user.email}.`);
      await loadUsers();
    } catch (err: any) {
      setError(err.message || "Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-800/80 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab("accounts")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition-colors ${
              activeTab === "accounts"
                ? "bg-rose-950/60 border border-rose-800 text-rose-300 shadow-md"
                : "text-gray-400 hover:text-white hover:bg-gray-900/60"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>IDENTITY & ACCOUNTS</span>
            <span className="ml-1 rounded-full bg-rose-900/60 px-2 py-0.5 text-[10px] font-mono text-rose-200">
              {users.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition-colors ${
              activeTab === "audit"
                ? "bg-rose-950/60 border border-rose-800 text-rose-300 shadow-md"
                : "text-gray-400 hover:text-white hover:bg-gray-900/60"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>SECURITY AUDIT TRAIL</span>
          </button>
        </div>

        {activeTab === "accounts" && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 text-white text-xs font-bold hover:brightness-110 shadow-lg shadow-rose-950/40 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>CREATE AUTHORIZED ACCOUNT</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {/* ACCOUNTS VIEW */}
      {activeTab === "accounts" && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search accounts by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0D0F16] border border-gray-800 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="py-2 px-3 rounded-xl bg-[#0D0F16] border border-gray-800 text-xs text-gray-300 focus:outline-none focus:border-rose-600"
              >
                <option value="">All Roles</option>
                <option value="CUSTOMER">Customer</option>
                <option value="ADMIN">Administrator</option>
                <option value="DELIVERY_PARTNER">Delivery Partner</option>
              </select>

              <button
                onClick={loadUsers}
                className="p-2 rounded-xl bg-[#0D0F16] border border-gray-800 text-gray-400 hover:text-white"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-gray-800/80 bg-[#0A0C12] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#10131B] text-gray-400 border-b border-gray-800/80 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Account</th>
                    <th className="py-3 px-4">Role / Scope</th>
                    <th className="py-3 px-4">Security Level</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Registered</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-rose-500" />
                        <span>Querying identity records...</span>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
                        No accounts matching criteria.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const isSuper = u.role === "ADMIN" && Boolean(u.adminProfile?.isSuperAdmin);

                      return (
                        <tr key={u.id} className="hover:bg-gray-900/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-white">
                              {u.firstName} {u.lastName}
                            </div>
                            <div className="font-mono text-[11px] text-gray-400">{u.email}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider ${
                                u.role === "ADMIN"
                                  ? "bg-purple-950/60 border border-purple-800 text-purple-300"
                                  : u.role === "DELIVERY_PARTNER"
                                  ? "bg-amber-950/60 border border-amber-800 text-amber-300"
                                  : "bg-blue-950/60 border border-blue-800 text-blue-300"
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-[11px]">
                            {isSuper ? (
                              <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                                <Shield className="w-3.5 h-3.5" />
                                <span>SUPER ADMIN (L10)</span>
                              </span>
                            ) : u.role === "ADMIN" ? (
                              <span className="text-purple-400">Standard Admin (L5)</span>
                            ) : (
                              <span className="text-gray-500">Standard User</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            {u.isActive ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                                <CheckCircle className="w-3 h-3" />
                                <span>ACTIVE</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-400 font-mono text-[11px]">
                                <XCircle className="w-3 h-3" />
                                <span>DISABLED</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 font-mono text-[11px] text-gray-500">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setEditUser(u);
                                  setEditEmail(u.email);
                                  setEditFirstName(u.firstName);
                                  setEditLastName(u.lastName);
                                  setEditIsSuperAdmin(Boolean(u.adminProfile?.isSuperAdmin));
                                }}
                                className="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-200 text-[11px] font-medium transition-colors"
                              >
                                Edit Details
                              </button>

                              <button
                                onClick={() => {
                                  setResetPasswordUser(u);
                                  setResetPasswordValue("");
                                }}
                                className="px-2.5 py-1 rounded bg-rose-950/60 border border-rose-900 hover:bg-rose-900 text-rose-300 text-[11px] font-medium flex items-center gap-1 transition-colors"
                              >
                                <KeyRound className="w-3 h-3" />
                                <span>Reset Password</span>
                              </button>

                              <button
                                onClick={() => handleToggleActivation(u)}
                                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                                  u.isActive
                                    ? "bg-gray-800 text-gray-400 hover:bg-rose-950 hover:text-rose-300"
                                    : "bg-emerald-950 text-emerald-300 hover:bg-emerald-900"
                                }`}
                              >
                                {u.isActive ? "Deactivate" : "Activate"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* AUDIT TRAIL VIEW */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase text-gray-400 tracking-wider">
              Recorded Security & Administrative Events
            </h2>
            <button
              onClick={loadAuditLogs}
              className="p-1.5 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-[#0A0C12] overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#10131B] text-gray-400 border-b border-gray-800 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Event Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      Loading audit logs...
                    </td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      No security audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-900/30">
                      <td className="py-3 px-4 font-mono text-[11px] text-gray-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <span className="font-bold text-rose-300 bg-rose-950/40 border border-rose-900 px-1.5 py-0.5 rounded">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {log.actor ? (
                          <div>
                            <span className="text-white font-medium">{log.actor.firstName} {log.actor.lastName}</span>
                            <span className="block font-mono text-[10px] text-gray-400">{log.actor.email}</span>
                          </div>
                        ) : (
                          <span className="font-mono text-gray-500">SYSTEM</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-gray-300">
                        {log.entityType} {log.entityId ? `(${log.entityId.slice(0, 8)}…)` : ""}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-gray-400 max-w-xs truncate">
                        {log.details || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0D0F16] border border-rose-900/80 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-rose-400" />
                <span>Create Authorized Account</span>
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-3 text-xs">
              <div>
                <label className="text-gray-400 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black border border-gray-800 text-white focus:outline-none focus:border-rose-600"
                />
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Initial Password (min 12 characters)</label>
                <input
                  type="password"
                  required
                  minLength={12}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black border border-gray-800 text-white focus:outline-none focus:border-rose-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 block mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-black border border-gray-800 text-white focus:outline-none focus:border-rose-600"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-black border border-gray-800 text-white focus:outline-none focus:border-rose-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Account Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black border border-gray-800 text-white focus:outline-none focus:border-rose-600"
                >
                  <option value="CUSTOMER">CUSTOMER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="DELIVERY_PARTNER">DELIVERY_PARTNER</option>
                </select>
              </div>

              {newRole === "ADMIN" && (
                <div className="space-y-3 p-3 rounded-xl bg-rose-950/30 border border-rose-900/60">
                  <div>
                    <label className="text-gray-400 block mb-1">Department</label>
                    <input
                      type="text"
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                      className="w-full p-2 rounded-lg bg-black border border-gray-800 text-white"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-rose-300 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newIsSuperAdmin}
                      onChange={(e) => setNewIsSuperAdmin(e.target.checked)}
                      className="rounded border-gray-800"
                    />
                    <span>Grant Super Administrator Privileges</span>
                  </label>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0D0F16] border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-white">Edit Account Details</h3>
              <button onClick={() => setEditUser(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleEditAccount} className="space-y-3 text-xs">
              <div>
                <label className="text-gray-400 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black border border-gray-800 text-white focus:outline-none focus:border-rose-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 block mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-black border border-gray-800 text-white focus:outline-none focus:border-rose-600"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-black border border-gray-800 text-white focus:outline-none focus:border-rose-600"
                  />
                </div>
              </div>

              {editUser.role === "ADMIN" && (
                <label className="flex items-center gap-2 text-rose-300 font-semibold cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={editIsSuperAdmin}
                    onChange={(e) => setEditIsSuperAdmin(e.target.checked)}
                    className="rounded border-gray-800"
                  />
                  <span>Super Administrator Privileges</span>
                </label>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetPasswordUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0D0F16] border border-rose-900 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-rose-400" />
                <span>Reset Account Password</span>
              </h3>
              <button onClick={() => setResetPasswordUser(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-gray-400">
              Setting new credentials for <span className="font-mono text-cyan-400">{resetPasswordUser.email}</span>.
              This action will take effect immediately.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              <div>
                <label className="text-gray-400 block mb-1">New Password (minimum 12 characters)</label>
                <input
                  type="password"
                  required
                  minLength={12}
                  value={resetPasswordValue}
                  onChange={(e) => setResetPasswordValue(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full p-2.5 rounded-xl bg-black border border-gray-800 text-white focus:outline-none focus:border-rose-600"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetPasswordUser(null)}
                  className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
                >
                  Set New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
