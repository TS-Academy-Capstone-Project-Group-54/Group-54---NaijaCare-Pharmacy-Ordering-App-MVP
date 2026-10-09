"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/cart-context";
import { formatNaira } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, subtotal, itemCount, storageError } = useCart();

  if (!items.length) {
    return (
      <div className="space-y-4">
        {storageError ? (
          <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            {storageError}
          </p>
        ) : null}
        <EmptyState title="Your cart is empty." subtitle="Add medicines and continue shopping." />
        <div className="text-center">
          <Link href="/medicines" className="font-semibold text-emerald-700 underline dark:text-emerald-400">
            Browse medicines
          </Link>
        </div>
      </div>
    );
  }

  const hasUnavailableItems = items.some((item) => item.availableStock < 1 || item.quantity > item.availableStock);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Shopping Cart</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </p>
        </div>
        <button
          type="button"
          onClick={clearCart}
          className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
        >
          Clear cart
        </button>
      </div>
      {storageError ? (
        <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          {storageError}
        </p>
      ) : null}
      {hasUnavailableItems ? (
        <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          Some quantities exceed current stock. Update or remove unavailable medicines before checkout.
        </p>
      ) : null}
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.medicineId} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14 overflow-hidden rounded-lg">
                <Image src={item.image} alt={item.medicineName} fill className="object-cover" />
              </div>
              <div>
                <p className="font-semibold">{item.medicineName}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">{formatNaira(item.unitPrice)} each</p>
                {item.availableStock < 1 ? (
                  <p className="text-xs font-medium text-red-700 dark:text-red-300">Currently out of stock</p>
                ) : item.quantity > item.availableStock ? (
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                    Only {item.availableStock} available
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={`Decrease quantity of ${item.medicineName}`}
                disabled={item.quantity <= 1 || item.availableStock < 1}
                className="rounded border px-2 py-1 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
                onClick={() => updateQuantity(item.medicineId, item.quantity - 1)}
              >
                −
              </button>
              <span aria-live="polite" className="min-w-6 text-center">{item.quantity}</span>
              <button
                type="button"
                aria-label={`Increase quantity of ${item.medicineName}`}
                disabled={item.quantity >= item.availableStock}
                className="rounded border px-2 py-1 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
                onClick={() => updateQuantity(item.medicineId, item.quantity + 1)}
              >
                +
              </button>
              <button
                type="button"
                className="rounded border border-red-300 px-2 py-1 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40"
                onClick={() => removeItem(item.medicineId)}
              >
                Remove
              </button>
            </div>
            <p className="font-semibold">{formatNaira(item.quantity * item.unitPrice)}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between rounded-xl border bg-white p-4 dark:bg-slate-900">
        <p className="text-lg font-semibold">Total: {formatNaira(subtotal)}</p>
        <Link
          aria-disabled={hasUnavailableItems}
          href={hasUnavailableItems ? "/cart" : "/checkout"}
          onClick={(event) => {
            if (hasUnavailableItems) event.preventDefault();
          }}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
        >
          Proceed to checkout
        </Link>
      </div>
      <Link href="/medicines" className="inline-block text-sm font-medium text-emerald-700 underline dark:text-emerald-400">
        Continue shopping
      </Link>
    </div>
  );
}
