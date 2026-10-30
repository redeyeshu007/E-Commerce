"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Sparkles,
  Send,
  Clock,
  Ban,
  ShieldCheck,
  Eye,
  X,
  Loader2,
} from "lucide-react";
import { AdminNavbar } from "@/components/admin/admin-navbar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { logoutAdmin } from "@/services/admin-auth-service";

interface EmailLogItem {
  id: string;
  emailType: string;
  recipientEmail: string;
  customerId: string | null;
  orderId: string | null;
  status: "PENDING" | "SENT" | "DELIVERED" | "BOUNCED" | "FAILED";
  providerMessageId: string | null;
  errorMessage: string | null;
  idempotencyKey: string | null;
  metadata: Record<string, unknown> | null;
  sentAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

interface EmailStats {
  total: number;
  sent: number;
  delivered: number;
  bounced: number;
  failed: number;
  deliveryRate: number;
}

export default function AdminEmailsPage() {
  const [logs, setLogs] = useState<EmailLogItem[]>([]);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isRetryingId, setIsRetryingId] = useState<string | null>(null);
  const [isTriggeringReminder, setIsTriggeringReminder] = useState(false);
  const [selectedLog, setSelectedLog] = useState<EmailLogItem | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/emails/admin/stats", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.data) {
        setStats(data.data);
      }
    } catch {
      // Ignore background stats error
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
        type: typeFilter,
        status: statusFilter,
      });
      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }

      const res = await fetch(`/api/emails/admin/logs?${params.toString()}`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to load email logs");
      }

      const body = await res.json();
      if (body.success && body.data) {
        setLogs(body.data.logs || []);
        setTotalPages(body.data.pagination?.totalPages || 1);
        setTotalCount(body.data.pagination?.total || 0);
      }
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to load email logs",
      });
    } finally {
      setIsLoading(false);
    }
  }, [page, typeFilter, statusFilter, searchQuery]);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [fetchLogs, fetchStats]);

  const handleRetry = async (logId: string) => {
    setIsRetryingId(logId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/emails/admin/logs/${logId}/retry`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to retry email delivery");
      }
      setFeedback({ type: "success", message: "Email delivery re-attempt dispatched successfully." });
      await fetchLogs();
      await fetchStats();
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Error retrying email dispatch",
      });
    } finally {
      setIsRetryingId(null);
    }
  };

  const handleTriggerDailyCartReminder = async () => {
    if (!confirm("Are you sure you want to trigger the daily cart reminder job immediately for all eligible customers?")) {
      return;
    }

    setIsTriggeringReminder(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/emails/admin/cart-reminder/trigger", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to trigger cart reminders");
      }
      const summary = data.data;
      setFeedback({
        type: "success",
        message: `Cart reminder executed: ${summary.sent} emails sent, ${summary.failed} failed out of ${summary.eligibleCount} eligible customers.`,
      });
      await fetchLogs();
      await fetchStats();
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to execute cart reminders",
      });
    } finally {
      setIsTriggeringReminder(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutAdmin();
    } catch {
      // Safe fallback
    } finally {
      if (typeof window !== "undefined") {
        window.location.href = "/?auth=login";
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Delivered
          </span>
        );
      case "SENT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <Send className="w-3 h-3 text-blue-600" />
            Dispatched
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="w-3 h-3 text-red-600" />
            Failed
          </span>
        );
      case "BOUNCED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Ban className="w-3 h-3 text-amber-600" />
            Bounced
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
            <Clock className="w-3 h-3 text-neutral-500" />
            Pending
          </span>
        );
    }
  };

  const formatEmailType = (type: string) => {
    switch (type) {
      case "WELCOME":
        return "Customer Welcome";
      case "PASSWORD_RESET_OTP":
        return "Password Reset OTP";
      case "DAILY_CART_REMINDER":
        return "Cart Reminder";
      case "ORDER_CONFIRMED":
        return "Order Placed / Paid";
      case "ORDER_PROCESSING":
        return "Order Processing";
      case "ORDER_SHIPPED":
        return "Order Shipped (With Photos)";
      case "ORDER_COMPLETED":
        return "Order Delivered";
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col font-sans">
      <AdminNavbar
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-neutral-500 mb-4">
          <Link href="/admin/dashboard" className="hover:text-neutral-900 transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-neutral-900 font-medium">Email Notification System</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-neutral-200">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-serif tracking-tight text-neutral-900">
                Email Notification Logs
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FAF6EE] text-[#C5A572] border border-[#EAE2D1]">
                SMTP (Nodemailer)
              </span>
            </div>
            <p className="text-sm text-neutral-500 mt-1 max-w-2xl">
              Monitor outgoing customer communications, delivery statuses, idempotency keys, and retry failed transmissions.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleTriggerDailyCartReminder}
              disabled={isTriggeringReminder}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium bg-[#111111] hover:bg-black text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
            >
              {isTriggeringReminder ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-[#C5A572]" />
              )}
              <span>Run Cart Reminders</span>
            </button>

            <button
              type="button"
              onClick={() => {
                fetchLogs();
                fetchStats();
              }}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            role="alert"
            className={`mt-6 p-4 rounded-lg text-sm flex items-center justify-between gap-3 border ${
              feedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-neutral-500 hover:text-neutral-800 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* KPI Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white border border-neutral-200/80 p-4 rounded-xl shadow-xs">
              <span className="text-xs uppercase font-medium tracking-wider text-neutral-500">
                Total Dispatched
              </span>
              <p className="text-2xl font-semibold text-neutral-900 mt-1">{stats.total}</p>
              <span className="text-[11px] text-neutral-400">All customer communications</span>
            </div>

            <div className="bg-white border border-neutral-200/80 p-4 rounded-xl shadow-xs">
              <span className="text-xs uppercase font-medium tracking-wider text-emerald-700">
                Delivered Successfully
              </span>
              <p className="text-2xl font-semibold text-emerald-800 mt-1">{stats.delivered + stats.sent}</p>
              <span className="text-[11px] text-emerald-600">
                {stats.deliveryRate}% delivery success rate
              </span>
            </div>

            <div className="bg-white border border-neutral-200/80 p-4 rounded-xl shadow-xs">
              <span className="text-xs uppercase font-medium tracking-wider text-amber-700">
                Bounced / Rejected
              </span>
              <p className="text-2xl font-semibold text-amber-800 mt-1">{stats.bounced}</p>
              <span className="text-[11px] text-amber-600">Invalid inbox addresses</span>
            </div>

            <div className="bg-white border border-neutral-200/80 p-4 rounded-xl shadow-xs">
              <span className="text-xs uppercase font-medium tracking-wider text-red-700">
                Failed Transmissions
              </span>
              <p className="text-2xl font-semibold text-red-800 mt-1">{stats.failed}</p>
              <span className="text-[11px] text-red-600">Eligible for retry</span>
            </div>
          </div>
        )}

        {/* Filters & Search Toolbar */}
        <div className="mt-6 bg-white border border-neutral-200/80 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="w-full md:w-80 relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by recipient email or order ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF9F6] border border-neutral-200 rounded-lg outline-none focus:border-[#C5A572] focus:bg-white text-neutral-900"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs bg-[#FAF9F6] border border-neutral-200 rounded-lg outline-none focus:border-[#C5A572] text-neutral-800 cursor-pointer"
            >
              <option value="ALL">All Email Types</option>
              <option value="WELCOME">Customer Welcome</option>
              <option value="PASSWORD_RESET_OTP">Password Reset OTP</option>
              <option value="DAILY_CART_REMINDER">Cart Reminder</option>
              <option value="ORDER_CONFIRMED">Order Placed / Paid</option>
              <option value="ORDER_PROCESSING">Order Processing</option>
              <option value="ORDER_SHIPPED">Order Shipped</option>
              <option value="ORDER_COMPLETED">Order Delivered</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs bg-[#FAF9F6] border border-neutral-200 rounded-lg outline-none focus:border-[#C5A572] text-neutral-800 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="SENT">Dispatched</option>
              <option value="DELIVERED">Delivered</option>
              <option value="FAILED">Failed</option>
              <option value="BOUNCED">Bounced</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="mt-4 bg-white border border-neutral-200/80 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF9F6] border-b border-neutral-200 text-neutral-600 font-medium uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Order Ref</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Provider Ref</th>
                  <th className="py-3 px-4">Sent At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-neutral-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-[#C5A572]" />
                        <span>Loading email records...</span>
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-neutral-500">
                      <Mail className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                      <p className="font-medium text-neutral-700">No email records found</p>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Emails dispatched to customers will appear here with live SMTP delivery receipts.
                      </p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-neutral-900">{log.recipientEmail}</div>
                        {log.customerId && (
                          <div className="text-[10px] text-neutral-400 font-mono">
                            Cust: {log.customerId.substring(0, 10)}...
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-medium text-neutral-800">
                          {formatEmailType(log.emailType)}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-neutral-600">
                        {log.orderId ? (
                          <Link
                            href={`/admin/orders`}
                            className="text-[#C5A572] hover:underline"
                          >
                            #{log.orderId.substring(log.orderId.length - 8)}
                          </Link>
                        ) : (
                          <span className="text-neutral-300">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4">{getStatusBadge(log.status)}</td>

                      <td className="py-3 px-4 font-mono text-[11px] text-neutral-500">
                        {log.providerMessageId ? (
                          <span title={log.providerMessageId}>
                            {log.providerMessageId.substring(0, 14)}...
                          </span>
                        ) : (
                          <span className="text-neutral-300">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-neutral-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString("en-IN", {
                          dateStyle: "short",
                          timeStyle: "short",
                          timeZone: "Asia/Kolkata",
                        })}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center gap-1 text-[11px] text-neutral-600 hover:text-neutral-900 p-1 rounded hover:bg-neutral-100 transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Details</span>
                        </button>

                        {log.status === "FAILED" && (
                          <button
                            type="button"
                            onClick={() => handleRetry(log.id)}
                            disabled={isRetryingId === log.id}
                            className="inline-flex items-center gap-1 text-[11px] text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <RotateCcw
                              className={`w-3 h-3 ${isRetryingId === log.id ? "animate-spin" : ""}`}
                            />
                            <span>Retry</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="py-3 px-4 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500 bg-[#FAF9F6]">
              <span>
                Showing Page {page} of {totalPages} ({totalCount} total entries)
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal: Email Log Details */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-[#C5A572]" />
                  <h3 className="font-serif text-lg font-medium text-neutral-900">
                    Email Record Details
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Recipient</span>
                  <span className="font-medium text-neutral-900">{selectedLog.recipientEmail}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Email Purpose</span>
                  <span className="font-medium text-neutral-900">
                    {formatEmailType(selectedLog.emailType)}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Delivery Status</span>
                  <span>{getStatusBadge(selectedLog.status)}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Provider Message ID</span>
                  <span className="font-mono text-neutral-700 select-all">
                    {selectedLog.providerMessageId || "None"}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-neutral-100">
                  <span className="text-neutral-500">Idempotency Key</span>
                  <span className="font-mono text-[11px] text-neutral-700 select-all">
                    {selectedLog.idempotencyKey || "None"}
                  </span>
                </div>

                {selectedLog.errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 space-y-1">
                    <span className="font-semibold block uppercase text-[10px] tracking-wider">
                      Failure Reason
                    </span>
                    <p className="font-mono text-[11px]">{selectedLog.errorMessage}</p>
                  </div>
                )}

                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg space-y-1">
                    <span className="font-semibold block uppercase text-[10px] tracking-wider text-neutral-600">
                      Payload Metadata
                    </span>
                    <pre className="font-mono text-[11px] text-neutral-800 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-neutral-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-medium rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
