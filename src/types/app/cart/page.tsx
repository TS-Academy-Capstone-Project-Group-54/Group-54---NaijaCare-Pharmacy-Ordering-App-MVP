"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { formatNaira } from "@/lib/utils";

const FALLBACK_IMAGE = "/images/pharmacy-hero.png";

export default function CartPage() {
  const { items, total, count, setQuantity, removeItem, clear } = useCart();
  const { user } = useAuth();
  const [confirmClear, setConfirmClear] = useState(false);

  if (items.length === 0) {
    return (
      <div className="space-y-3">
        <h1 className="text-3xl font-bold">Your cart</h1>
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
          Your cart is empty.{" "}
          <Link href="/medicines" className="underline">
            Browse medicines
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Your cart</h1>
        <button onClick={() => setConfirmClear(true)} className="text-sm text-red-700 underline dark:text-red-400">
          Clear cart
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex gap-3 rounded-xl border bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image || FALLBACK_IMAGE}
                alt=""
                onError={(e) => {
                  if (!e.currentTarget.src.endsWith(FALLBACK_IMAGE)) e.currentTarget.src = FALLBACK_IMAGE;
                }}
                className="h-20 w-20 rounded-lg object-cover"
              />
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/medicines/${item.id}`} className="font-semibold hover:underline">
                    {item.name}
                  </Link>
                  <p className="font-semibold">{formatNaira(item.price * item.quantity)}</p>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">{formatNaira(item.price)} each</p>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    Quantity
                    <input
                      type="number"
                      min={1}
                      max={item.maxStock}
                      value={item.quantity}
                      onChange={(e) => setQuantity(item.id, Math.max(1, Number(e.target.value) || 1))}
                      className="w-20 rounded-lg border px-2 py-1 dark:border-slate-700 dark:bg-slate-800"
                    />
                  </label>
                  <button onClick={() => removeItem(item.id)} className="text-sm text-red-700 underline dark:text-red-400">
                    Remove
                  </button>
                </div>
                {item.quantity >= item.maxStock ? (
                  <p className="text-xs text-amber-700 dark:text-amber-300">Maximum available: {item.maxStock}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit space-y-3 rounded-xl border bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-semibold">Order summary</h2>
          <div className="flex justify-between text-sm">
            <span>Items ({count})</span>
            <span>{formatNaira(total)}</span>
          </div>
          <div className="flex justify-between border-t pt-3 font-bold dark:border-slate-800">
            <span>Total</span>
            <span>{formatNaira(total)}</span>
          </div>
          {user ? (
            <Link href="/checkout" className="block">
              <Button type="button" className="w-full">
                Go to checkout
              </Button>
            </Link>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              <Link href="/login" className="underline">
                Log in
              </Link>{" "}
              to check out. Your cart is saved on this device.
            </p>
          )}
        </aside>
      </div>

      <ConfirmationModal
        open={confirmClear}
        title="Clear your cart?"
        description="All items will be removed from your cart."
        confirmLabel="Clear cart"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          clear();
          setConfirmClear(false);
        }}
      />
    </div>
  );
}