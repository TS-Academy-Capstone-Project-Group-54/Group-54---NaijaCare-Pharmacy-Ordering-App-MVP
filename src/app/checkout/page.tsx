"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { formatNaira } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { ApiResponse, OrderSummary, PaymentStatus } from "@/types";

type CustomerProfile = {
  fullName: string;
  phoneNumber: string;
  address: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading, authFetch } = useAuth();
  const { items, subtotal, clearCart, storageError } = useCart();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("Paid");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profileNotice, setProfileNotice] = useState("");
  const hasUnavailableItems = items.some((item) => item.availableStock < 1 || item.quantity > item.availableStock);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      try {
        const res = await authFetch("/api/users/profile");
        const payload = (await res.json()) as ApiResponse<CustomerProfile>;
        if (!active) return;
        if (payload.success && payload.data) {
          setPhoneNumber(payload.data.phoneNumber || "");
          setDeliveryAddress(payload.data.address || "");
        } else {
          setProfileNotice("Saved delivery details could not be loaded. You can enter them below.");
        }
      } catch {
        if (active) setProfileNotice("Saved delivery details could not be loaded. You can enter them below.");
      }
    })();
    return () => {
      active = false;
    };
  }, [user, authFetch]);

  if (authLoading || !user) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <LoadingSpinner label="Preparing checkout..." />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Checkout</h1>
        {storageError ? (
          <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            {storageError}
          </p>
        ) : null}
        <p className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          Your cart is empty.{" "}
          <Link href="/medicines" className="font-semibold text-emerald-700 underline dark:text-emerald-400">
            Browse medicines
          </Link>
        </p>
      </div>
    );
  }

  const placeOrder = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!items.length || hasUnavailableItems || loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await authFetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryAddress,
          phoneNumber,
          paymentStatus,
          items: items.map((i) => ({ medicineId: i.medicineId, quantity: i.quantity })),
        }),
      });

      const payload = (await res.json()) as ApiResponse<OrderSummary>;

      if (!payload.success || !payload.data) {
        setError(payload.message || "Order could not be placed.");
        return;
      }

      const id = payload.data.id;
      clearCart();
      router.push(`/orders/${id}`);
    } catch {
      setError("Order could not be placed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 fade-in">
      <section>
        <h1 className="text-3xl font-bold">Checkout</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Confirm your Nigerian delivery address and place your medicine order.
        </p>
        <form onSubmit={placeOrder} className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          {profileNotice ? (
            <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              {profileNotice}
            </p>
          ) : null}
          {storageError ? (
            <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              {storageError}
            </p>
          ) : null}
          {hasUnavailableItems ? (
            <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              Cart stock has changed. Return to your cart to remove unavailable items or adjust quantities.
              {" "}
              <Link href="/cart" className="font-semibold underline">Edit cart</Link>
            </p>
          ) : null}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Phone Number</label>
            <input
              name="phoneNumber"
              type="tel"
              autoComplete="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              minLength={7}
              maxLength={30}
              placeholder="+234 803 000 0000"
              disabled={loading}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Delivery Address</label>
            <textarea
              name="deliveryAddress"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              required
              minLength={5}
              maxLength={500}
              placeholder="Street, area, city, state"
              disabled={loading}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
              MVP Payment Simulation Status
            </label>
            <select
              name="paymentStatus"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
              disabled={loading}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="Paid">Paid (Instant Transfer / Card MVP)</option>
              <option value="Pending">Pending (Pay on Delivery)</option>
              <option value="Failed">Failed (Test Payment Failure)</option>
            </select>
          </div>
          {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" disabled={loading || !items.length || hasUnavailableItems} className="w-full">
            {loading ? "Placing order..." : `Place Order (${formatNaira(subtotal)})`}
          </Button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Order Summary</h2>
          <Link href="/cart" className="text-sm font-medium text-emerald-700 underline dark:text-emerald-400">
            Edit cart
          </Link>
        </div>
        <div className="mt-3 divide-y divide-slate-200 text-sm dark:divide-slate-800">
          {items.map((item) => (
            <div className="flex items-center justify-between gap-3 py-2.5" key={item.medicineId}>
              <div>
                <p className="font-medium">{item.medicineName}</p>
                <p className="text-xs text-slate-500">
                  Qty: {item.quantity} × {formatNaira(item.unitPrice)}
                </p>
                {item.quantity > item.availableStock ? (
                  <p className="text-xs font-medium text-red-700 dark:text-red-300">
                    Only {item.availableStock} currently available
                  </p>
                ) : null}
              </div>
              <span className="shrink-0 font-semibold">{formatNaira(item.unitPrice * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
          <div className="flex items-center justify-between text-lg font-bold">
            <span>Total Amount</span>
            <span className="text-emerald-700 dark:text-emerald-400">{formatNaira(subtotal)}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
