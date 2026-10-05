"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useCart } from "@/context/cart-context";
import { formatNaira } from "@/lib/utils";
import type { Medicine } from "@/types/medicine";

const FALLBACK_IMAGE = "/images/pharmacy-hero.png";

export default function MedicineDetailsPage() {
  const params = useParams<{ id: string }>();
  const { addItem } = useCart();
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch(`/api/medicines/${params.id}`);
        const payload = await res.json();
        if (ignore) return;
        if (payload.success) setMedicine(payload.data);
        else setError(payload.message || "Medicine not found.");
      } catch {
        if (!ignore) setError("Could not load this medicine. Please try again.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    void load();
    return () => {
      ignore = true;
    };
  }, [params.id]);

  if (loading) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <LoadingSpinner label="Loading medicine..." />
      </div>
    );
  }

  if (error || !medicine) {
    return (
      <div className="space-y-3">
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {error || "Medicine not found."}
        </p>
        <Link href="/medicines" className="text-sm underline">
          Back to medicines
        </Link>
      </div>
    );
  }

  const inStock = medicine.isAvailable && medicine.quantityInStock > 0;
  const max = Math.max(1, medicine.quantityInStock);

  const add = () => {
    addItem(
      {
        id: medicine.id,
        name: medicine.name,
        price: Number(medicine.price),
        image: medicine.image,
        maxStock: medicine.quantityInStock,
      },
      quantity,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="space-y-5">
      <Link href="/medicines" className="text-sm underline">
        Back to medicines
      </Link>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="aspect-[4/3] overflow-hidden rounded-xl border bg-slate-100 dark:border-slate-800 dark:bg-slate-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={medicine.image || FALLBACK_IMAGE}
            alt={medicine.name}
            onError={(e) => {
              if (!e.currentTarget.src.endsWith(FALLBACK_IMAGE)) e.currentTarget.src = FALLBACK_IMAGE;
            }}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="space-y-4">
          <header>
            <h1 className="text-3xl font-bold">{medicine.name}</h1>
            <p className="text-slate-600 dark:text-slate-300">
              {medicine.genericName} · {medicine.dosage}
            </p>
          </header>

          <p className="text-3xl font-bold">{formatNaira(Number(medicine.price))}</p>

          <div className="flex flex-wrap gap-2 text-xs">
            {medicine.categoryName ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">{medicine.categoryName}</span>
            ) : null}
            <span
              className={`rounded-full px-2 py-0.5 ${
                inStock
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {inStock ? `${medicine.quantityInStock} in stock` : "Out of stock"}
            </span>
            {medicine.requiresPrescription ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Prescription required
              </span>
            ) : null}
          </div>

          {medicine.requiresPrescription ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              This medicine needs a valid prescription. Have it ready when your order is confirmed.
            </p>
          ) : null}

          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{medicine.description}</p>

          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-slate-500">Manufacturer</dt>
              <dd>{medicine.manufacturer}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Expiry date</dt>
              <dd>{new Date(medicine.expiryDate).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" })}</dd>
            </div>
          </dl>

          <div className="flex items-center gap-3 pt-2">
            <label className="flex items-center gap-2 text-sm">
              Quantity
              <input
                type="number"
                min={1}
                max={max}
                value={quantity}
                disabled={!inStock}
                onChange={(e) => setQuantity(Math.min(max, Math.max(1, Number(e.target.value) || 1)))}
                className="w-20 rounded-lg border px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800"
              />
            </label>
            <Button type="button" onClick={add} disabled={!inStock}>
              {added ? "Added to cart" : "Add to cart"}
            </Button>
            {added ? (
              <Link href="/cart" className="text-sm underline">
                View cart
              </Link>
            ) : null}
          </div>

          <p className="text-xs text-slate-500">
            General information only. Ask a pharmacist or doctor before taking any medicine.
          </p>
        </div>
      </div>
    </div>
  );
}