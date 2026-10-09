"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatNaira } from "@/lib/utils";
import type { AdminOrdersResponse, ApiResponse, OrderSummary } from "@/types";

export default function AdminOrdersPage() {
  const { authFetch } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [stats, setStats] = useState<AdminOrdersResponse["stats"] | null>(null);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams();
      if (status) query.set("status", status);
      if (search) query.set("search", search);
      const res = await authFetch(`/api/orders?${query.toString()}`);
      const payload = (await res.json()) as ApiResponse<AdminOrdersResponse>;
      if (payload.success && payload.data) {
        setOrders(payload.data.items);
        setStats(payload.data.stats);
      } else {
        setError(payload.message || "Unable to load orders.");
      }
    } catch {
      setError("Unable to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [authFetch, status, search]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const query = new URLSearchParams();
        if (status) query.set("status", status);
        if (search) query.set("search", search);
        const res = await authFetch(`/api/orders?${query.toString()}`);
        const payload = (await res.json()) as ApiResponse<AdminOrdersResponse>;
        if (!active) return;
        if (payload.success && payload.data) {
          setOrders(payload.data.items);
          setStats(payload.data.stats);
        } else {
          setError(payload.message || "Unable to load orders.");
        }
      } catch {
        if (active) setError("Unable to load orders. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [authFetch, status, search]);

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold">Manage Orders</h1>
      <div className="grid gap-2 rounded-xl border bg-white p-4 md:grid-cols-3 dark:bg-slate-900">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by order id/customer" className="rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-800" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
          <option value="">All statuses</option>
          {["Pending","Confirmed","Processing","Ready for Delivery","Out for Delivery","Delivered","Cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button
          onClick={() => void load()}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700"
        >
          Search/Refresh
        </button>
      </div>
      {error ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      ) : null}
      {stats ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(stats).map(([k, v]) => (
            <div key={k} className="rounded-lg border bg-white p-3 dark:bg-slate-900"><p className="text-sm text-slate-500">{k}</p><p className="font-bold">{String(v)}</p></div>
          ))}
        </div>
      ) : null}
      <div className="overflow-x-auto rounded-xl border bg-white dark:bg-slate-900">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 dark:bg-slate-800"><tr><th className="p-3 text-left">Order</th><th className="p-3 text-left">Customer</th><th className="p-3 text-left">Total</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Action</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td className="p-4 text-center text-slate-500" colSpan={5}>Loading orders...</td></tr>
            ) : orders.length ? (
              orders.map((o) => (
                <tr key={o.id} className="border-t dark:border-slate-800">
                  <td className="p-3">#{o.id.slice(0, 8).toUpperCase()}</td>
                  <td className="p-3">{o.customerName || "Unknown customer"}</td>
                  <td className="p-3">{formatNaira(Number(o.totalAmount))}</td>
                  <td className="p-3"><StatusBadge status={o.orderStatus} /></td>
                  <td className="p-3"><Link className="rounded border px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-800" href={`/admin/orders/${o.id}`}>View</Link></td>
                </tr>
              ))
            ) : (
              <tr><td className="p-4 text-center text-slate-500" colSpan={5}>No orders found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
