"use client";

import React, { useState, useEffect } from "react";
import { FileText, ShieldAlert, Clock, RefreshCw } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/audit-logs");
      if (res.ok) {
        const json = await res.json();
        setLogs(json.logs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Security & Operations Audit Trail</h1>
          <p className="text-xs text-gray-400 mt-0.5">Immutable record of logins, order creations, courier dispatches, and OTP verifications.</p>
        </div>
        <button
          onClick={loadLogs}
          className="px-4 py-2 rounded-xl bg-[#0F121B] border border-[#1C202C] text-xs text-gray-300 hover:text-white flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Logs</span>
        </button>
      </div>

      <div className="rounded-2xl bg-[#0F121B] border border-[#1C202C] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#141824] border-b border-[#1C202C] text-gray-400 font-mono uppercase text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Action Event</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Entity</th>
                <th className="py-3.5 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C202C]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    Loading security audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No audit records recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#121622] transition-colors">
                    <td className="py-3.5 px-4 font-mono text-gray-400 text-[11px] whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
                        log.action.includes("OTP")
                          ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/40"
                          : log.action.includes("ORDER")
                          ? "bg-blue-950/60 text-blue-400 border-blue-800/40"
                          : "bg-purple-950/60 text-purple-300 border-purple-800/40"
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-white font-medium">
                        {log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : "System Automated"}
                      </p>
                      <p className="text-[10px] text-gray-500 font-mono">
                        {log.actor?.role || "SYSTEM"}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-300">
                      {log.entityType}
                    </td>
                    <td className="py-3.5 px-4 text-gray-400 font-mono text-[11px] max-w-xs truncate">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
