"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import { formatNaira } from "@/lib/utils";
import type { Medicine } from "@/types/medicine";

const FALLBACK_IMAGE = "/images/pharmacy-hero.png";

export function MedicineCard({ medicine }: { medicine: Medicine }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const inStock = medicine.isAvailable && medicine.quantityInStock > 0;

  const add = () => {
    addItem({
      id: medicine.id,
      name: medicine.name,
      price: Number(medicine.price),
      image: medicine.image,
      maxStock: medicine.quantityInStock,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border bg-white dark:border-slate-800 dark:bg-slate-900">
      <Link href={`/medicines/${medicine.id}`} className="block aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={medicine.image || FALLBACK_IMAGE}
          alt={medicine.name}
          loading="lazy"
          onError={(e) => {
            if (!e.currentTarget.src.endsWith(FALLBACK_IMAGE)) e.currentTarget.src = FALLBACK_IMAGE;
          }}
          className="h-full w-full object-cover"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <h3 className="font-semibold">
            <Link href={`/medicines/${medicine.id}`} className="hover:underline">
              {medicine.name}
            </Link>
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {medicine.genericName} · {medicine.dosage}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          {medicine.categoryName ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">{medicine.categoryName}</span>
          ) : null}
          {medicine.requiresPrescription ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              Prescription required
            </span>
          ) : null}
          <span
            className={`rounded-full px-2 py-0.5 ${
              inStock
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            }`}
          >
            {inStock ? "In stock" : "Out of stock"}
          </span>
        </div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <p className="text-lg font-bold">{formatNaira(Number(medicine.price))}</p>
          <Button type="button" onClick={add} disabled={!inStock} aria-live="polite">
            {added ? "Added" : "Add to cart"}
          </Button>
        </div>
      </div>
    </article>
  );
}