"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { formatNaira } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ApiResponse, OrderDetails, OrderStatus, OrderSummary } from "@/types";

const statuses: OrderStatus[] = ["Pending", "Confirmed", "Processing", "Ready for Delivery", "Out for Delivery", "Delivered", "Cancelled"];

export default function AdminOrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const { authFetch } = useAuth();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [status, setStatus] = useState<OrderStatus>("Pending");
  const [savedMessage, setSavedMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await authFetch(`/api/orders/${params.id}`);
        const payload = (await res.json()) as ApiResponse<OrderDetails>;
        if (!active) return;
        if (payload.success && payload.data) {
          setOrder(payload.data);
          setStatus(payload.data.orderStatus);
        } else {
          setError(payload.message || "Unable to load order.");
        }
      } catch {
        if (active) setError("Unable to load order. Please try again.");
      }
    })();
    return () => {
      active = false;
    };
  }, [authFetch, params.id]);

  const updateStatus = async () => {
    setSavedMessage("");
    setError("");
    setSaving(true);
    try {
      const res = await authFetch(`/api/orders/${params.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus: status }),
      });
      const payload = (await res.json()) as ApiResponse<OrderSummary>;
      if (payload.success && payload.data) {
        const updatedOrder = payload.data;
        setSavedMessage(`Order status updated to "${status}".`);
        setOrder((current) =>
          current
            ? { ...current, orderStatus: updatedOrder.orderStatus, updatedAt: updatedOrder.updatedAt }
            : current,
        );
      } else {
        setError(payload.message || "Unable to update order status.");
      }
    } catch {
      setError("Unable to update order status. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (error && !order) return <p role="alert" className="text-red-700 dark:text-red-300">{error}</p>;
  if (!order) return <p>Loading order details...</p>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Order #{order.id.slice(0,8).toUpperCase()}</h1>
        <StatusBadge status={order.orderStatus} />
      </div>
      <div className="rounded-xl border bg-white p-4 dark:bg-slate-900">
        <p>Customer delivery: {order.deliveryAddress}</p>
        <p>Phone: {order.phoneNumber}</p>
        <p className="font-semibold">Total: {formatNaira(Number(order.totalAmount))}</p>
      </div>
      <div className="rounded-xl border bg-white p-4 dark:bg-slate-900">
        <h2 className="font-semibold">Items</h2>
        <div className="mt-2 space-y-2 text-sm">
          {order.items.map((i) => (
            <div key={i.id} className="flex justify-between"><span>{i.medicineName} × {i.quantity}</span><span>{formatNaira(Number(i.subtotal))}</span></div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border bg-white p-4 dark:bg-slate-900">
        <h2 className="font-semibold">Update Fulfilment Status</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
            disabled={saving || order.orderStatus === "Cancelled" || order.orderStatus === "Delivered"}
            className="rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
          >
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={updateStatus}
            disabled={saving || order.orderStatus === "Cancelled" || order.orderStatus === "Delivered"}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Updating..." : "Update"}
          </button>
        </div>
        {savedMessage ? <p className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">{savedMessage}</p> : null}
        {error ? <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p> : null}
      </div>
    </div>
  );
}
